package auth

import (
	"context"
	"eve-industry-planner/shared/crypto/entityid"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/testing/keys"
	"eve-industry-planner/testing/redisfake"
	"strings"
	"sync"
	"testing"
	"time"

	eipredis "eve-industry-planner/shared/redis"
)

// TestConcurrentGrantsUpdatesAreNotLost drives many overlapping grant updates and asserts every
// one is reflected in the stored record. A write that escapes MULTI/EXEC leaves the WATCH
// unenforced, so a racing writer is silently overwritten and the version stalls below the count.
func TestConcurrentGrantsUpdatesAreNotLost(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	rdb := eipredis.NewRedis(redisfake.New(t).Client)

	const (
		accountID = "acct-cas-lost-update"
		rounds    = 40
	)
	now := time.Now().UTC()
	if err := UpsertAccountSession(ctx, rdb, accountID, AccountSession{
		SessionID:        "s1",
		CharacterHash:    "hash",
		StartedAt:        now,
		LastSeenAt:       now,
		ReauthRequiredAt: ReauthDeadlineFromSessionStart(now),
	}); err != nil {
		t.Fatalf("initial upsert: %v", err)
	}

	// Release both writers of each pair together so their read-compare-write windows overlap.
	for range rounds {
		start := make(chan struct{})
		var wg sync.WaitGroup
		wg.Add(2)
		errCh := make(chan error, 2)

		for _, corp := range []int64{1, 2} {
			go func() {
				defer wg.Done()
				<-start
				errCh <- UpdateAccountSessionGrants(ctx, rdb, accountID, grantsFor(t, accountID, []int64{corp}, nil))
			}()
		}

		close(start)
		wg.Wait()
		close(errCh)
		for err := range errCh {
			if err != nil {
				t.Fatalf("concurrent grants update failed: %v", err)
			}
		}
	}

	rec, err := GetAccountSessionsRecord(ctx, rdb, accountID)
	if err != nil {
		t.Fatalf("GetAccountSessionsRecord: %v", err)
	}
	// Every successful update bumps the version, so a lower count means a write was lost.
	if rec.GrantsVersion < rounds*2 {
		t.Fatalf("grants version = %d, want at least %d; updates were lost", rec.GrantsVersion, rounds*2)
	}
}

func TestConcurrentUpsertAndGrantsPreservesSession(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	rdb := eipredis.NewRedis(redisfake.New(t).Client)

	const (
		accountID = "acct-cas-concurrent"
		sessionID = "sess-cas-concurrent"
	)
	now := time.Now().UTC()
	session := AccountSession{
		SessionID:        sessionID,
		CharacterHash:    "main-hash",
		StartedAt:        now,
		LastSeenAt:       now,
		ReauthRequiredAt: ReauthDeadlineFromSessionStart(now),
	}

	var wg sync.WaitGroup
	wg.Add(2)
	errCh := make(chan error, 2)

	go func() {
		defer wg.Done()
		errCh <- UpsertAccountSession(ctx, rdb, accountID, session)
	}()
	go func() {
		defer wg.Done()
		time.Sleep(2 * time.Millisecond)
		errCh <- UpdateAccountSessionGrants(ctx, rdb, accountID, grantsFor(t, accountID, []int64{100}, []int64{200}))
	}()

	wg.Wait()
	close(errCh)
	for err := range errCh {
		if err != nil {
			t.Fatalf("concurrent mutation failed: %v", err)
		}
	}

	rec, err := GetAccountSessionsRecord(ctx, rdb, accountID)
	if err != nil {
		t.Fatalf("GetAccountSessionsRecord: %v", err)
	}
	sess, ok := rec.Sessions[sessionID]
	if !ok {
		t.Fatal("expected session row after concurrent upsert + grants")
	}
	if sess.CharacterHash != "main-hash" {
		t.Fatalf("session hash = %q, want main-hash", sess.CharacterHash)
	}
	wantCorp := testCorpRef(t, 100)
	wantAlliance := testAllianceRef(t, 200)
	if !rec.Grants.Allows(models.CorporationOwner(wantCorp)) {
		t.Fatalf("grants = %v, want to include corporation %s", rec.Grants.OwnerKeys, wantCorp)
	}
	if !rec.Grants.Allows(models.AllianceOwner(wantAlliance)) {
		t.Fatalf("grants = %v, want to include alliance %s", rec.Grants.OwnerKeys, wantAlliance)
	}
	if !sess.Grants.Allows(models.CorporationOwner(wantCorp)) {
		t.Fatal("expected session-level grants to match account grants")
	}
}

func testCorpRef(t *testing.T, id int64) string {
	t.Helper()
	r, err := keys.EntityCipher(t).Corporation(id)
	if err != nil {
		t.Fatalf("RefFromCorporationID: %v", err)
	}
	return r
}

