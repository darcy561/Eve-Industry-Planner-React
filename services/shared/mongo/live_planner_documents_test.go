package mongo_test

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/testing/mongolive"

	"go.mongodb.org/mongo-driver/v2/bson"
)

const plannerScratchAccount = "eip-parity-planner-account"

// A planner and its membership row have to survive a write and a read: the owner
// key is the planner's _id, and the membership's _id is composed from it, so a
// separator or an encoding fault shows up here rather than at the backfill.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_plannerAndMembership_roundTrip(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	owner := models.AccountOwner(plannerScratchAccount)
	plannerID := owner.Key()
	membershipID := models.PlannerMembershipID(plannerID, plannerScratchAccount)

	t.Cleanup(func() {
		cleanupCtx, cancelCleanup := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancelCleanup()
		_, _ = mongo.Planners.Collection().DeleteMany(cleanupCtx, bson.M{"_id": plannerID})
		_, _ = mongo.PlannerMemberships.Collection().DeleteMany(cleanupCtx, bson.M{"_id": membershipID})
	})

	planner := models.Planner{
		ID:            plannerID,
		SchemaVersion: models.PlannerSchemaCurrent,
		Name:          "Round trip",
		MemberCount:   1,
		CreatedBy:     plannerScratchAccount,
	}
	planner.MetaData.Owner = owner
	if _, err := mongo.Planners.UpsertStructPreservingMeta(ctx, planner, planner.ID); err != nil {
		t.Fatalf("write planner: %v", err)
	}

	membership := models.PlannerMembership{
		ID:            membershipID,
		SchemaVersion: models.PlannerMembershipSchemaCurrent,
		PlannerID:     plannerID,
		AccountID:     plannerScratchAccount,
		JoinedAt:      time.Now().UTC().Truncate(time.Millisecond),
		JoinMethod:    models.JoinMethod{Self: &models.SelfJoin{}},
	}
	if err := membership.JoinMethod.Validate(); err != nil {
		t.Fatalf("membership is not writable: %v", err)
	}
	if _, err := mongo.PlannerMemberships.UpsertStructPreservingMeta(ctx, membership, membership.ID); err != nil {
		t.Fatalf("write membership: %v", err)
	}

	var readBack models.Planner
	if err := mongo.Planners.Collection().FindOne(ctx, bson.M{"_id": plannerID}).Decode(&readBack); err != nil {
		t.Fatalf("read planner: %v", err)
	}
	gotOwner, err := readBack.Owner()
	if err != nil {
		t.Fatalf("planner id does not parse as an owner: %v", err)
	}
	if gotOwner != owner {
		t.Fatalf("owner from stored id = %v, want %v", gotOwner, owner)
	}
	if readBack.Shared() {
		t.Fatal("a one-member planner must not report as shared")
	}

	var storedMembership models.PlannerMembership
	if err := mongo.PlannerMemberships.Collection().FindOne(ctx, bson.M{"_id": membershipID}).Decode(&storedMembership); err != nil {
		t.Fatalf("read membership: %v", err)
	}
	if got := storedMembership.JoinMethod.Kind(); got != models.JoinKindSelf {
		t.Fatalf("join kind = %q, want %q", got, models.JoinKindSelf)
	}
	gotPlanner, gotAccount, ok := models.SplitPlannerMembershipID(storedMembership.ID)
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
