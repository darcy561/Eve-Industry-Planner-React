package maintenance

import (
	"context"
	"errors"
	"testing"
	"time"

	"eve-industry-planner/shared/plannersession"
	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/redisfixture"
)

func TestOptionsFromEnvReadsTheDryRunSwitch(t *testing.T) {
	for _, v := range []string{"true", "1", "yes", "YES"} {
		t.Setenv("AUTH_SESSION_CLEANUP_DRY_RUN", v)
		if !OptionsFromEnv().DryRun {
			t.Fatalf("%q should enable dry run", v)
		}
	}
	t.Setenv("AUTH_SESSION_CLEANUP_DRY_RUN", "no")
	if OptionsFromEnv().DryRun {
		t.Fatal("anything else leaves the sweep armed")
	}
}

func TestRunRevokesTokensNoSessionHolds(t *testing.T) {
	ctx := context.Background()
	r := redisfixture.New(t)
	store := plannersession.NewStore(r.Handle)

	if err := store.PutRefreshToken(ctx, "orphan", plannersession.RefreshTokenData{
		AccountID: "acct", SessionID: "gone",
	}); err != nil {
		t.Fatalf("seed orphan: %v", err)
	}

	stats, err := Run(ctx, store, Options{})
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if stats.OrphanRefreshTokensFound != 1 || stats.OrphanRefreshTokensRemoved != 1 {
		t.Fatalf("stats = %+v, want one found and removed", stats)
	}
	if _, found, _ := store.RefreshToken(ctx, "orphan"); found {
		t.Fatal("the orphan token survived the sweep")
	}
}

func TestRunKeepsATokenItsSessionStillHolds(t *testing.T) {
	ctx := context.Background()
	r := redisfixture.New(t)
	store := plannersession.NewStore(r.Handle)

	now := time.Now().UTC()
	if err := store.PutSession(ctx, "acct", plannersession.Session{
		SessionID: "sess", StartedAt: now, LastSeenAt: now,
	}); err != nil {
		t.Fatalf("seed session: %v", err)
	}
	if err := store.PutRefreshToken(ctx, "live", plannersession.RefreshTokenData{
		AccountID: "acct", SessionID: "sess",
	}); err != nil {
		t.Fatalf("seed token: %v", err)
	}

	stats, err := Run(ctx, store, Options{})
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if stats.OrphanRefreshTokensFound != 0 {
		t.Fatalf("stats = %+v — a live token was swept", stats)
	}
	if _, found, _ := store.RefreshToken(ctx, "live"); !found {
		t.Fatal("the sweep revoked a token its session still holds")
	}
}

func TestDryRunCountsWithoutRevoking(t *testing.T) {
	ctx := context.Background()
	r := redisfixture.New(t)
	store := plannersession.NewStore(r.Handle)

	if err := store.PutRefreshToken(ctx, "orphan", plannersession.RefreshTokenData{
		AccountID: "acct", SessionID: "gone",
	}); err != nil {
		t.Fatalf("seed orphan: %v", err)
	}

	stats, err := Run(ctx, store, Options{DryRun: true})
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if stats.OrphanRefreshTokensFound != 1 || stats.OrphanRefreshTokensRemoved != 0 {
		t.Fatalf("stats = %+v, want found but not removed", stats)
	}
	if _, found, _ := store.RefreshToken(ctx, "orphan"); !found {
		t.Fatal("a dry run must not revoke the token it counted")
	}
}

// A service that starts without Redis should not report a failure for a pass it
// was never going to run.
func TestASweepWithoutRedisIsANoOp(t *testing.T) {
	store := plannersession.NewStore(eipredis.NewRedis(nil))

	stats, err := Run(context.Background(), store, Options{})
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if stats != (Stats{}) {
		t.Fatalf("stats = %+v, want zero", stats)
	}
}

func TestVerifySessionPersistedChecksTheAccountMatches(t *testing.T) {
	ctx := context.Background()
	r := redisfixture.New(t)
	store := plannersession.NewStore(r.Handle)

	if err := store.PutSession(ctx, "acct", plannersession.Session{SessionID: "sess"}); err != nil {
		t.Fatalf("put session: %v", err)
	}
	if err := VerifySessionPersisted(ctx, store, "acct", "sess"); err != nil {
		t.Fatalf("matching account: %v", err)
	}
	if err := VerifySessionPersisted(ctx, store, "other", "sess"); err == nil {
		t.Fatal("a session belonging to another account must not verify")
	}
	if err := VerifySessionPersisted(ctx, store, "acct", ""); err == nil {
		t.Fatal("an empty session id must not verify")
	}
}

// The loop is what makes the sweep happen in a running service, so it has to run
// a pass before its first tick and stop when the context is done.
func TestRunLoopSweepsImmediatelyAndStopsOnCancel(t *testing.T) {
	fake := redisfixture.New(t)
	store := plannersession.NewStore(fake.Handle)

	ctx, cancel := context.WithCancel(context.Background())
	if err := store.PutRefreshToken(ctx, "orphan", plannersession.RefreshTokenData{
		AccountID: "acct", SessionID: "gone",
	}); err != nil {
		t.Fatalf("seed orphan: %v", err)
	}

	done := make(chan error, 1)
	go func() { done <- RunLoop(ctx, store, time.Hour, Options{}) }()

	deadline := time.After(2 * time.Second)
	for {
		if _, found, _ := store.RefreshToken(context.Background(), "orphan"); !found {
			break
		}
		select {
		case <-deadline:
			cancel()
			t.Fatal("the loop did not sweep before its first tick")
		case <-time.After(5 * time.Millisecond):
		}
	}

	cancel()
	select {
	case err := <-done:
		if !errors.Is(err, context.Canceled) {
			t.Fatalf("loop returned %v, want context.Canceled", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("the loop did not stop when its context was cancelled")
	}
}
