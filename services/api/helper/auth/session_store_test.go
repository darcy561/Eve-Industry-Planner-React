package auth

import (
	"context"
	"encoding/json"
	"errors"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"

	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/redisfake"
)

func store(t *testing.T, fake *redisfake.Redis) *SessionStore {
	t.Helper()
	handle := eipredis.NewRedis(fake.Client)
	return NewSessionStore(handle)
}

func TestSessionStoreRefreshTokenRoundTrips(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	data := RefreshTokenData{AccountID: "acct", SessionID: "sess", CharacterHash: "hash"}
	if err := s.PutRefreshToken(ctx, "tok", data); err != nil {
		t.Fatalf("put: %v", err)
	}

	got, found, err := s.RefreshToken(ctx, "tok")
	if err != nil || !found {
		t.Fatalf("read = %v, %v, %v", got, found, err)
	}
	if got.AccountID != data.AccountID || got.SessionID != data.SessionID {
		t.Fatalf("read %+v, want %+v", got, data)
	}
}

// Storing a token points the session at it, so a tab holding only a session id
// can recover the live token.
func TestSessionStorePutRefreshTokenPointsTheSessionAtIt(t *testing.T) {
	ctx := context.Background()
	s := store(t, redisfake.New(t))

	if err := s.PutRefreshToken(ctx, "tok", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put: %v", err)
	}

	token, found, err := s.TokenForSession(ctx, "sess")
	if err != nil || !found {
		t.Fatalf("token for session = %q, %v, %v", token, found, err)
	}
	if token != "tok" {
		t.Fatalf("token = %q, want tok", token)
	}
}

// The invariant a rotation depends on: revoking the token being replaced must
// not erase the index entry the replacement just wrote.
func TestSessionStoreDeleteLeavesANewerTokensIndexAlone(t *testing.T) {
	ctx := context.Background()
	s := store(t, redisfake.New(t))

	if err := s.PutRefreshToken(ctx, "old", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put old: %v", err)
	}
	// A rotation writes the replacement, which repoints the index.
	if err := s.PutRefreshToken(ctx, "new", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put new: %v", err)
	}
	// Then revokes what it replaced.
	if err := s.DeleteRefreshToken(ctx, "old"); err != nil {
		t.Fatalf("delete old: %v", err)
	}

	token, found, err := s.TokenForSession(ctx, "sess")
	if err != nil || !found {
		t.Fatalf("the session lost its token: %q, %v, %v", token, found, err)
	}
	if token != "new" {
		t.Fatalf("token = %q, want new — revoking the old token cleared the new index", token)
	}
}

// Revoking the token a session currently holds does clear the index, or the
// session keeps pointing at something that no longer exists.
func TestSessionStoreDeleteClearsItsOwnIndex(t *testing.T) {
	ctx := context.Background()
	s := store(t, redisfake.New(t))

	if err := s.PutRefreshToken(ctx, "tok", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put: %v", err)
	}
	if err := s.DeleteRefreshToken(ctx, "tok"); err != nil {
		t.Fatalf("delete: %v", err)
	}

	if _, found, _ := s.TokenForSession(ctx, "sess"); found {
		t.Fatal("the session still names a revoked token")
	}
	if _, found, _ := s.RefreshToken(ctx, "tok"); found {
		t.Fatal("the token survived its own revocation")
	}
}

func TestSessionStoreAbsentReadsAreNotErrors(t *testing.T) {
	ctx := context.Background()
	s := store(t, redisfake.New(t))

	if got, found, err := s.RefreshToken(ctx, "absent"); err != nil || found || got != nil {
		t.Errorf("refresh token = %v, %v, %v", got, found, err)
	}
	if got, found, err := s.TokenForSession(ctx, "absent"); err != nil || found || got != "" {
		t.Errorf("token for session = %q, %v, %v", got, found, err)
	}
	if got, found, err := s.AccountForSession(ctx, "absent"); err != nil || found || got != "" {
		t.Errorf("account for session = %q, %v, %v", got, found, err)
	}
	if got, found, err := s.AccountSessions(ctx, "absent"); err != nil || found || got != nil {
		t.Errorf("account sessions = %v, %v, %v", got, found, err)
	}
}

