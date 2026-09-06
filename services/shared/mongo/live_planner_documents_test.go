package mongo_test

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"
	"eve-industry-planner/testing/mongolive"

	"go.mongodb.org/mongo-driver/v2/bson"
)

const plannerScratchAccount = "eip-parity-plannerDoc-account"

// A plannerDoc and its membership row have to survive a write and a read: the owner
// key is the plannerDoc's _id, and the membership's _id is composed from it, so a
// separator or an encoding fault shows up here rather than at the backfill.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_plannerAndMembership_roundTrip(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	owner := models.AccountOwner(plannerScratchAccount)
	plannerID := owner.Key()
	membershipID := planner.MembershipID(plannerID, plannerScratchAccount)

	t.Cleanup(func() {
		cleanupCtx, cancelCleanup := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancelCleanup()
		_, _ = mongo.Planners.Collection().DeleteMany(cleanupCtx, bson.M{"_id": plannerID})
		_, _ = mongo.PlannerMemberships.Collection().DeleteMany(cleanupCtx, bson.M{"_id": membershipID})
	})

	plannerDoc := planner.Planner{
		ID:            plannerID,
		SchemaVersion: planner.SchemaCurrent,
		Name:          "Round trip",
		MemberCount:   1,
		CreatedBy:     plannerScratchAccount,
	}
	plannerDoc.MetaData.Owner = owner
	if _, err := mongo.Planners.UpsertStructPreservingMeta(ctx, plannerDoc, plannerDoc.ID); err != nil {
		t.Fatalf("write plannerDoc: %v", err)
	}

	membership := planner.Membership{
		ID:            membershipID,
		SchemaVersion: planner.MembershipSchemaCurrent,
		PlannerID:     plannerID,
		AccountID:     plannerScratchAccount,
		JoinedAt:      time.Now().UTC().Truncate(time.Millisecond),
		JoinMethod:    planner.JoinMethod{Self: &planner.SelfJoin{}},
	}
	if err := membership.JoinMethod.Validate(); err != nil {
		t.Fatalf("membership is not writable: %v", err)
	}
	if _, err := mongo.PlannerMemberships.UpsertStructPreservingMeta(ctx, membership, membership.ID); err != nil {
		t.Fatalf("write membership: %v", err)
	}

	var readBack planner.Planner
	if err := mongo.Planners.Collection().FindOne(ctx, bson.M{"_id": plannerID}).Decode(&readBack); err != nil {
		t.Fatalf("read plannerDoc: %v", err)
	}
	gotOwner, err := readBack.Owner()
	if err != nil {
		t.Fatalf("plannerDoc id does not parse as an owner: %v", err)
	}
	if gotOwner != owner {
		t.Fatalf("owner from stored id = %v, want %v", gotOwner, owner)
	}
	if readBack.Shared() {
		t.Fatal("a one-member plannerDoc must not report as shared")
	}

	var storedMembership planner.Membership
	if err := mongo.PlannerMemberships.Collection().FindOne(ctx, bson.M{"_id": membershipID}).Decode(&storedMembership); err != nil {
		t.Fatalf("read membership: %v", err)
	}
	if got := storedMembership.JoinMethod.Kind(); got != planner.JoinKindSelf {
		t.Fatalf("join kind = %q, want %q", got, planner.JoinKindSelf)
	}
	gotPlanner, gotAccount, ok := planner.SplitMembershipID(storedMembership.ID)
	if !ok || gotPlanner != plannerID || gotAccount != plannerScratchAccount {
		t.Fatalf("stored row id %q did not split back to (%q, %q)", storedMembership.ID, plannerID, plannerScratchAccount)
	}

	// The row is found by both request-path directions, which is what its two
	// indexes exist to serve.
	byAccount, err := mongo.PlannerMemberships.Collection().CountDocuments(ctx, bson.M{"accountID": plannerScratchAccount})
	if err != nil || byAccount == 0 {
		t.Fatalf("lookup by accountID found %d rows (err %v)", byAccount, err)
	}
	byPlanner, err := mongo.PlannerMemberships.Collection().CountDocuments(ctx, bson.M{"plannerID": plannerID})
	if err != nil || byPlanner == 0 {
		t.Fatalf("lookup by plannerID found %d rows (err %v)", byPlanner, err)
	}
}

