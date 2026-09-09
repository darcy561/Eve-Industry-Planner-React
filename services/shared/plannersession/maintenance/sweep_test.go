package maintenance

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/shared/plannersession"
	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/redisfake"
)

func newStore(t *testing.T, fake *redisfake.Redis) *plannersession.Store {
	t.Helper()
	return plannersession.NewStore(eipredis.NewRedis(fake.Client))
}

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

func TestPruneAccountRecordsDropsExpiredSessions(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	store := newStore(t, fake)

	stale := time.Now().UTC().Add(-2 * plannersession.RefreshTokenTTL)
	if err := store.PutSession(ctx, "acct", plannersession.Session{SessionID: "old", StartedAt: stale, LastSeenAt: stale}); err != nil {
		t.Fatalf("put session: %v", err)
	}

	scanned, err := PruneAccountRecords(ctx, store)
	if err != nil {
		t.Fatalf("prune: %v", err)
	}
	if scanned != 1 {
		t.Fatalf("scanned = %d, want 1", scanned)
	}
	rec, _, err := store.AccountRecord(ctx, "acct")
	if err != nil {
		t.Fatalf("record: %v", err)
	}
	if len(rec.Sessions) != 0 {
		t.Fatalf("expired session survived the sweep: %v", rec.Sessions)
	}
}

func TestCleanupOrphanIndexesRemovesIndexesNoRecordHolds(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	store := newStore(t, fake)

	if err := store.PutSessionIndex(ctx, "orphan", "acct"); err != nil {
		t.Fatalf("put index: %v", err)
	}

	found, err := CleanupOrphanIndexes(ctx, store, Options{})
	if err != nil {
		t.Fatalf("cleanup: %v", err)
	}
	if found != 1 {
		t.Fatalf("found = %d, want 1", found)
	}
	if _, ok, _ := store.AccountForSession(ctx, "orphan"); ok {
		t.Fatal("orphan index should be gone")
	}
}

func TestDryRunCountsWithoutDeleting(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	store := newStore(t, fake)

	if err := store.PutSessionIndex(ctx, "orphan", "acct"); err != nil {
		t.Fatalf("put index: %v", err)
	}

	found, err := CleanupOrphanIndexes(ctx, store, Options{DryRun: true})
	if err != nil {
		t.Fatalf("cleanup: %v", err)
	}
	if found != 1 {
		t.Fatalf("found = %d, want 1", found)
	}
	if _, ok, _ := store.AccountForSession(ctx, "orphan"); !ok {
		t.Fatal("a dry run must not delete the index it counted")
	}
}

func TestCleanupOrphanRefreshTokensRemovesTokensNoSessionHolds(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	store := newStore(t, fake)

	if err := store.PutRefreshToken(ctx, "tok", plannersession.RefreshTokenData{AccountID: "acct", SessionID: "gone"}); err != nil {
		t.Fatalf("put token: %v", err)
	}

	found, err := CleanupOrphanRefreshTokens(ctx, store, Options{})
	if err != nil {
		t.Fatalf("cleanup: %v", err)
	}
	if found != 1 {
		t.Fatalf("found = %d, want 1", found)
	}
	if _, ok, _ := store.RefreshToken(ctx, "tok"); ok {
		t.Fatal("orphan token should be revoked")
	}
}

func TestCleanupKeepsATokenItsSessionStillHolds(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	store := newStore(t, fake)

	if err := store.PutSession(ctx, "acct", plannersession.Session{SessionID: "sess"}); err != nil {
		t.Fatalf("put session: %v", err)
	}
	if err := store.PutRefreshToken(ctx, "tok", plannersession.RefreshTokenData{AccountID: "acct", SessionID: "sess"}); err != nil {
		t.Fatalf("put token: %v", err)
	}

	found, err := CleanupOrphanRefreshTokens(ctx, store, Options{})
	if err != nil {
		t.Fatalf("cleanup: %v", err)
	}
	if found != 0 {
		t.Fatalf("found = %d, want 0 — a live token was swept", found)
	}
}

func TestRunReportsWhatItRemoved(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	store := newStore(t, fake)

	if err := store.PutSessionIndex(ctx, "orphan", "acct"); err != nil {
		t.Fatalf("put index: %v", err)
	}
	if err := store.PutRefreshToken(ctx, "tok", plannersession.RefreshTokenData{AccountID: "acct", SessionID: "gone"}); err != nil {
		t.Fatalf("put token: %v", err)
	}

	stats, err := Run(ctx, store, Options{})
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if stats.OrphanSessionIndexesFound != 1 || stats.OrphanSessionIndexesRemoved != 1 {
		t.Fatalf("indexes: %+v", stats)
	}
	if stats.OrphanRefreshTokensFound != 1 || stats.OrphanRefreshTokensRemoved != 1 {
		t.Fatalf("tokens: %+v", stats)
	}
}

func TestRunReportsNothingRemovedOnADryRun(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	store := newStore(t, fake)

	if err := store.PutSessionIndex(ctx, "orphan", "acct"); err != nil {
		t.Fatalf("put index: %v", err)
	}

	stats, err := Run(ctx, store, Options{DryRun: true})
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if stats.OrphanSessionIndexesFound != 1 || stats.OrphanSessionIndexesRemoved != 0 {
		t.Fatalf("a dry run reports found but not removed: %+v", stats)
	}
}

// A service that starts without Redis should not report maintenance failures
// for passes it was never going to run.
func TestSweepsWithoutRedisAreNoOps(t *testing.T) {
	ctx := context.Background()
	store := plannersession.NewStore(eipredis.NewRedis(nil))

	for name, call := range map[string]func() error{
		"prune account records": func() error {
			_, err := PruneAccountRecords(ctx, store)
			return err
		},
		"cleanup orphan indexes": func() error {
			_, err := CleanupOrphanIndexes(ctx, store, Options{})
			return err
		},
		"cleanup orphan refresh tokens": func() error {
			_, err := CleanupOrphanRefreshTokens(ctx, store, Options{})
			return err
		},
		"the whole pass": func() error {
			_, err := Run(ctx, store, Options{})
			return err
		},
	} {
		if err := call(); err != nil {
			t.Errorf("%s with no connection = %v, want a quiet skip", name, err)
		}
	}

	stats, err := Run(ctx, store, Options{})
	if err != nil || stats != (Stats{}) {
		t.Fatalf("stats = %+v err = %v, want zero and nil", stats, err)
	}
}

func TestVerifySessionPersistedChecksTheAccountMatches(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	store := newStore(t, fake)

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