// Ids are trimmed everywhere or nowhere: trimming only the check writes a key
// the same id cannot read back.
func TestSessionStoreTrimsIdsEverywhere(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	if err := s.PutRefreshToken(ctx, "  tok  ", RefreshTokenData{SessionID: " sess "}); err != nil {
		t.Fatalf("put: %v", err)
	}

	if !fake.Server.Exists(RefreshTokenKeyPrefix + "tok") {
		t.Fatalf("untrimmed write produced %v", fake.Server.Keys())
	}
	if _, found, _ := s.RefreshToken(ctx, "tok"); !found {
		t.Error("a token stored under an untrimmed id could not be read back")
	}
	if _, found, _ := s.TokenForSession(ctx, "sess"); !found {
		t.Error("the session index was written under an untrimmed id")
	}
}

// The reason the record is behind a compare-and-set: two updates racing must
// not lose one.
func TestSessionStoreConcurrentUpdatesAreNotLost(t *testing.T) {
	ctx := context.Background()
	s := store(t, redisfake.New(t))

	const writers = 8
	var wg sync.WaitGroup
	errs := make([]error, writers)
	for i := range writers {
		wg.Go(func() {
			errs[i] = s.UpdateAccountSessions(ctx, "acct", func(record *AccountSessionsRecord) error {
				if record.Sessions == nil {
					record.Sessions = map[string]AccountSession{}
				}
				record.Sessions[sessionName(i)] = AccountSession{SessionID: sessionName(i)}
				return nil
			})
		})
	}
	wg.Wait()

	for i, err := range errs {
		if err != nil {
			t.Fatalf("writer %d: %v", i, err)
		}
	}

	record, found, err := s.AccountSessions(ctx, "acct")
	if err != nil || !found {
		t.Fatalf("read back: %v, %v", found, err)
	}
	if len(record.Sessions) != writers {
		t.Fatalf("kept %d sessions, want %d — an update was lost", len(record.Sessions), writers)
	}
}

func sessionName(i int) string { return "sess-" + strings.Repeat("x", i+1) }

// A mutation that refuses leaves the stored record untouched.
func TestSessionStoreUpdateAbandonsOnError(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	refuse := errors.New("refuse")
	err := s.UpdateAccountSessions(ctx, "acct", func(*AccountSessionsRecord) error { return refuse })
	if !errors.Is(err, refuse) {
		t.Fatalf("error = %v, want refuse", err)
	}
	if fake.Server.Exists(AccountSessionsKeyPrefix + "acct") {
		t.Fatal("a refused update wrote the record")
	}
}

// The record a mutation receives already knows which account it is, so a caller
// never constructs one.
func TestSessionStoreUpdateStampsTheAccount(t *testing.T) {
	ctx := context.Background()
	s := store(t, redisfake.New(t))

	if err := s.UpdateAccountSessions(ctx, "acct", func(record *AccountSessionsRecord) error {
		if record.AccountID != "acct" {
			t.Errorf("account id = %q, want acct", record.AccountID)
		}
		return nil
	}); err != nil {
		t.Fatalf("update: %v", err)
	}
}

func TestSessionStoreSessionIndexRoundTrips(t *testing.T) {
	ctx := context.Background()
	s := store(t, redisfake.New(t))

	if err := s.PutSessionIndex(ctx, "sess", "acct"); err != nil {
		t.Fatalf("put: %v", err)
	}
	got, found, err := s.AccountForSession(ctx, "sess")
	if err != nil || !found {
		t.Fatalf("read = %q, %v, %v", got, found, err)
	}
	if got != "acct" {
		t.Fatalf("account = %q, want acct", got)
	}
}

// Deleting a session's indexes removes both, or a revoked session stays
// resolvable through the half that was left.
func TestSessionStoreDeleteSessionIndexesRemovesBoth(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	if err := s.PutSessionIndex(ctx, "sess", "acct"); err != nil {
		t.Fatalf("put index: %v", err)
	}
	if err := s.PutRefreshToken(ctx, "tok", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put token: %v", err)
	}

	if err := s.DeleteSessionIndexes(ctx, "sess"); err != nil {
		t.Fatalf("delete: %v", err)
	}

	if _, found, _ := s.AccountForSession(ctx, "sess"); found {
		t.Error("the session index survived")
	}
	if _, found, _ := s.TokenForSession(ctx, "sess"); found {
		t.Error("the session-refresh index survived")
	}
	// The token itself is a separate decision, and is not swept up by this.
	if !fake.Server.Exists(RefreshTokenKeyPrefix + "tok") {
		t.Error("deleting the indexes also deleted the token")
	}
}

