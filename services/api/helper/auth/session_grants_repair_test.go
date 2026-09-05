package auth

import (
	"context"
	"encoding/json"
	"testing"

	rediscore "eve-industry-planner/shared/core/redis"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/testing/redisfake"
)

// writeLegacyRecord stores a record in the shape the previous release wrote.
func writeLegacyRecord(t *testing.T, ctx context.Context, rdb *redisfake.Redis, accountID string, corpRefs, allianceRefs []string) {
	t.Helper()
	payload := map[string]any{
		"account_id": accountID,
		"grants": map[string]any{
			"corporation_refs": corpRefs,
			"alliance_refs":    allianceRefs,
		},
		"sessions": map[string]any{
			"s1": map[string]any{
				"session_id":     "s1",
				"character_hash": "hash-1",
			},
		},
		"grants_version": 3,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if err := rdb.Client.Set(ctx, AccountSessionsKeyPrefix+accountID, b, SessionTTL).Err(); err != nil {
		t.Fatalf("seed: %v", err)
	}
}

// The previous shape decodes to no grants at all, so the repair is what puts the
// corporation and alliance back before anyone reconnects.
func TestRepairSessionGrantsRewritesTheLegacyShape(t *testing.T) {
	ctx := context.Background()
	rdb := redisfake.New(t)
	corp := testCorpRef(t, 100)
	alliance := testAllianceRef(t, 200)

	writeLegacyRecord(t, ctx, rdb, "acct-legacy", []string{corp}, []string{alliance})

	report, err := RepairSessionGrants(ctx, rdb.Client, false)
	if err != nil {
		t.Fatalf("RepairSessionGrants: %v", err)
	}
	if report.Scanned != 1 || report.Repaired != 1 || report.Failed != 0 {
		t.Fatalf("report = %+v, want 1 scanned, 1 repaired, 0 failed", report)
	}

	rec, err := GetAccountSessionsRecord(ctx, rdb.Client, "acct-legacy")
	if err != nil {
		t.Fatalf("reload: %v", err)
	}
	for _, want := range []models.Owner{
		models.AccountOwner("acct-legacy"),
		models.CorporationOwner(corp),
		models.AllianceOwner(alliance),
	} {
		if !rec.Grants.Allows(want) {
			t.Fatalf("grants = %v, want to include %s", rec.Grants.OwnerKeys, want.Key())
		}
	}
}

// The record also holds the session map that keeps an account signed in, so the
// repair must leave it alone.
func TestRepairSessionGrantsKeepsSessions(t *testing.T) {
	ctx := context.Background()
	rdb := redisfake.New(t)
	writeLegacyRecord(t, ctx, rdb, "acct-keep", []string{testCorpRef(t, 1)}, nil)

	if _, err := RepairSessionGrants(ctx, rdb.Client, false); err != nil {
		t.Fatalf("RepairSessionGrants: %v", err)
	}

	rec, err := GetAccountSessionsRecord(ctx, rdb.Client, "acct-keep")
	if err != nil {
		t.Fatalf("reload: %v", err)
	}
	sess, ok := rec.Sessions["s1"]
	if !ok {
		t.Fatalf("sessions = %v, want s1 to survive the repair", rec.Sessions)
	}
	if sess.CharacterHash != "hash-1" {
		t.Fatalf("session hash = %q, want hash-1", sess.CharacterHash)
	}
	if !sess.Grants.Allows(models.AccountOwner("acct-keep")) {
		t.Fatal("expected session-level grants to be rewritten with the record")
	}
}

// Re-running the release must not rewrite what it already wrote.
func TestRepairSessionGrantsIsIdempotent(t *testing.T) {
	ctx := context.Background()
	rdb := redisfake.New(t)
	writeLegacyRecord(t, ctx, rdb, "acct-twice", []string{testCorpRef(t, 5)}, nil)

	if _, err := RepairSessionGrants(ctx, rdb.Client, false); err != nil {
		t.Fatalf("first pass: %v", err)
	}
	second, err := RepairSessionGrants(ctx, rdb.Client, false)
	if err != nil {
		t.Fatalf("second pass: %v", err)
	}
	if second.Repaired != 0 {
		t.Fatalf("second pass repaired %d, want 0", second.Repaired)
	}
}

// A dry run reports what it would do and writes nothing.
func TestRepairSessionGrantsDryRunWritesNothing(t *testing.T) {
	ctx := context.Background()
	rdb := redisfake.New(t)
	writeLegacyRecord(t, ctx, rdb, "acct-dry", []string{testCorpRef(t, 7)}, nil)

	report, err := RepairSessionGrants(ctx, rdb.Client, true)
	if err != nil {
		t.Fatalf("RepairSessionGrants: %v", err)
	}
	if report.Repaired != 1 {
		t.Fatalf("dry run repaired = %d, want 1 reported", report.Repaired)
	}

	var raw map[string]json.RawMessage
	if err := rediscore.GetJSON(ctx, rdb.Client, AccountSessionsKeyPrefix+"acct-dry", &raw); err != nil {
		t.Fatalf("reload raw: %v", err)
	}
	var stored struct {
		OwnerKeys []string `json:"owner_keys"`
	}
	if err := json.Unmarshal(raw["grants"], &stored); err != nil {
		t.Fatalf("decode grants: %v", err)
	}
	if len(stored.OwnerKeys) != 0 {
		t.Fatalf("dry run wrote %v", stored.OwnerKeys)
	}
}

// An account already on the new shape gains its own key without losing what it holds.
func TestRepairSessionGrantsAddsTheAccountsOwnKey(t *testing.T) {
	ctx := context.Background()
	rdb := redisfake.New(t)
	corp := testCorpRef(t, 42)

	payload, err := json.Marshal(map[string]any{
		"account_id": "acct-partial",
		"grants":     map[string]any{"owner_keys": []string{models.CorporationOwner(corp).Key()}},
		"sessions":   map[string]any{},
	})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if err := rdb.Client.Set(ctx, AccountSessionsKeyPrefix+"acct-partial", payload, SessionTTL).Err(); err != nil {
		t.Fatalf("seed: %v", err)
	}

	if _, err := RepairSessionGrants(ctx, rdb.Client, false); err != nil {
		t.Fatalf("RepairSessionGrants: %v", err)
	}
	rec, err := GetAccountSessionsRecord(ctx, rdb.Client, "acct-partial")
	if err != nil {
		t.Fatalf("reload: %v", err)
	}
	if !rec.Grants.Allows(models.AccountOwner("acct-partial")) {
		t.Fatalf("grants = %v, want the account's own key", rec.Grants.OwnerKeys)
	}
	if !rec.Grants.Allows(models.CorporationOwner(corp)) {
		t.Fatalf("grants = %v, want the corporation it already held", rec.Grants.OwnerKeys)
	}
}
