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

// A row grants while it exists, so a membership being maintained must survive the
// sweep however long ago it was first written. What matters is when EVE last
// confirmed it, not when the account joined.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_cleanUpExpiredMemberships_keepsWhatIsStillConfirmed(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	account := cleanupScratchAccount + "-current"
	corp := models.CorporationOwner(esiCorpRefA)
	cleanupMemberships(t, mongo, account)
	now := time.Now().UTC()

	if _, _, err := mongo.ReconcileEntityMemberships(ctx, account, []models.Owner{corp}, now); err != nil {
		t.Fatalf("reconcile: %v", err)
	}

	// Long past the deletion age as a join date, and confirmed a moment ago.
	if _, err := mongo.PlannerMemberships.Collection().UpdateOne(ctx,
		bson.M{"_id": planner.MembershipID(corp.Key(), account)},
		bson.M{"$set": bson.M{
			"joinedAt": now.Add(-eipmongo.DeleteMembershipsUnconfirmedFor - 365*24*time.Hour),
		}}); err != nil {
		t.Fatalf("backdate the join: %v", err)
	}

	if _, err := mongo.CleanUpExpiredMemberships(ctx, now); err != nil {
		t.Fatalf("CleanUpExpiredMemberships: %v", err)
	}
	if membershipRows(ctx, t, mongo, corp, account) != 1 {
		t.Fatal("a membership confirmed a moment ago was deleted")
	}
	assertReachable(ctx, t, mongo, account, corp, true)
}

// Past the point the token sweep abandons an account, nothing can confirm its
// memberships again, so the rows are removed and the access with them.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_cleanUpExpiredMemberships_removesWhatNothingCanConfirm(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	account := cleanupScratchAccount + "-abandoned"
	corp := models.CorporationOwner(esiCorpRefA)
	cleanupMemberships(t, mongo, account)
	now := time.Now().UTC()

	if _, _, err := mongo.ReconcileEntityMemberships(ctx, account, []models.Owner{corp}, now); err != nil {
		t.Fatalf("reconcile: %v", err)
	}
	assertReachable(ctx, t, mongo, account, corp, true)

	ageMembership(ctx, t, mongo, corp, account,
		now.Add(-eipmongo.DeleteMembershipsUnconfirmedFor-time.Hour))

	deleted, err := mongo.CleanUpExpiredMemberships(ctx, now)
	if err != nil {
		t.Fatalf("CleanUpExpiredMemberships: %v", err)
	}
	if deleted < 1 {
		t.Errorf("deleted = %d, want the abandoned row removed", deleted)
	}
	if membershipRows(ctx, t, mongo, corp, account) != 0 {
		t.Error("a row nothing can confirm survived")
	}
	// The deletion is what ends access: there is no separate expiry.
	assertReachable(ctx, t, mongo, account, corp, false)
}

// A row that has never been confirmed holds the zero time, which is older than
// any cutoff. Deleting on age alone would remove it before a reconcile could ever
// confirm it, so it waits.
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

	if _, err := mongo.CleanUpExpiredMemberships(ctx, now); err != nil {
		t.Fatalf("CleanUpExpiredMemberships: %v", err)
	}
	if membershipRows(ctx, t, mongo, corp, account) != 1 {
		t.Fatal("a row that was never confirmed was deleted before it could be")
	}

	// The next reconcile confirms it, and it is safe from then on.
	if _, _, err := mongo.ReconcileEntityMemberships(ctx, account,
		[]models.Owner{corp}, time.Now().UTC()); err != nil {
		t.Fatalf("reconfirm: %v", err)
	}
	if _, err := mongo.CleanUpExpiredMemberships(ctx, now); err != nil {
		t.Fatalf("CleanUpExpiredMemberships after reconfirm: %v", err)
	}
	if membershipRows(ctx, t, mongo, corp, account) != 1 {
		t.Error("a freshly confirmed row was deleted")
	}
}

// An owner membership is not confirmed by anything outside the planner, so it has
// no age at which it should go and the sweep must not reach it.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_cleanUpExpiredMemberships_leavesWhatNothingConfirms(t *testing.T) {
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

	// Older than every window, and never confirmed because there is nothing to
	// confirm it against.
	old := time.Now().UTC().Add(-eipmongo.DeleteMembershipsUnconfirmedFor - 365*24*time.Hour)
	if err := mongo.EnsureAccountPlanner(ctx, account, old); err != nil {
		t.Fatalf("EnsureAccountPlanner: %v", err)
	}

	if _, err := mongo.CleanUpExpiredMemberships(ctx, time.Now().UTC()); err != nil {
		t.Fatalf("CleanUpExpiredMemberships: %v", err)
	}
	if membershipRows(ctx, t, mongo, owner, account) != 1 {
		t.Error("the cleanup deleted a membership nothing outside the planner confirms")
	}
	assertReachable(ctx, t, mongo, account, owner, true)
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
