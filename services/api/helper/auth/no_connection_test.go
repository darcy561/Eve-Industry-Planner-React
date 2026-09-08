package auth

import (
	"context"
	"testing"

	eipredis "eve-industry-planner/shared/redis"
)

// The maintenance sweeps skip quietly when Redis is not configured: a sweep with
// nothing to sweep is not a failure, and the loop that runs them logs what they
// return. A handle is not a connection, so these guards check the connection —
// checking the handle passes for one that has none, and the sweep then reports
// ErrNoClient on every pass.
func TestMaintenanceSweepsSkipQuietlyWithoutAConnection(t *testing.T) {
	ctx := context.Background()
	r := eipredis.NewRedis(nil)
	opts := SessionCleanupOptions{}

	for name, call := range map[string]func() error{
		"prune account sessions": func() error {
			_, err := PruneAllAccountSessionsRecords(ctx, r)
			return err
		},
		"cleanup orphan session indexes": func() error {
			_, err := CleanupOrphanSessionIndexes(ctx, r, opts)
			return err
		},
		"cleanup orphan refresh tokens": func() error {
			_, err := CleanupOrphanRefreshTokens(ctx, r, opts)
			return err
		},
		"the whole maintenance pass": func() error {
			_, err := RunAuthSessionMaintenance(ctx, r, opts)
			return err
		},
	} {
		t.Run(name, func(t *testing.T) {
			if err := call(); err != nil {
				t.Errorf("%s with no connection = %v, want a quiet skip", name, err)
			}
		})
	}
}

// The operations that do report a failure report the same value whether the
// guard caught it or the call fell through to the core.
func TestSessionOperationsReportNoClientConsistently(t *testing.T) {
	ctx := context.Background()
	r := eipredis.NewRedis(nil)

	for name, call := range map[string]func() error{
		"refresh token read": func() error {
			_, err := GetRefreshTokenData(ctx, r, "tok")
			return err
		},
		"refresh token revoke": func() error { return RevokeRefreshToken(ctx, r, "tok") },
		"grants repair": func() error {
			_, err := RepairSessionGrants(ctx, r, true)
			return err
		},
	} {
		t.Run(name, func(t *testing.T) {
			if err := call(); err == nil {
				t.Errorf("%s with no connection reported success", name)
			}
		})
	}
}