// A scan hands back ids rather than keys, so no caller re-derives one by
// trimming a prefix itself.
func TestSessionStoreScansReportIds(t *testing.T) {
	ctx := context.Background()
	s := store(t, redisfake.New(t))

	for _, accountID := range []string{"a", "b", "c"} {
		if err := s.UpdateAccountSessions(ctx, accountID, func(*AccountSessionsRecord) error { return nil }); err != nil {
			t.Fatalf("seed %s: %v", accountID, err)
		}
	}

	seen := map[string]bool{}
	if err := s.EachAccountSessionsKey(ctx, func(accountIDs []string) error {
		for _, id := range accountIDs {
			seen[id] = true
		}
		return nil
	}); err != nil {
		t.Fatalf("scan: %v", err)
	}

	for _, want := range []string{"a", "b", "c"} {
		if !seen[want] {
			t.Errorf("account %q was not visited; saw %v", want, seen)
		}
	}
}

func TestSessionStoreCarriesItsLifetimes(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	if err := s.PutRefreshToken(ctx, "tok", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put token: %v", err)
	}
	if err := s.PutSessionIndex(ctx, "sess", "acct"); err != nil {
		t.Fatalf("put index: %v", err)
	}
	if err := s.UpdateAccountSessions(ctx, "acct", func(*AccountSessionsRecord) error { return nil }); err != nil {
		t.Fatalf("update: %v", err)
	}

	for key, want := range map[string]time.Duration{
		RefreshTokenKeyPrefix + "tok":         RefreshTokenTTL,
		SessionRefreshIndexKeyPrefix + "sess": RefreshTokenTTL,
		SessionIndexKeyPrefix + "sess":        SessionTTL,
		AccountSessionsKeyPrefix + "acct":     SessionTTL,
	} {
		if got := fake.Server.TTL(key); got != want {
			t.Errorf("key %q: ttl = %v, want %v", key, got, want)
		}
	}
}

// Pinned to literals: a lifetime asserted against the constant that set it
// cannot catch the constant itself being wrong.
func TestSessionKeyLifetimes(t *testing.T) {
	for name, tc := range map[string]struct {
		got  time.Duration
		want time.Duration
	}{
		"refresh token": {RefreshTokenTTL, 7 * 24 * time.Hour},
		"session":       {SessionTTL, 7 * 24 * time.Hour},
		"org id cache":  {CorporationTTL, 30 * 24 * time.Hour},
	} {
		t.Run(name, func(t *testing.T) {
			if tc.got != tc.want {
				t.Errorf("ttl = %v, want %v", tc.got, tc.want)
			}
		})
	}
}

func TestSessionStoreWithoutARedisReports(t *testing.T) {
	ctx := context.Background()
	for name, s := range map[string]*SessionStore{
		"nil store":                 nil,
		"nil handle":                NewSessionStore(nil),
		"handle with no connection": NewSessionStore(eipredis.NewRedis(nil)),
	} {
		t.Run(name, func(t *testing.T) {
			if err := s.PutRefreshToken(ctx, "tok", RefreshTokenData{}); !errors.Is(err, ErrNoStore) {
				t.Errorf("put = %v, want ErrNoStore", err)
			}
			if _, _, err := s.RefreshToken(ctx, "tok"); !errors.Is(err, ErrNoStore) {
				t.Errorf("read = %v, want ErrNoStore", err)
			}
			if err := s.UpdateAccountSessions(ctx, "acct", func(*AccountSessionsRecord) error { return nil }); !errors.Is(err, ErrNoStore) {
				t.Errorf("update = %v, want ErrNoStore", err)
			}
		})
	}
}

