package plannerinvites

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"eve-industry-planner/shared/models/planner"
	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/redisfake"
)

const testPlanner = "account:acct-1"

func testStore(t *testing.T) *Store {
	t.Helper()
	return New(eipredis.NewRedis(redisfake.New(t).Client))
}

func issued(t *testing.T, store *Store, now time.Time, shape func(*planner.Invite)) (planner.Invite, string) {
	t.Helper()
	token, hash, err := planner.NewInviteToken()
	if err != nil {
		t.Fatalf("token: %v", err)
	}
	invite := planner.Invite{
		ID:        "inv-" + token[:8],
		PlannerID: testPlanner,
		TokenHash: hash,
		MaxUses:   1,
		ExpiresAt: now.Add(time.Hour),
		CreatedBy: "acct-1",
		CreatedAt: now,
	}
	if shape != nil {
		shape(&invite)
	}
	if err := store.Issue(context.Background(), invite, now); err != nil {
		t.Fatalf("issue: %v", err)
	}
	return invite, token
}

func TestAnIssuedInviteIsFoundAndSpent(t *testing.T) {
	t.Parallel()
	store := testStore(t)
	ctx := context.Background()
	now := time.Now().UTC()

	invite, token := issued(t, store, now, nil)

	pending, err := store.Pending(ctx, testPlanner, now)
	if err != nil {
		t.Fatalf("pending: %v", err)
	}
	if len(pending) != 1 || pending[0].ID != invite.ID {
		t.Fatalf("pending = %v, want the invite just issued", pending)
	}

	spent, err := store.Spend(ctx, invite.ID, token, "acct-2", now)
	if err != nil {
		t.Fatalf("spend: %v", err)
	}
	if spent.Uses != 1 {
		t.Fatalf("uses = %d after one redemption, want 1", spent.Uses)
	}
	if spent.PlannerID != testPlanner {
		t.Fatalf("spent invite names %q, want %q", spent.PlannerID, testPlanner)
	}
}

// A one-use invite admits one account. Anyone holding the link after that is
// refused, which is what a use count is for.
func TestAOneUseInviteIsSpentOnce(t *testing.T) {
	t.Parallel()
	store := testStore(t)
	ctx := context.Background()
	now := time.Now().UTC()

	invite, token := issued(t, store, now, nil)

	if _, err := store.Spend(ctx, invite.ID, token, "acct-2", now); err != nil {
		t.Fatalf("first spend: %v", err)
	}
	if _, err := store.Spend(ctx, invite.ID, token, "acct-3", now); !errors.Is(err, planner.ErrInviteSpent) {
		t.Fatalf("second spend = %v, want spent", err)
	}
}

// Many callers redeeming at once spend no more than the invite allows.
//
// This does not prove the redemption is atomic: miniredis serves every command
// from one goroutine, so a read-then-write would pass here too. What it does
// cover is the accounting — that concurrent callers see one use count rather
// than each their own — and it is the shape a live Redis would fail on if the
// script were replaced by two round trips.
func TestConcurrentRedemptionsSpendOnlyWhatTheInviteAllows(t *testing.T) {
	t.Parallel()
	store := testStore(t)
	ctx := context.Background()
	now := time.Now().UTC()

	const allowed = 3
	invite, token := issued(t, store, now, func(i *planner.Invite) { i.MaxUses = allowed })

	var (
		wg       sync.WaitGroup
		mu       sync.Mutex
		admitted int
	)
	for range 32 {
		wg.Go(func() {
			if _, err := store.Spend(ctx, invite.ID, token, "acct-2", now); err == nil {
				mu.Lock()
				admitted++
				mu.Unlock()
			}
		})
	}
	wg.Wait()

	if admitted != allowed {
		t.Fatalf("%d redemptions succeeded, want %d", admitted, allowed)
	}
}

// A wrong token must not consume a use, or anyone holding the id could exhaust
// an invite without ever being able to redeem it.
func TestAWrongTokenSpendsNothing(t *testing.T) {
	t.Parallel()
	store := testStore(t)
	ctx := context.Background()
	now := time.Now().UTC()

	invite, token := issued(t, store, now, nil)
	other, _, err := planner.NewInviteToken()
	if err != nil {
		t.Fatalf("token: %v", err)
	}

	if _, err := store.Spend(ctx, invite.ID, other, "acct-2", now); !errors.Is(err, planner.ErrInviteToken) {
		t.Fatalf("spend with a wrong token = %v, want a token refusal", err)
	}

	stored, err := store.Load(ctx, invite.ID)
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if stored.Uses != 0 {
		t.Fatalf("uses = %d after a wrong token, want 0", stored.Uses)
	}
	if _, err := store.Spend(ctx, invite.ID, token, "acct-2", now); err != nil {
		t.Fatalf("the right token was refused afterwards: %v", err)
	}
}