// Re-running the backfill, or logging in again, must not undo what the account
// has since changed: both go through EnsureAccountPlanner, which writes on insert
// only. Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_ensureAccountPlanner_isInsertOnly(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	const accountID = "eip-parity-ensure-account"
	owner := models.AccountOwner(accountID)
	plannerID := owner.Key()
	membershipID := planner.MembershipID(plannerID, accountID)

	t.Cleanup(func() {
		cleanupCtx, cancelCleanup := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancelCleanup()
		_, _ = mongo.Planners.Collection().DeleteMany(cleanupCtx, bson.M{"_id": plannerID})
		_, _ = mongo.PlannerMemberships.Collection().DeleteMany(cleanupCtx, bson.M{"_id": membershipID})
	})

	now := time.Now().UTC()
	if held, err := mongo.Planners.Collection().CountDocuments(ctx, bson.M{"_id": plannerID}); err != nil || held != 0 {
		t.Fatalf("planners holding %s before create = %d (err %v), want none", plannerID, held, err)
	}
	if err := mongo.EnsureAccountPlanner(ctx, accountID, now); err != nil {
		t.Fatalf("first EnsureAccountPlanner: %v", err)
	}
	if held, err := mongo.Planners.Collection().CountDocuments(ctx, bson.M{"_id": plannerID}); err != nil || held != 1 {
		t.Fatalf("planners holding %s after create = %d (err %v), want one", plannerID, held, err)
	}

	// The account renames its plannerDoc, as it is entitled to.
	if _, err := mongo.Planners.Collection().UpdateOne(ctx,
		bson.M{"_id": plannerID},
		bson.M{"$set": bson.M{"name": "Renamed by its owner"}},
	); err != nil {
		t.Fatalf("rename plannerDoc: %v", err)
	}

	if err := mongo.EnsureAccountPlanner(ctx, accountID, now.Add(time.Hour)); err != nil {
		t.Fatalf("second EnsureAccountPlanner: %v", err)
	}

	var readBack planner.Planner
	if err := mongo.Planners.Collection().FindOne(ctx, bson.M{"_id": plannerID}).Decode(&readBack); err != nil {
		t.Fatalf("read plannerDoc: %v", err)
	}
	if readBack.Name != "Renamed by its owner" {
		t.Fatalf("plannerDoc name = %q, want the rename to survive a repeat call", readBack.Name)
	}

	rows, err := mongo.PlannerMemberships.Collection().CountDocuments(ctx, bson.M{"plannerID": plannerID})
	if err != nil {
		t.Fatalf("count memberships: %v", err)
	}
	if rows != 1 {
		t.Fatalf("membership rows = %d, want exactly one after two calls", rows)
	}
}