// The stored record's shape is pinned to what a reader expects, rather than
// compared against the free functions — those now delegate to the store, so the
// comparison would be the store agreeing with itself.
//
// A record written by either half of a fleet mid-rollout has to be readable by
// the other, and the CAS token is what a concurrent write is judged against, so
// its shape is not an implementation detail.
func TestSessionStoreWritesTheRecordShapeAReaderExpects(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	if err := s.UpdateAccountSessions(ctx, "acct", func(record *AccountSessionsRecord) error {
		record.Sessions["s1"] = AccountSession{SessionID: "s1", CharacterHash: "hash"}
		return nil
	}); err != nil {
		t.Fatalf("update: %v", err)
	}

	stored, err := fake.Server.Get(AccountSessionsKeyPrefix + "acct")
	if err != nil {
		t.Fatalf("read stored: %v", err)
	}

	var record AccountSessionsRecord
	if err := json.Unmarshal([]byte(stored), &record); err != nil {
		t.Fatalf("stored record does not decode: %v", err)
	}

	if record.AccountID != "acct" {
		t.Errorf("account id = %q, want acct", record.AccountID)
	}
	// The first write is version 1: a reader comparing against 0 would treat
	// every record as already changed.
	if record.GrantsVersion != 1 {
		t.Errorf("grants version = %d, want 1 on a first write", record.GrantsVersion)
	}
	if record.UpdatedAt.IsZero() {
		t.Error("updated_at was not stamped")
	}
	if _, kept := record.Sessions["s1"]; !kept {
		t.Errorf("sessions = %v, want s1", record.Sessions)
	}
	if ttl := fake.Server.TTL(AccountSessionsKeyPrefix + "acct"); ttl != SessionTTL {
		t.Errorf("ttl = %v, want %v", ttl, SessionTTL)
	}

	// Each write advances the version, which is what makes a stale write
	// detectable.
	if err := s.UpdateAccountSessions(ctx, "acct", func(*AccountSessionsRecord) error { return nil }); err != nil {
		t.Fatalf("second update: %v", err)
	}
	again, _, err := s.AccountSessions(ctx, "acct")
	if err != nil {
		t.Fatalf("read back: %v", err)
	}
	if again.GrantsVersion != 2 {
		t.Errorf("grants version = %d after a second write, want 2", again.GrantsVersion)
	}
}

// Touching the record is what expires a session: a window that has elapsed
// drops the session and its indexes, so nothing lingers because no sweep ran.
func TestSessionStoreUpdatePrunesExpiredSessions(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	expired := time.Now().UTC().Add(-RefreshTokenTTL - time.Hour)
	live := time.Now().UTC()

	if err := s.UpdateAccountSessions(ctx, "acct", func(record *AccountSessionsRecord) error {
		record.Sessions["stale"] = AccountSession{
			SessionID: "stale", StartedAt: expired, ReauthRequiredAt: expired,
		}
		record.Sessions["live"] = AccountSession{
			SessionID: "live", StartedAt: live, ReauthRequiredAt: live.Add(RefreshTokenTTL),
		}
		return nil
	}); err != nil {
		t.Fatalf("seed: %v", err)
	}
	if err := s.PutSessionIndex(ctx, "stale", "acct"); err != nil {
		t.Fatalf("seed index: %v", err)
	}

	// Any mutation prunes; this one changes nothing itself.
	if err := s.UpdateAccountSessions(ctx, "acct", func(*AccountSessionsRecord) error { return nil }); err != nil {
		t.Fatalf("update: %v", err)
	}

	record, found, err := s.AccountSessions(ctx, "acct")
	if err != nil || !found {
		t.Fatalf("read back: %v, %v", found, err)
	}
	if _, kept := record.Sessions["stale"]; kept {
		t.Error("an expired session survived a mutation")
	}
	if _, kept := record.Sessions["live"]; !kept {
		t.Error("a live session was pruned")
	}
	if fake.Server.Exists(SessionIndexKeyPrefix + "stale") {
		t.Error("the expired session's index was left behind")
	}
}

// A session past its window is dropped and its index deleted, whichever entry
// point touched the record.
func TestPruningReachesEveryEntryPoint(t *testing.T) {
	ctx := context.Background()
	expired := time.Now().UTC().Add(-RefreshTokenTTL - time.Hour)

	for name, touch := range map[string]func(*redisfake.Redis) error{
		"a store mutation": func(f *redisfake.Redis) error {
			return store(t, f).UpdateAccountSessions(ctx, "acct",
				func(*AccountSessionsRecord) error { return nil })
		},
		"a live read": func(f *redisfake.Redis) error {
			_, err := store(t, f).LiveAccountSessions(ctx, "acct")
			return err
		},
	} {
		t.Run(name, func(t *testing.T) {
			fake := redisfake.New(t)
			s := store(t, fake)
			if err := s.UpdateAccountSessions(ctx, "acct", func(rec *AccountSessionsRecord) error {
				rec.Sessions["stale"] = AccountSession{
					SessionID: "stale", StartedAt: expired, ReauthRequiredAt: expired,
				}
				return nil
			}); err != nil {
				t.Fatalf("seed: %v", err)
			}
			if err := s.PutSessionIndex(ctx, "stale", "acct"); err != nil {
				t.Fatalf("seed index: %v", err)
			}

			if err := touch(fake); err != nil {
				t.Fatalf("touch: %v", err)
			}

			record, _, err := s.AccountSessions(ctx, "acct")
			if err != nil {
				t.Fatalf("read back: %v", err)
			}
			if _, kept := record.Sessions["stale"]; kept {
				t.Error("an expired session survived")
			}
			if fake.Server.Exists(SessionIndexKeyPrefix + "stale") {
				t.Error("the expired session's index was left behind")
			}
		})
	}
}

