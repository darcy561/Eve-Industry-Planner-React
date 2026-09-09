package plannersession

import (
	"context"
	"encoding/json"
	"slices"
	"testing"
	"time"

	"eve-industry-planner/testing/redisfixture"
)

func keyspaceAfter(t *testing.T, op func(*redisfixture.Redis)) []string {
	t.Helper()
	r := redisfixture.New(t)
	op(r)
	keys := r.Server.Keys()
	slices.Sort(keys)
	return keys
}

// The keys an operation must leave behind, stated as a whole. A write that lands
// one and not the rest is what leaves a session nothing can resolve, and it is
// invisible to any assertion that only reads back what it just wrote.
func TestOperationsLeaveTheKeysTheyOwe(t *testing.T) {
	ctx := context.Background()
	data := RefreshTokenData{AccountID: "acct", SessionID: "sess", CharacterHash: "hash"}

	for name, tc := range map[string]struct {
		op   func(*redisfixture.Redis)
		want []string
	}{
		"storing a refresh token": {
			op: func(r *redisfixture.Redis) {
				if err := NewStore(r.Handle).PutRefreshToken(ctx, "tok", data); err != nil {
					t.Fatalf("put token: %v", err)
				}
			},
			// The token, and the index that lets a session find it again.
			want: []string{"refresh_token:tok", "session_refresh:sess"},
		},
		"revoking a refresh token": {
			op: func(r *redisfixture.Redis) {
				s := NewStore(r.Handle)
				_ = s.PutRefreshToken(ctx, "tok", data)
				if err := s.DeleteRefreshToken(ctx, "tok"); err != nil {
					t.Fatalf("delete: %v", err)
				}
			},
			want: nil,
		},
		"adding a session": {
			op: func(r *redisfixture.Redis) {
				if err := NewStore(r.Handle).PutSession(ctx, "acct", Session{SessionID: "sess"}); err != nil {
					t.Fatalf("put session: %v", err)
				}
			},
			// The record, and the index that resolves the id to an account.
			want: []string{"account_sessions:acct", "session_index:sess"},
		},
		"removing a session": {
			op: func(r *redisfixture.Redis) {
				s := NewStore(r.Handle)
				_ = s.PutSession(ctx, "acct", Session{SessionID: "sess"})
				if err := s.RemoveSession(ctx, "acct", "sess"); err != nil {
					t.Fatalf("remove session: %v", err)
				}
			},
			// The record survives the session leaving it; the index does not.
			want: []string{"account_sessions:acct"},
		},
		"caching org ids": {
			op: func(r *redisfixture.Redis) {
				s := NewStore(r.Handle)
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
			op: func(r *redisfixture.Redis) {
				s := NewStore(r.Handle)
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

func TestTheStoredRecordHasTheShapeAReaderExpects(t *testing.T) {
	ctx := context.Background()
	r := redisfixture.New(t)
	s := NewStore(r.Handle)

	if err := s.UpdateAccountRecord(ctx, "acct", func(record *AccountRecord) error {
		record.Sessions["s1"] = Session{SessionID: "s1", CharacterHash: "hash"}
		return nil
	}); err != nil {
		t.Fatalf("update: %v", err)
	}

	stored, err := r.Server.Get(AccountSessionsKeyPrefix + "acct")
	if err != nil {
		t.Fatalf("read stored: %v", err)
	}
	var record AccountRecord
	if err := json.Unmarshal([]byte(stored), &record); err != nil {
		t.Fatalf("stored record does not decode: %v", err)
	}

	if record.AccountID != "acct" {
		t.Errorf("account id = %q", record.AccountID)
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
	if ttl := r.Server.TTL(AccountSessionsKeyPrefix + "acct"); ttl != SessionTTL {
		t.Errorf("ttl = %v, want %v", ttl, SessionTTL)
	}

	// Each write advances the version, which is what makes a stale write
	// detectable.
	if err := s.UpdateAccountRecord(ctx, "acct", func(*AccountRecord) error { return nil }); err != nil {
		t.Fatalf("second update: %v", err)
	}
	again, _, err := s.AccountRecord(ctx, "acct")
	if err != nil {
		t.Fatalf("read back: %v", err)
	}
	if again.GrantsVersion != 2 {
		t.Errorf("grants version = %d after a second write, want 2", again.GrantsVersion)
	}
}

// Expiry is a property of touching the record at all, not of one entry point
// remembering to sweep.
func TestPruningReachesEveryEntryPoint(t *testing.T) {
	ctx := context.Background()
	expired := time.Now().UTC().Add(-RefreshTokenTTL - time.Hour)

	for name, touch := range map[string]func(*Store) error{
		"a store mutation": func(s *Store) error {
			return s.UpdateAccountRecord(ctx, "acct", func(*AccountRecord) error { return nil })
		},
		"a live read": func(s *Store) error {
			_, err := s.LiveAccountRecord(ctx, "acct")
			return err
		},
	} {
		t.Run(name, func(t *testing.T) {
			r := redisfixture.New(t)
			s := NewStore(r.Handle)
			if err := s.UpdateAccountRecord(ctx, "acct", func(rec *AccountRecord) error {
				rec.Sessions["stale"] = Session{SessionID: "stale", StartedAt: expired, ReauthRequiredAt: expired}
				return nil
			}); err != nil {
				t.Fatalf("seed: %v", err)
			}
			if err := s.PutSessionIndex(ctx, "stale", "acct"); err != nil {
				t.Fatalf("seed index: %v", err)
			}

			if err := touch(s); err != nil {
				t.Fatalf("touch: %v", err)
			}

			record, _, err := s.AccountRecord(ctx, "acct")
			if err != nil {
				t.Fatalf("read back: %v", err)
			}
			if _, kept := record.Sessions["stale"]; kept {
				t.Error("an expired session survived")
			}
			if r.Server.Exists(SessionIndexKeyPrefix + "stale") {
				t.Error("the expired session's index was left behind")
			}
		})
	}
}

// The version counts writes to the stored record, so a caller saving a copy it
// read earlier must not rewind what concurrency is judged against.
func TestSaveAccountRecordDoesNotRewindTheVersion(t *testing.T) {
	ctx := context.Background()
	r := redisfixture.New(t)
	s := NewStore(r.Handle)

	for range 3 {
		if err := s.UpdateAccountRecord(ctx, "acct", func(*AccountRecord) error { return nil }); err != nil {
			t.Fatalf("seed: %v", err)
		}
	}
	before, _, err := s.AccountRecord(ctx, "acct")
	if err != nil {
		t.Fatalf("read: %v", err)
	}

	if err := s.SaveAccountRecord(ctx, &AccountRecord{
		AccountID:     "acct",
		GrantsVersion: 0,
		Sessions:      map[string]Session{"s1": {SessionID: "s1"}},
	}); err != nil {
		t.Fatalf("save: %v", err)
	}

	after, _, err := s.AccountRecord(ctx, "acct")
	if err != nil {
		t.Fatalf("read back: %v", err)
	}
	if after.GrantsVersion != before.GrantsVersion+1 {
		t.Fatalf("version = %d, want %d — a stale copy rewound it", after.GrantsVersion, before.GrantsVersion+1)
	}
	// The caller's contents still win; only the version is the store's.
	if _, kept := after.Sessions["s1"]; !kept {
		t.Errorf("the saved record's sessions were discarded: %v", after.Sessions)
	}
}

// A read for something that was never written is not a failure — the caller
// decides what an absent session or token means.
func TestAbsentReadsAreNotErrors(t *testing.T) {
	ctx := context.Background()
	s := NewStore(redisfixture.New(t).Handle)

	if data, found, err := s.RefreshToken(ctx, "nope"); err != nil || found || data != nil {
		t.Errorf("refresh token: %v %v %v", data, found, err)
	}
	if rec, found, err := s.AccountRecord(ctx, "nope"); err != nil || found || rec != nil {
		t.Errorf("account record: %v %v %v", rec, found, err)
	}
	if account, found, err := s.AccountForSession(ctx, "nope"); err != nil || found || account != "" {
		t.Errorf("session index: %q %v %v", account, found, err)
	}
	if token, found, err := s.FindTokenForSession(ctx, "nope"); err != nil || found || token != "" {
		t.Errorf("find token: %q %v %v", token, found, err)
	}
}

func TestUpdateStampsTheAccountOnANewRecord(t *testing.T) {
	ctx := context.Background()
	s := NewStore(redisfixture.New(t).Handle)

	if err := s.UpdateAccountRecord(ctx, "acct", func(rec *AccountRecord) error {
		if rec.AccountID != "acct" {
			t.Errorf("mutate saw account id %q, want it stamped before it runs", rec.AccountID)
		}
		if rec.Sessions == nil {
			t.Error("mutate saw a nil session map")
		}
		return nil
	}); err != nil {
		t.Fatalf("update: %v", err)
	}
}

// The scans hand back ids, not the keys they came from, so no caller re-derives
// one by trimming a prefix itself.
func TestScansReportIdsNotKeys(t *testing.T) {
	ctx := context.Background()
	r := redisfixture.New(t)
	s := NewStore(r.Handle)

	if err := s.PutSession(ctx, "acct", Session{SessionID: "sess"}); err != nil {
		t.Fatalf("put session: %v", err)
	}
	if err := s.PutRefreshToken(ctx, "tok", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put token: %v", err)
	}

	for name, each := range map[string]struct {
		visit func(context.Context, func([]string) error) error
		want  string
	}{
		"account keys":  {s.EachAccountKey, "acct"},
		"session index": {s.EachSessionIndexKey, "sess"},
		"refresh token": {s.EachRefreshTokenKey, "tok"},
	} {
		var seen []string
		if err := each.visit(ctx, func(ids []string) error {
			seen = append(seen, ids...)
			return nil
		}); err != nil {
			t.Fatalf("%s: %v", name, err)
		}
		if !slices.Contains(seen, each.want) {
			t.Errorf("%s reported %v, want to contain %q", name, seen, each.want)
		}
	}
}

func TestRevokeSessionTokensIgnoresAnEmptyToken(t *testing.T) {
	ctx := context.Background()
	r := redisfixture.New(t)
	s := NewStore(r.Handle)

	if err := s.PutRefreshToken(ctx, "tok", RefreshTokenData{SessionID: "sess"}); err != nil {
		t.Fatalf("put token: %v", err)
	}
	if err := s.RevokeSessionTokens(ctx, "", "sess"); err != nil {
		t.Fatalf("revoke with no presented token: %v", err)
	}
	if _, found, _ := s.RefreshToken(ctx, "tok"); !found {
		t.Fatal("a revoke with nothing presented must not delete anything")
	}
}

func TestDeleteSessionIndexesRemovesBothAndLeavesTheRecord(t *testing.T) {
	ctx := context.Background()
	r := redisfixture.New(t)
	s := NewStore(r.Handle)

	if err := s.PutSession(ctx, "acct", Session{SessionID: "sess"}); err != nil {
		t.Fatalf("put session: %v", err)
	}
	if err := s.PointSessionAtToken(ctx, "sess", "tok"); err != nil {
		t.Fatalf("point: %v", err)
	}
	if err := s.DeleteSessionIndexes(ctx, "sess"); err != nil {
		t.Fatalf("delete indexes: %v", err)
	}

	if r.Server.Exists(SessionIndexKeyPrefix + "sess") {
		t.Error("session index survived")
	}
	if r.Server.Exists(SessionRefreshIndexKeyPrefix + "sess") {
		t.Error("refresh index survived")
	}
	if !r.Server.Exists(AccountSessionsKeyPrefix + "acct") {
		t.Error("the record must not be touched by an index delete")
	}
}

// A rotate arriving with a stale token but a live session recovers the token the
// session actually holds — including when only a scan can find it.
func TestResolveTokenForValidSessionFallsBackToAScan(t *testing.T) {
	ctx := context.Background()
	r := redisfixture.New(t)
	s := NewStore(r.Handle)

	now := time.Now().UTC()
	if err := s.PutSession(ctx, "acct", Session{SessionID: "sess", StartedAt: now, LastSeenAt: now}); err != nil {
		t.Fatalf("put session: %v", err)
	}
	if err := s.PutRefreshToken(ctx, "tok", RefreshTokenData{
		AccountID: "acct", SessionID: "sess", SessionStart: now,
	}); err != nil {
		t.Fatalf("put token: %v", err)
	}
	if err := s.DeleteSessionIndexes(ctx, "sess"); err != nil {
		t.Fatalf("drop indexes: %v", err)
	}
	// The session index is what resolves the id, so put that back; only the
	// refresh index stays missing.
	if err := s.PutSessionIndex(ctx, "sess", "acct"); err != nil {
		t.Fatalf("restore session index: %v", err)
	}

	token, data, err := s.ResolveTokenForValidSession(ctx, "sess")
	if err != nil {
		t.Fatalf("resolve: %v", err)
	}
	if token != "tok" || data == nil || data.AccountID != "acct" {
		t.Fatalf("token = %q data = %+v", token, data)
	}

	if _, _, err := s.ResolveTokenForValidSession(ctx, "unknown"); err == nil {
		t.Fatal("an unknown session must not resolve a token")
	}
}

// The token carries its own chain start, but the session row can be stricter;
// rotate, bootstrap and middleware must all reach the stricter answer.
func TestRefreshTokenReauthExpiredConsultsTheSessionRow(t *testing.T) {
	ctx := context.Background()
	r := redisfixture.New(t)
	s := NewStore(r.Handle)

	now := time.Now().UTC()
	expired := now.Add(-RefreshTokenTTL - time.Hour)
	if err := s.PutSession(ctx, "acct", Session{
		SessionID: "sess", StartedAt: expired, LastSeenAt: expired, ReauthRequiredAt: expired,
	}); err != nil {
		t.Fatalf("put session: %v", err)
	}

	// A token whose own chain still looks live, naming a session that is not.
	token := &RefreshTokenData{AccountID: "acct", SessionID: "sess", SessionStart: now}
	if !s.RefreshTokenReauthExpired(ctx, token, now) {
		t.Fatal("the session row is stricter and must win")
	}
	if s.RefreshTokenReauthExpired(ctx, nil, now) {
		t.Fatal("no token is not an expired token")
	}
	if s.RefreshTokenReauthExpired(ctx, &RefreshTokenData{SessionStart: now}, now) {
		t.Fatal("a live token naming no session is not expired")
	}
}