func TestABoundInviteAdmitsOnlyItsAccount(t *testing.T) {
	t.Parallel()
	store := testStore(t)
	ctx := context.Background()
	now := time.Now().UTC()

	invite, token := issued(t, store, now, func(i *planner.Invite) { i.BoundAccountID = "acct-2" })

	if _, err := store.Spend(ctx, invite.ID, token, "acct-3", now); !errors.Is(err, planner.ErrInviteBound) {
		t.Fatalf("spend by another account = %v, want bound", err)
	}
	if _, err := store.Spend(ctx, invite.ID, token, "acct-2", now); err != nil {
		t.Fatalf("the bound account was refused: %v", err)
	}
}

func TestARevokedInviteIsGone(t *testing.T) {
	t.Parallel()
	store := testStore(t)
	ctx := context.Background()
	now := time.Now().UTC()

	invite, token := issued(t, store, now, nil)
	if err := store.Revoke(ctx, testPlanner, invite.ID); err != nil {
		t.Fatalf("revoke: %v", err)
	}

	if _, err := store.Spend(ctx, invite.ID, token, "acct-2", now); !errors.Is(err, planner.ErrInviteNotFound) {
		t.Fatalf("spend after revoke = %v, want not found", err)
	}
	pending, err := store.Pending(ctx, testPlanner, now)
	if err != nil {
		t.Fatalf("pending: %v", err)
	}
	if len(pending) != 0 {
		t.Fatalf("pending = %v, want none after a revoke", pending)
	}
}

// Revoking one that has already gone is not an error: the caller asked for the
// link to stop working, and it does not.
func TestRevokingTwiceIsNotAnError(t *testing.T) {
	t.Parallel()
	store := testStore(t)
	ctx := context.Background()

	if err := store.Revoke(ctx, testPlanner, "never-existed"); err != nil {
		t.Fatalf("revoke: %v", err)
	}
}

// The record's TTL is the expiry, so an invite that has run out is not there to
// be read — and the index entry it left behind is pruned rather than counted.
func TestAnExpiredInviteLeavesNothingBehind(t *testing.T) {
	t.Parallel()
	fake := redisfake.New(t)
	store := New(eipredis.NewRedis(fake.Client))
	ctx := context.Background()
	now := time.Now().UTC()

	invite, token := issued(t, store, now, func(i *planner.Invite) { i.ExpiresAt = now.Add(time.Minute) })
	fake.Server.FastForward(2 * time.Minute)

	if _, err := store.Spend(ctx, invite.ID, token, "acct-2", now.Add(2*time.Minute)); !errors.Is(err, planner.ErrInviteNotFound) {
		t.Fatalf("spend after expiry = %v, want not found", err)
	}
	pending, err := store.Pending(ctx, testPlanner, now.Add(2*time.Minute))
	if err != nil {
		t.Fatalf("pending: %v", err)
	}
	if len(pending) != 0 {
		t.Fatalf("pending = %v, want none once expired", pending)
	}
}

func TestAPlannerCannotHoldMoreThanTheCap(t *testing.T) {
	t.Parallel()
	store := testStore(t)
	ctx := context.Background()
	now := time.Now().UTC()

	for i := range MaxPendingPerPlanner {
		_, _, err := planner.NewInviteToken()
		if err != nil {
			t.Fatalf("token: %v", err)
		}
		issued(t, store, now, func(inv *planner.Invite) {
			inv.ID = "inv-" + string(rune('a'+i%26)) + time.Now().Format("150405.000000000")
		})
	}

	_, hash, err := planner.NewInviteToken()
	if err != nil {
		t.Fatalf("token: %v", err)
	}
	err = store.Issue(ctx, planner.Invite{
		ID: "one-too-many", PlannerID: testPlanner, TokenHash: hash, MaxUses: 1,
		ExpiresAt: now.Add(time.Hour), CreatedBy: "acct-1", CreatedAt: now,
	}, now)
	if !errors.Is(err, ErrTooManyInvites) {
		t.Fatalf("issue past the cap = %v, want a refusal", err)
	}
}

// One planner's invites are not another's, so a list cannot leak across.
func TestAnInviteBelongsToOnePlanner(t *testing.T) {
	t.Parallel()
	store := testStore(t)
	ctx := context.Background()
	now := time.Now().UTC()

	issued(t, store, now, nil)

	other, err := store.Pending(ctx, "corporation:corp_ref", now)
	if err != nil {
		t.Fatalf("pending: %v", err)
	}
	if len(other) != 0 {
		t.Fatalf("another planner sees %v", other)
	}
}