// The store must leave the keyspace each operation is supposed to leave.
//
// Pinned to literal key names rather than compared against the free functions:
// those now delegate to the store, so comparing the two would be the store
// agreeing with itself. Both gaps this refactor found were side effects missing
// from an operation whose stored value was correct, which is what naming the
// keys catches.
func TestSessionStoreLeavesTheKeysAnOperationOwes(t *testing.T) {
	ctx := context.Background()
	data := RefreshTokenData{AccountID: "acct", SessionID: "sess", CharacterHash: "hash"}

	for name, tc := range map[string]struct {
		op   func(*redisfake.Redis)
		want []string
	}{
		"storing a refresh token": {
			op: func(f *redisfake.Redis) {
				if err := store(t, f).PutRefreshToken(ctx, "tok", data); err != nil {
					t.Fatalf("put token: %v", err)
				}
			},
			// The token, and the index that lets a session find it again.
			want: []string{"refresh_token:tok", "session_refresh:sess"},
		},
		"revoking a refresh token": {
			op: func(f *redisfake.Redis) {
				s := store(t, f)
				_ = s.PutRefreshToken(ctx, "tok", data)
				if err := s.DeleteRefreshToken(ctx, "tok"); err != nil {
					t.Fatalf("delete: %v", err)
				}
			},
			want: nil,
		},
		"adding a session": {
			op: func(f *redisfake.Redis) {
				if err := store(t, f).PutSession(ctx, "acct", AccountSession{SessionID: "sess"}); err != nil {
					t.Fatalf("put session: %v", err)
				}
			},
			// The record, and the index that resolves the id to an account.
			want: []string{"account_sessions:acct", "session_index:sess"},
		},
		"revoking a session": {
			op: func(f *redisfake.Redis) {
				s := store(t, f)
				_ = s.PutSession(ctx, "acct", AccountSession{SessionID: "sess"})
				if err := s.RemoveSession(ctx, "acct", "sess"); err != nil {
					t.Fatalf("remove session: %v", err)
				}
			},
			// The record survives the session leaving it; the index does not.
			want: []string{"account_sessions:acct"},
		},
		"caching org ids": {
			op: func(f *redisfake.Redis) {
				s := store(t, f)
				if err := s.PutCorporations(ctx, "acct", []int64{1, 2}); err != nil {
					t.Fatalf("put corporations: %v", err)
				}
				if err := s.PutAlliances(ctx, "acct", []int64{9}); err != nil {
					t.Fatalf("put alliances: %v", err)
				}
			},
			want: []string{"custom_claims_alliances:acct", "custom_claims_corporations:acct"},
		},
		"revoking every token a session can be reached by": {
			op: func(f *redisfake.Redis) {
				s := store(t, f)
				_ = s.PutRefreshToken(ctx, "stale", data)
				_ = s.PutRefreshToken(ctx, "current", data)
				if err := s.RevokeSessionTokens(ctx, "current", "sess"); err != nil {
					t.Fatalf("revoke session tokens: %v", err)
				}
			},
			// Neither token remains, and neither does the index naming one.
			want: nil,
		},
	} {
		t.Run(name, func(t *testing.T) {
			got := keyspaceAfter(t, tc.op)
			want := tc.want
			slices.Sort(want)
			if !slices.Equal(got, want) {
				t.Fatalf("left %v, want %v", got, want)
			}
		})
	}
}

// keyspaceAfter reports every key an operation left, sorted.
func keyspaceAfter(t *testing.T, op func(*redisfake.Redis)) []string {
	t.Helper()
	fake := redisfake.New(t)
	op(fake)
	keys := fake.Server.Keys()
	slices.Sort(keys)
	return keys
}

