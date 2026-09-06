package maintenance

import (
	"context"
	"testing"

	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/worker/taskrun"
)

func depsMongoNil() *taskrun.Dependencies {
	return &taskrun.Dependencies{}
}

// Each of these runs against a dependency bag with no Mongo in it, so what is
// under test is that the task stops on what it genuinely needs rather than
// getting far enough to touch storage. A malformed or absent request never
// reaches a handler — the mux refuses it — so there is nothing here for that.
func TestMaintenanceTasksStopWithoutMongo(t *testing.T) {
	t.Parallel()
	ctx := context.Background()

	run := map[string]func() error{
		"cloud stored esi refresh": func() error {
			return CloudStoredEsiRefreshMaintenance(ctx,
				eipnats.CloudStoredEsiRefreshMaintenanceRequest{AccountID: "a"}, depsMongoNil())
		},
		"inactive account planner cleanup": func() error {
			return InactiveAccountPlannerCleanup(ctx,
				eipnats.InactiveAccountPlannerCleanupRequest{AccountID: "a"}, depsMongoNil())
		},
		"rotate refresh token keys": func() error {
			return RotateRefreshTokenKeys(ctx,
				eipnats.RotateRefreshTokenKeysRequest{AccountID: "a"}, depsMongoNil())
		},
	}

	for name, fn := range run {
		t.Run(name, func(t *testing.T) {
			err := fn()
			if err == nil || err.Error() != "mongo client is required" {
				t.Fatalf("got %v, want a refusal naming the missing mongo client", err)
			}
		})
	}
}

// A pass is complete when it knows what the account can still prove, which is
// not the same as every row surviving. EVE refusing a grant outright says the
// character is gone for good — a positive answer — so it must not block the
// reconcile that removes what that character was carrying. A transient failure
// must, because the answer is then genuinely unknown.
func TestCloudRefreshCompleteness(t *testing.T) {
	t.Parallel()

	for _, tc := range []struct {
		name     string
		stats    cloudEsiMaintainStats
		complete bool
	}{
		{
			name:     "every row refreshed",
			stats:    cloudEsiMaintainStats{RowsRefreshed: 2, AccessTokens: []string{"a", "b"}},
			complete: true,
		},
		{
			// The character is gone for good, so the account genuinely can prove
			// less than it could. Reconciling on that is the point.
			name:     "one grant refused outright",
			stats:    cloudEsiMaintainStats{RowsRefreshed: 1, RowsRemoved: 1, AccessTokens: []string{"a"}},
			complete: true,
		},
		{
			name:     "every grant refused",
			stats:    cloudEsiMaintainStats{RowsRemoved: 2},
			complete: true,
		},
		{
			name:     "one row failed transiently",
			stats:    cloudEsiMaintainStats{RowsRefreshed: 1, RowsFailed: 1, AccessTokens: []string{"a"}},
			complete: false,
		},
		{
			// Refreshed but yielded no token: nothing to check affiliations with.
			name:     "a refresh produced no token",
			stats:    cloudEsiMaintainStats{RowsRefreshed: 2, AccessTokens: []string{"a"}},
			complete: false,
		},
	} {
		if got := tc.stats.knowsWhatTheAccountCanProve(); got != tc.complete {
			t.Errorf("%s: complete = %v, want %v", tc.name, got, tc.complete)
		}
	}
}