// Each half is repaired on its own. A plannerDoc whose membership row was deleted
// regains the row, and a membership row whose plannerDoc was deleted regains the
// plannerDoc — so a bad delete heals on the account's next login or refresh rather
// than needing a command run against it. Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_ensureAccountPlanner_repairsEitherHalfAlone(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	const accountID = "eip-parity-repair-account"
	plannerID := models.AccountOwner(accountID).Key()
	membershipID := planner.MembershipID(plannerID, accountID)

	t.Cleanup(func() {
		cleanupCtx, cancelCleanup := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancelCleanup()
		_, _ = mongo.Planners.Collection().DeleteMany(cleanupCtx, bson.M{"_id": plannerID})
		_, _ = mongo.PlannerMemberships.Collection().DeleteMany(cleanupCtx, bson.M{"_id": membershipID})
	})

	now := time.Now().UTC()
	if err := mongo.EnsureAccountPlanner(ctx, accountID, now); err != nil {
		t.Fatalf("create: %v", err)
	}

	// The membership row goes; the plannerDoc stays and keeps a rename, so the repair
	// is visibly restoring the missing half rather than rewriting the pair.
	if _, err := mongo.Planners.Collection().UpdateOne(ctx,
		bson.M{"_id": plannerID}, bson.M{"$set": bson.M{"name": "Kept through the repair"}}); err != nil {
		t.Fatalf("rename plannerDoc: %v", err)
	}
	if _, err := mongo.PlannerMemberships.Collection().DeleteOne(ctx, bson.M{"_id": membershipID}); err != nil {
		t.Fatalf("delete membership: %v", err)
	}
	if err := mongo.EnsureAccountPlanner(ctx, accountID, now); err != nil {
		t.Fatalf("repair membership: %v", err)
	}

	var membership planner.Membership
	if err := mongo.PlannerMemberships.Collection().FindOne(ctx, bson.M{"_id": membershipID}).Decode(&membership); err != nil {
		t.Fatalf("membership was not restored: %v", err)
	}
	if got := membership.JoinMethod.Kind(); got != planner.JoinKindSelf {
		t.Fatalf("restored join kind = %q, want %q", got, planner.JoinKindSelf)
	}
	var plannerDoc planner.Planner
	if err := mongo.Planners.Collection().FindOne(ctx, bson.M{"_id": plannerID}).Decode(&plannerDoc); err != nil {
		t.Fatalf("read plannerDoc: %v", err)
	}
	if plannerDoc.Name != "Kept through the repair" {
		t.Fatalf("plannerDoc name = %q, want the repair to leave the surviving half alone", plannerDoc.Name)
	}

	// Now the other way round: the plannerDoc goes, the membership row stays.
	if _, err := mongo.Planners.Collection().DeleteOne(ctx, bson.M{"_id": plannerID}); err != nil {
		t.Fatalf("delete plannerDoc: %v", err)
	}
	if err := mongo.EnsureAccountPlanner(ctx, accountID, now); err != nil {
		t.Fatalf("repair plannerDoc: %v", err)
	}
	if err := mongo.Planners.Collection().FindOne(ctx, bson.M{"_id": plannerID}).Decode(&plannerDoc); err != nil {
		t.Fatalf("plannerDoc was not restored: %v", err)
	}
	rows, err := mongo.PlannerMemberships.Collection().CountDocuments(ctx, bson.M{"plannerID": plannerID})
	if err != nil {
		t.Fatalf("count memberships: %v", err)
	}
	if rows != 1 {
		t.Fatalf("membership rows = %d, want the surviving row not to be duplicated", rows)
	}
}