// The index can be missing while the token is not, so a lookup falls back to a
// scan — and repoints the index with what it found.
func TestSessionStoreFindsATokenTheIndexLost(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	if err := s.PutRefreshToken(ctx, "tok", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put: %v", err)
	}
	// The index is lost, the token is not.
	if _, err := fake.Client.Del(ctx, sessionRefreshIndexKey("sess")).Result(); err != nil {
		t.Fatalf("drop index: %v", err)
	}

	token, found, err := s.FindTokenForSession(ctx, "sess")
	if err != nil || !found {
		t.Fatalf("find = %q, %v, %v", token, found, err)
	}
	if token != "tok" {
		t.Fatalf("token = %q, want tok", token)
	}
	// And the next lookup is cheap again.
	if !fake.Server.Exists(sessionRefreshIndexKey("sess")) {
		t.Error("the scan did not repoint the index at what it found")
	}
}

func TestSessionStoreFindReportsNothingForAnUnknownSession(t *testing.T) {
	ctx := context.Background()
	s := store(t, redisfake.New(t))

	if err := s.PutRefreshToken(ctx, "tok", RefreshTokenData{SessionID: "other"}); err != nil {
		t.Fatalf("put: %v", err)
	}
	if token, found, err := s.FindTokenForSession(ctx, "absent"); err != nil || found || token != "" {
		t.Fatalf("find = %q, %v, %v; want nothing", token, found, err)
	}
}

// Logging out must leave no token that still reaches the session, including one
// the index had lost track of.
func TestSessionStoreRevokeSessionTokensLeavesNoneUsable(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	// Two tokens for one session, and the index names only the second.
	if err := s.PutRefreshToken(ctx, "stale", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put stale: %v", err)
	}
	if err := s.PutRefreshToken(ctx, "current", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put current: %v", err)
	}

	if err := s.RevokeSessionTokens(ctx, "current", "sess"); err != nil {
		t.Fatalf("revoke: %v", err)
	}

	for _, token := range []string{"current", "stale"} {
		if fake.Server.Exists(RefreshTokenKeyPrefix + token) {
			t.Errorf("token %q survived logout", token)
		}
	}
}

func TestSessionStoreRevokeSessionTokensIgnoresAnEmptyToken(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	if err := s.PutRefreshToken(ctx, "keep", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put: %v", err)
	}
	if err := s.RevokeSessionTokens(ctx, "  ", "sess"); err != nil {
		t.Fatalf("revoke: %v", err)
	}
	if !fake.Server.Exists(RefreshTokenKeyPrefix + "keep") {
		t.Fatal("revoking nothing revoked something")
	}
}

func TestSessionStoreOrgCachesRoundTrip(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	if err := s.PutCorporations(ctx, "acct", []int64{1, 2}); err != nil {
		t.Fatalf("put corporations: %v", err)
	}
	if err := s.PutAlliances(ctx, "acct", []int64{9}); err != nil {
		t.Fatalf("put alliances: %v", err)
	}

	if got := s.Corporations(ctx, "acct"); !slices.Equal(got, []int64{1, 2}) {
		t.Errorf("corporations = %v, want [1 2]", got)
	}
	if got := s.Alliances(ctx, "acct"); !slices.Equal(got, []int64{9}) {
		t.Errorf("alliances = %v, want [9]", got)
	}
	// A miss is an empty list, never nil, so a caller can range over it without
	// checking — and matching the function this replaces keeps the JSON a
	// caller stores identical.
	for name, got := range map[string][]int64{
		"a cache miss":  s.Corporations(ctx, "absent"),
		"no account id": s.Corporations(ctx, ""),
		"no store":      (*SessionStore)(nil).Corporations(ctx, "acct"),
	} {
		if got == nil {
			t.Errorf("%s returned nil, want an empty list", name)
		}
		if len(got) != 0 {
			t.Errorf("%s returned %v, want empty", name, got)
		}
	}

	for key, want := range map[string]time.Duration{
		CorporationKeyPrefix + "acct": CorporationTTL,
		AllianceKeyPrefix + "acct":    CorporationTTL,
	} {
		if got := fake.Server.TTL(key); got != want {
			t.Errorf("key %q: ttl = %v, want %v", key, got, want)
		}
	}
}