func testAllianceRef(t *testing.T, id int64) string {
	t.Helper()
	r, err := keys.EntityCipher(t).Alliance(id)
	if err != nil {
		t.Fatalf("RefFromAllianceID: %v", err)
	}
	return r
}

// Grants must never persist a raw entity id: the ref is what is stored.
func TestSessionGrantsStoreRefsNotIDs(t *testing.T) {
	ctx := context.Background()
	rdb := eipredis.NewRedis(redisfake.New(t).Client)

	const accountID = "acct-refs"
	if err := UpdateAccountSessionGrants(ctx, rdb, accountID, grantsFor(t, accountID, []int64{98765432}, []int64{99000001})); err != nil {
		t.Fatalf("UpdateAccountSessionGrants: %v", err)
	}

	rec, err := GetAccountSessionsRecord(ctx, rdb, accountID)
	if err != nil {
		t.Fatalf("GetAccountSessionsRecord: %v", err)
	}
	orgRefs := append(rec.Grants.OwnerKeys.IDsForKind(models.OwnerCorporation), rec.Grants.OwnerKeys.IDsForKind(models.OwnerAlliance)...)
	if len(orgRefs) != 2 {
		t.Fatalf("org grants = %v, want one corporation and one alliance", orgRefs)
	}
	for _, got := range orgRefs {
		if !entityid.ValidShape(got) {
			t.Fatalf("grant %q is not a well formed ref", got)
		}
		if strings.Contains(got, "98765432") || strings.Contains(got, "99000001") {
			t.Fatalf("grant %q leaks the raw entity id", got)
		}
	}
}

// The account's own key is granted without being asked for, so nothing
// downstream has to special-case the account alongside the org kinds.
func TestSessionGrantsAlwaysIncludeTheAccountsOwnKey(t *testing.T) {
	ctx := context.Background()
	rdb := eipredis.NewRedis(redisfake.New(t).Client)

	const accountID = "acct-self-grant"
	if err := UpdateAccountSessionGrants(ctx, rdb, accountID, grantsFor(t, accountID, nil, nil)); err != nil {
		t.Fatalf("UpdateAccountSessionGrants: %v", err)
	}

	rec, err := GetAccountSessionsRecord(ctx, rdb, accountID)
	if err != nil {
		t.Fatalf("GetAccountSessionsRecord: %v", err)
	}
	if !rec.Grants.Allows(models.AccountOwner(accountID)) {
		t.Fatalf("grants = %v, want to include the account's own key", rec.Grants.OwnerKeys)
	}
}

// A grant names the kind alongside the id, so a corporation ref cannot be
// mistaken for an alliance one now that both share a list.
func TestSessionGrantsKeepKindWithTheID(t *testing.T) {
	ctx := context.Background()
	rdb := eipredis.NewRedis(redisfake.New(t).Client)

	const accountID = "acct-kinded"
	if err := UpdateAccountSessionGrants(ctx, rdb, accountID, grantsFor(t, accountID, []int64{100}, []int64{200})); err != nil {
		t.Fatalf("UpdateAccountSessionGrants: %v", err)
	}

	rec, err := GetAccountSessionsRecord(ctx, rdb, accountID)
	if err != nil {
		t.Fatalf("GetAccountSessionsRecord: %v", err)
	}
	corp := testCorpRef(t, 100)
	if rec.Grants.Allows(models.Owner{Kind: models.OwnerAlliance, ID: corp}) {
		t.Fatal("a corporation ref must not grant the alliance of the same id")
	}
	if !rec.Grants.Allows(models.CorporationOwner(corp)) {
		t.Fatalf("grants = %v, want the corporation key", rec.Grants.OwnerKeys)
	}
}

// grantsFor builds the owner keys a session holds, the way the callers do: the
// account's own planner plus one per organisation it is a member of.
func grantsFor(t *testing.T, accountID string, corpIDs, allianceIDs []int64) models.OwnerKeys {
	t.Helper()
	cipher := keys.EntityCipher(t)
	granted := models.NewOwnerKeys().Add(models.AccountOwner(accountID))
	for _, id := range corpIDs {
		ref, err := cipher.Corporation(id)
		if err != nil {
			t.Fatalf("corporation ref for %d: %v", id, err)
		}
		granted = granted.Add(models.CorporationOwner(ref))
	}
	for _, id := range allianceIDs {
		ref, err := cipher.Alliance(id)
		if err != nil {
			t.Fatalf("alliance ref for %d: %v", id, err)
		}
		granted = granted.Add(models.AllianceOwner(ref))
	}
	return granted
}