// A handle with no client answers rather than panicking: a role that did not
// open Redis holds a nil handle.
func TestAStoreWithoutRedisReports(t *testing.T) {
	t.Parallel()
	store := New(nil)
	ctx := context.Background()

	if _, err := store.Pending(ctx, testPlanner, time.Now()); !errors.Is(err, eipredis.ErrNoClient) {
		t.Fatalf("Pending = %v, want no client", err)
	}
	if _, err := store.Spend(ctx, "inv-1", "token", "acct-2", time.Now()); err == nil {
		t.Fatal("Spend was allowed with no client")
	}
}

// Drive the script directly, past the Go checks, to prove its own guards fire.
// They are what holds when two callers race, so a guard that never runs is a
// guard that is not there.
func TestTheScriptGuardsForItself(t *testing.T) {
	t.Parallel()
	r := eipredis.NewRedis(redisfake.New(t).Client)
	ctx := context.Background()
	now := time.Now().UTC()

	spent := planner.Invite{
		ID: "s", PlannerID: testPlanner, TokenHash: make([]byte, 32), MaxUses: 1, Uses: 1,
		ExpiresAt: now.Add(time.Hour), CreatedBy: "a", CreatedAt: now,
	}
	_ = r.PutJSON(ctx, recordKey("s"), spent, time.Hour)
	if got, _ := r.Run(ctx, spendInviteScript, []string{recordKey("s")}, "acct-2").Text(); got != "err:spent" {
		t.Errorf("a spent invite was not refused by the script: %q", got)
	}

	bound := spent
	bound.Uses = 0
	bound.BoundAccountID = "acct-9"
	_ = r.PutJSON(ctx, recordKey("b"), bound, time.Hour)
	if got, _ := r.Run(ctx, spendInviteScript, []string{recordKey("b")}, "acct-2").Text(); got != "err:bound" {
		t.Errorf("a bound invite was not refused by the script: %q", got)
	}

	if got, _ := r.Run(ctx, spendInviteScript, []string{recordKey("missing")}, "acct-2").Text(); got != "err:not_found" {
		t.Errorf("a missing invite was not refused by the script: %q", got)
	}

	revoked := spent
	revoked.Uses = 0
	when := now.Add(-time.Minute)
	revoked.RevokedAt = &when
	_ = r.PutJSON(ctx, recordKey("r"), revoked, time.Hour)
	if got, _ := r.Run(ctx, spendInviteScript, []string{recordKey("r")}, "acct-2").Text(); got != "err:revoked" {
		t.Errorf("a revoked invite was not refused by the script: %q", got)
	}
}

// Issuing under an id something already holds is refused rather than replacing
// it: a caller reusing an id would otherwise retire a credential somebody holds
// with nothing reporting that it had.
func TestIssueDoesNotReplaceAnInvite(t *testing.T) {
	t.Parallel()
	store := testStore(t)
	ctx := context.Background()
	now := time.Now().UTC()

	first, firstToken := issued(t, store, now, func(i *planner.Invite) { i.ID = "same-id" })

	_, hash, err := planner.NewInviteToken()
	if err != nil {
		t.Fatalf("token: %v", err)
	}
	second := first
	second.TokenHash = hash
	if err := store.Issue(ctx, second, now); !errors.Is(err, ErrInviteExists) {
		t.Fatalf("issue over an existing id = %v, want a refusal", err)
	}

	if _, err := store.Spend(ctx, "same-id", firstToken, "acct-2", now); err != nil {
		t.Fatalf("the original invite stopped working: %v", err)
	}
}

// A spent invite still lists until it expires: the creator asked what is
// outstanding, and one that was used is part of that answer.
func TestAFullySpentInviteStillLists(t *testing.T) {
	t.Parallel()
	store := testStore(t)
	ctx := context.Background()
	now := time.Now().UTC()

	invite, token := issued(t, store, now, nil)
	if _, err := store.Spend(ctx, invite.ID, token, "acct-2", now); err != nil {
		t.Fatalf("spend: %v", err)
	}

	pending, err := store.Pending(ctx, testPlanner, now)
	if err != nil {
		t.Fatalf("pending: %v", err)
	}
	if len(pending) != 1 {
		t.Fatalf("pending = %v, want the spent invite still listed", pending)
	}
	if pending[0].Uses != 1 {
		t.Fatalf("uses = %d, want the redemption recorded", pending[0].Uses)
	}
}