// Grants come from membership rows, so what an account may reach is exactly the
// planners it holds a row for — and an owner it holds no row for is refused even
// while its session's cached grants might still name it.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_ownerKeysForAccount_areTheAccountsMemberships(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	const accountID = "eip-parity-grants-account"
	ownPlanner := models.AccountOwner(accountID).Key()
	sharedPlanner := "plannerDoc:01HZY6R3QK7T9V2M4N8P0XW5AB"
	sharedRow := planner.MembershipID(sharedPlanner, accountID)

	t.Cleanup(func() {
		cleanupCtx, cancelCleanup := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancelCleanup()
		_, _ = mongo.Planners.Collection().DeleteMany(cleanupCtx, bson.M{"_id": ownPlanner})
		_, _ = mongo.PlannerMemberships.Collection().DeleteMany(cleanupCtx, bson.M{"accountID": accountID})
	})

	if err := mongo.EnsureAccountPlanner(ctx, accountID, time.Now().UTC()); err != nil {
		t.Fatalf("create own plannerDoc: %v", err)
	}

	granted, err := mongo.OwnerKeysForAccount(ctx, accountID)
	if err != nil {
		t.Fatalf("OwnerKeysForAccount: %v", err)
	}
	if !granted.Has(models.AccountOwner(accountID)) {
		t.Fatalf("granted = %v, want the account's own plannerDoc", granted)
	}
	if len(granted) != 1 {
		t.Fatalf("granted = %v, want only the account's own plannerDoc", granted)
	}

	// A membership in someone else's plannerDoc is a grant; nothing else changes.
	if _, err := mongo.PlannerMemberships.Collection().InsertOne(ctx, bson.M{
		"_id":           sharedRow,
		"schemaVersion": planner.MembershipSchemaCurrent,
		"plannerID":     sharedPlanner,
		"accountID":     accountID,
		"joinedAt":      time.Now().UTC(),
		"joinMethod":    bson.M{"invite": bson.M{"invitedBy": "someone", "issuedAt": time.Now().UTC()}},
	}); err != nil {
		t.Fatalf("join shared plannerDoc: %v", err)
	}

	granted, err = mongo.OwnerKeysForAccount(ctx, accountID)
	if err != nil {
		t.Fatalf("OwnerKeysForAccount after join: %v", err)
	}
	if len(granted) != 2 {
		t.Fatalf("granted = %v, want the account's own plannerDoc and the shared one", granted)
	}

	// The authorisation point reads the rows, not a cached grant list, so removing
	// the row refuses the owner immediately.
	mayReach, err := mongo.AccountMayReach(ctx, accountID, models.Owner{Kind: models.OwnerPlanner, ID: "01HZY6R3QK7T9V2M4N8P0XW5AB"})
	if err != nil {
		t.Fatalf("AccountMayReach: %v", err)
	}
	if !mayReach {
		t.Fatal("a member must reach the plannerDoc it holds a row for")
	}
	if _, err := mongo.PlannerMemberships.Collection().DeleteOne(ctx, bson.M{"_id": sharedRow}); err != nil {
		t.Fatalf("leave shared plannerDoc: %v", err)
	}
	mayReach, err = mongo.AccountMayReach(ctx, accountID, models.Owner{Kind: models.OwnerPlanner, ID: "01HZY6R3QK7T9V2M4N8P0XW5AB"})
	if err != nil {
		t.Fatalf("AccountMayReach after leave: %v", err)
	}
	if mayReach {
		t.Fatal("a removed member must be refused on the next read, not at the next login")
	}
}

// A document names its owner, and the owner is read rather than assumed to be
// whoever is asking — which is what lets a plannerDoc-held document be reached by a
// member who did not write it. Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_ownerOfDocument_readsTheStoredOwner(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	const docID = "eip-parity-doc-owner-job"
	sharedPlanner := models.Owner{Kind: models.OwnerPlanner, ID: "01HZY6R3QK7T9V2M4N8P0XW5AC"}

	t.Cleanup(func() {
		cleanupCtx, cancelCleanup := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancelCleanup()
		_, _ = mongo.JobDocuments.Collection().DeleteMany(cleanupCtx, bson.M{"_id": docID})
	})

	if _, err := mongo.JobDocuments.Collection().InsertOne(ctx, bson.M{
		"_id": docID,
		"_meta": bson.M{
			"owner":        bson.M{"kind": string(sharedPlanner.Kind), "id": sharedPlanner.ID},
			"lastModified": time.Now().UTC(),
		},
	}); err != nil {
		t.Fatalf("write document: %v", err)
	}

	got, err := mongo.JobDocuments.OwnerOfDocument(ctx, docID)
	if err != nil {
		t.Fatalf("OwnerOfDocument: %v", err)
	}
	if got != sharedPlanner {
		t.Fatalf("owner = %v, want %v — the plannerDoc that holds it, not the writer", got, sharedPlanner)
	}

	// A document that does not exist names no owner rather than erroring, so the
	// caller refuses rather than treating a missing document as an error.
	missing, err := mongo.JobDocuments.OwnerOfDocument(ctx, "eip-parity-doc-owner-absent")
	if err != nil {
		t.Fatalf("OwnerOfDocument for a missing document: %v", err)
	}
	if !missing.IsZero() {
		t.Fatalf("missing document reported owner %v, want the zero owner", missing)
	}
}