// The CAS version counts writes to the stored record, so a caller saving a
// stale copy must not rewind it — the version is what a concurrent write is
// judged against, and a rewind makes a lost update look legitimate.
func TestSaveAccountSessionsRecordDoesNotRewindTheVersion(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	for range 3 {
		if err := s.UpdateAccountSessions(ctx, "acct", func(*AccountSessionsRecord) error { return nil }); err != nil {
			t.Fatalf("seed: %v", err)
		}
	}
	before, _, err := s.AccountSessions(ctx, "acct")
	if err != nil {
		t.Fatalf("read: %v", err)
	}

	// A caller holding a copy from before those writes saves it back.
	if err := SaveAccountSessionsRecord(ctx, eipredis.NewRedis(fake.Client), &AccountSessionsRecord{
		AccountID:     "acct",
		GrantsVersion: 0,
		Sessions:      map[string]AccountSession{"s1": {SessionID: "s1"}},
	}); err != nil {
		t.Fatalf("save: %v", err)
	}

	after, _, err := s.AccountSessions(ctx, "acct")
	if err != nil {
		t.Fatalf("read back: %v", err)
	}
	if after.GrantsVersion != before.GrantsVersion+1 {
		t.Fatalf("version = %d, want %d — a stale copy rewound it",
			after.GrantsVersion, before.GrantsVersion+1)
	}
	// The caller's contents still win; only the version is the store's.
	if _, kept := after.Sessions["s1"]; !kept {
		t.Errorf("the saved record's sessions were discarded: %v", after.Sessions)
	}
}

// A scan reports an id as it is stored, which is not always what a key builder
// would produce from it. A caller that names the key it was just handed must
// use the id verbatim, or it addresses a key that does not exist.
func TestAccountSessionsKeyForNamesTheKeyAScanReturned(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)

	// Written directly, bypassing the builders that trim.
	stored := AccountSessionsKeyPrefix + " spacey "
	if err := fake.Client.Set(ctx, stored, `{"account_id":" spacey "}`, 0).Err(); err != nil {
		t.Fatalf("seed: %v", err)
	}

	var seen []string
	if err := store(t, fake).EachAccountSessionsKey(ctx, func(ids []string) error {
		seen = append(seen, ids...)
		return nil
	}); err != nil {
		t.Fatalf("scan: %v", err)
	}
	if len(seen) != 1 {
		t.Fatalf("scan returned %v, want one id", seen)
	}

	if got := AccountSessionsKeyFor(seen[0]); got != stored {
		t.Fatalf("rebuilt %q, want %q — the key a scan returned was not addressable", got, stored)
	}
	// The trimming builder deliberately differs, which is why the two exist.
	if accountSessionsKey(seen[0]) == stored {
		t.Error("the trimming builder round-tripped an untrimmed id; this test proves nothing")
	}
}

// The grants sweep must repair every record it scanned, including one stored
// under an id a key builder would not reproduce.
func TestRepairSessionGrantsReachesAnUntrimmedRecord(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)

	if err := fake.Client.Set(ctx, AccountSessionsKeyPrefix+" spacey ",
		`{"account_id":" spacey ","grants":{"owner_keys":[]},"sessions":{}}`, 0).Err(); err != nil {
		t.Fatalf("seed: %v", err)
	}

	report, err := RepairSessionGrants(ctx, eipredis.NewRedis(fake.Client), true)
	if err != nil {
		t.Fatalf("repair: %v", err)
	}
	if report.Scanned != 1 {
		t.Fatalf("scanned = %d, want 1", report.Scanned)
	}
	if report.Failed != 0 {
		t.Fatalf("failed = %d — the sweep could not read a record it had just scanned", report.Failed)
	}
}

// Revoking a session clears the pointer to its refresh token as well as the
// account index. Nothing sweeps orphaned session_refresh: keys, so a revoke
// that left one behind would keep it until its TTL.
func TestRevokingASessionClearsBothItsIndexes(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	rdb := eipredis.NewRedis(fake.Client)

	if err := UpsertAccountSession(ctx, rdb, "acct", AccountSession{SessionID: "s1"}); err != nil {
		t.Fatalf("upsert: %v", err)
	}
	if err := setSessionRefreshIndex(ctx, rdb, RefreshTokenData{SessionID: "s1"}, "tok1"); err != nil {
		t.Fatalf("refresh index: %v", err)
	}
	if err := RevokeAccountSession(ctx, rdb, "acct", "s1"); err != nil {
		t.Fatalf("revoke: %v", err)
	}

	for _, key := range []string{SessionIndexKeyPrefix + "s1", SessionRefreshIndexKeyPrefix + "s1"} {
		if fake.Server.Exists(key) {
			t.Errorf("%s survived the revoke", key)
		}
	}
}
