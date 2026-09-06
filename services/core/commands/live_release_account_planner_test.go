package commands

import (
	"context"
	"strings"
	"testing"
	"time"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"
	"eve-industry-planner/shared/stackservices"
	"eve-industry-planner/testing/mongolive"

	"go.mongodb.org/mongo-driver/v2/bson"
)

const releaseScratchAccount = "eip-parity-release-account"

// The backfill runs against accounts in whatever state the database left them,
// which is what a step written against one state gets wrong. Each of these is a
// state a real account has been in.
//
// The step takes no scope, so running it here ensures every account in the
// database and not only the scratch one. That is safe because every write it
// makes is insert-only — an account that is already complete gets a no-op — and
// it is the same call an operator makes with `eip cli -- prepareRelease`.
//
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_backfillAccountPlanners_completesEveryPartialState(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	clients := &stackservices.Clients{Mongo: mongo}
	now := time.Now().UTC()

	states := []struct {
		name    string
		suffix  string
		prepare func(t *testing.T, account string, owner models.Owner)
	}{
		{
			name:    "nothing but a user row",
			suffix:  "-bare",
			prepare: func(t *testing.T, account string, owner models.Owner) {},
		},
		{
			// The state every account was in after the planner backfill ran and
			// before planner settings existed.
			name:   "a planner with no settings",
			suffix: "-no-settings",
			prepare: func(t *testing.T, account string, owner models.Owner) {
				if err := mongo.EnsureAccountPlanner(ctx, account, now); err != nil {
					t.Fatalf("establish the planner: %v", err)
				}
				if _, err := mongo.PlannerSettings.Collection().
					DeleteOne(ctx, bson.M{"_id": owner.Key()}); err != nil {
					t.Fatalf("remove planner settings: %v", err)
				}
			},
		},
		{
			name:   "a planner with no membership row",
			suffix: "-no-membership",
			prepare: func(t *testing.T, account string, owner models.Owner) {
				if err := mongo.EnsureAccountPlanner(ctx, account, now); err != nil {
					t.Fatalf("establish the planner: %v", err)
				}
				if _, err := mongo.PlannerMemberships.Collection().DeleteOne(ctx,
					bson.M{"_id": planner.MembershipID(owner.Key(), account)}); err != nil {
					t.Fatalf("remove the membership row: %v", err)
				}
			},
		},
		{
			// An account with no settings document of its own: the seed has
			// nothing to read, and must fall back rather than fail the step.
			name:   "no account settings to seed from",
			suffix: "-no-account-settings",
			prepare: func(t *testing.T, account string, owner models.Owner) {
				if _, err := mongo.ApplicationSettings.Collection().
					DeleteOne(ctx, bson.M{"_id": account}); err != nil {
					t.Fatalf("remove account settings: %v", err)
				}
			},
		},
	}

	for _, state := range states {
		t.Run(state.name, func(t *testing.T) {
			account := releaseScratchAccount + state.suffix
			owner := models.AccountOwner(account)
			mongolive.ScratchAccount(t, mongo, account)

			// The step reads the account list from `users`, so the account has to
			// hold one to be visited at all.
			userDoc := models.DefaultUserAccountDocument(account, now)
			if _, _, err := mongo.Users.UpsertUserAccount(ctx, account, userDoc); err != nil {
				t.Fatalf("write the user row: %v", err)
			}
			state.prepare(t, account, owner)

			if _, err := backfillAccountPlanners(ctx, clients, false); err != nil {
				t.Fatalf("backfillAccountPlanners: %v", err)
			}

			for _, present := range []struct {
				name  string
				count func() (int64, error)
			}{
				{"planner", func() (int64, error) {
					return mongo.Planners.Collection().
						CountDocuments(ctx, bson.M{"_id": owner.Key()})
				}},
				{"membership", func() (int64, error) {
					return mongo.PlannerMemberships.Collection().CountDocuments(ctx,
						bson.M{"_id": planner.MembershipID(owner.Key(), account)})
				}},
				{"planner settings", func() (int64, error) {
					return mongo.PlannerSettings.Collection().
						CountDocuments(ctx, bson.M{"_id": owner.Key()})
				}},
			} {
				count, err := present.count()
				if err != nil {
					t.Fatalf("count %s: %v", present.name, err)
				}
				if count == 0 {
					t.Errorf("after the backfill, %s is still missing", present.name)
				}
			}
		})
	}
}

// A dry run reports without writing, which is what makes it safe to read before
// a release window rather than after one.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_backfillAccountPlanners_dryRunWritesNothing(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	account := releaseScratchAccount + "-dry"
	owner := models.AccountOwner(account)
	mongolive.ScratchAccount(t, mongo, account)

	userDoc := models.DefaultUserAccountDocument(account, time.Now().UTC())
	if _, _, err := mongo.Users.UpsertUserAccount(ctx, account, userDoc); err != nil {
		t.Fatalf("write the user row: %v", err)
	}

	report, err := backfillAccountPlanners(ctx, &stackservices.Clients{Mongo: mongo}, true)
	if err != nil {
		t.Fatalf("backfillAccountPlanners dry run: %v", err)
	}
	if !strings.Contains(report, "would be ensured") {
		t.Errorf("dry run report = %q, want it to say what it would do", report)
	}

	count, err := mongo.Planners.Collection().CountDocuments(ctx, bson.M{"_id": owner.Key()})
	if err != nil {
		t.Fatalf("count planners: %v", err)
	}
	if count != 0 {
		t.Error("a dry run created a planner")
	}
}
