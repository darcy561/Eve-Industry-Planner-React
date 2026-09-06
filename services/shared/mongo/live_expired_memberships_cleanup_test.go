package mongo_test

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"
	eipmongo "eve-industry-planner/shared/mongo"
	"eve-industry-planner/testing/mongolive"

	"go.mongodb.org/mongo-driver/v2/bson"
)

const cleanupScratchAccount = "eip-parity-membership-cleanup-account"

// The gap between StaleAfter and DeleteExpiredAfter is the point: a row stops granting at
// the first and is forgotten at the second, so access lost to an outage comes
// back on the next confirmation rather than needing a fresh invitation.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_cleanUpExpiredMemberships_keepsWhatCanStillComeBack(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	account := cleanupScratchAccount + "-window"
	corp := models.CorporationOwner(esiCorpRefA)
	cleanupMemberships(t, mongo, account)
	now := time.Now().UTC()

	if _, _, err := mongo.ReconcileEntityMemberships(ctx, account, []models.Owner{corp}, now); err != nil {
		t.Fatalf("reconcile: %v", err)
	}

	// Past the point it stops granting, well short of the point it is forgotten.
	ageMembership(ctx, t, mongo, corp, account, now.Add(-planner.StaleAfter-time.Hour))
	assertReachable(ctx, t, mongo, account, corp, false)

	stale, err := mongo.CountStaleMemberships(ctx, now)
	if err != nil {
		t.Fatalf("CountStaleMemberships: %v", err)
	}
	if stale < 1 {
		t.Errorf("stale count = %d, want the row counted", stale)
	}

	if _, err := mongo.CleanUpExpiredMemberships(ctx, now); err != nil {
		t.Fatalf("CleanUpExpiredMemberships: %v", err)
	}
	if membershipRows(ctx, t, mongo, corp, account) != 1 {
		t.Fatal("a row that stopped granting was deleted before it could come back")
	}

	// Confirming it again restores access, which is what keeping it buys.
	if _, _, err := mongo.ReconcileEntityMemberships(ctx, account,
		[]models.Owner{corp}, time.Now().UTC()); err != nil {
		t.Fatalf("reconfirm: %v", err)
	}
	assertReachable(ctx, t, mongo, account, corp, true)
}

// Past DeleteExpiredAfter the row is housekeeping and goes.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_cleanUpExpiredMemberships_deletesWhatWillNot(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	account := cleanupScratchAccount + "-old"
	corp := models.CorporationOwner(esiCorpRefA)
	cleanupMemberships(t, mongo, account)
	now := time.Now().UTC()

	if _, _, err := mongo.ReconcileEntityMemberships(ctx, account, []models.Owner{corp}, now); err != nil {
		t.Fatalf("reconcile: %v", err)
	}
	ageMembership(ctx, t, mongo, corp, account, now.Add(-eipmongo.DeleteExpiredAfter-time.Hour))

	deleted, err := mongo.CleanUpExpiredMemberships(ctx, now)
	if err != nil {
		t.Fatalf("CleanUpExpiredMemberships: %v", err)
	}
	if deleted < 1 {
		t.Errorf("deleted = %d, want the aged row removed", deleted)
	}
	if membershipRows(ctx, t, mongo, corp, account) != 0 {
		t.Error("a row past the cleanup window survived")
	}
}

// An owner membership has no age at which it should go: nothing outside the
// planner can revoke it, so it never goes stale and the cleanup must not reach it.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_cleanUpExpiredMemberships_leavesWhatNeverExpires(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	account := cleanupScratchAccount + "-owner"
	owner := models.AccountOwner(account)
	cleanupMemberships(t, mongo, account)
	t.Cleanup(func() {
		cleanupCtx, cancelCleanup := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancelCleanup()
		_, _ = mongo.Planners.Collection().DeleteOne(cleanupCtx, bson.M{"_id": owner.Key()})
		_, _ = mongo.PlannerSettings.Collection().DeleteOne(cleanupCtx, bson.M{"_id": owner.Key()})
	})

	// Older than every window, and never validated because there is nothing to
	// validate it against.
	old := time.Now().UTC().Add(-eipmongo.DeleteExpiredAfter - 365*24*time.Hour)
	if err := mongo.EnsureAccountPlanner(ctx, account, old); err != nil {
		t.Fatalf("EnsureAccountPlanner: %v", err)
	}

	if _, err := mongo.CleanUpExpiredMemberships(ctx, time.Now().UTC()); err != nil {
		t.Fatalf("CleanUpExpiredMemberships: %v", err)
	}
	if membershipRows(ctx, t, mongo, owner, account) != 1 {
		t.Error("the cleanup deleted a membership that never expires")
	}
	assertReachable(ctx, t, mongo, account, owner, true)
}

// A row that has never been confirmed holds the zero time, which is older than
// any cutoff. Deleting on age alone would delete it before a reconcile could ever
// confirm it — so it stops granting, which is correct, and waits.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_cleanUpExpiredMemberships_waitsForARowNeverConfirmed(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	account := cleanupScratchAccount + "-unconfirmed"
	corp := models.CorporationOwner(esiCorpRefA)
	cleanupMemberships(t, mongo, account)
	now := time.Now().UTC()

	if _, _, err := mongo.ReconcileEntityMemberships(ctx, account, []models.Owner{corp}, now); err != nil {
		t.Fatalf("reconcile: %v", err)
	}
	// The shape a row written before validation was recorded holds.
	ageMembership(ctx, t, mongo, corp, account, time.Time{})

	assertReachable(ctx, t, mongo, account, corp, false)
	if _, err := mongo.CleanUpExpiredMemberships(ctx, now); err != nil {
		t.Fatalf("CleanUpExpiredMemberships: %v", err)
	}
	if membershipRows(ctx, t, mongo, corp, account) != 1 {
		t.Fatal("a row that was never confirmed was deleted before it could be")
	}

	// The next reconcile confirms it, and it grants again.
	if _, _, err := mongo.ReconcileEntityMemberships(ctx, account,
		[]models.Owner{corp}, time.Now().UTC()); err != nil {
		t.Fatalf("reconfirm: %v", err)
	}
	assertReachable(ctx, t, mongo, account, corp, true)
}

func ageMembership(ctx context.Context, t *testing.T, mongo *eipmongo.Mongo, owner models.Owner, account string, at time.Time) {
	t.Helper()
	if _, err := mongo.PlannerMemberships.Collection().UpdateOne(ctx,
		bson.M{"_id": planner.MembershipID(owner.Key(), account)},
		bson.M{"$set": bson.M{"joinMethod.entityMember.validatedAt": at}}); err != nil {
		t.Fatalf("age the row: %v", err)
	}
}

func membershipRows(ctx context.Context, t *testing.T, mongo *eipmongo.Mongo, owner models.Owner, account string) int64 {
	t.Helper()
	count, err := mongo.PlannerMemberships.Collection().CountDocuments(ctx,
		bson.M{"_id": planner.MembershipID(owner.Key(), account)})
	if err != nil {
		t.Fatalf("count rows: %v", err)
	}
	return count
}
