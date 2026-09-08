package planner_test

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"eve-industry-planner/shared/models/planner"
)

func validInvite(t *testing.T) (planner.Invite, string) {
	t.Helper()
	token, hash, err := planner.NewInviteToken()
	if err != nil {
		t.Fatalf("new token: %v", err)
	}
	return planner.Invite{
		ID:        "inv-1",
		PlannerID: "account:acct-1",
		TokenHash: hash,
		MaxUses:   1,
		ExpiresAt: time.Now().Add(time.Hour).UTC(),
		CreatedBy: "acct-1",
		CreatedAt: time.Now().UTC(),
	}, token
}

// The token is what proves the bearer was given the invite; the id only names
// which one. A stored hash that could be reversed would make the id enough.
func TestAnInviteTokenIsNotRecoverableFromWhatIsStored(t *testing.T) {
	t.Parallel()
	invite, token := validInvite(t)

	if strings.Contains(string(invite.TokenHash), token) {
		t.Fatal("the stored hash contains the token")
	}
	if len(invite.TokenHash) != 32 {
		t.Fatalf("hash is %d bytes, want a sha-256", len(invite.TokenHash))
	}

	presented, err := planner.HashInviteToken(token)
	if err != nil {
		t.Fatalf("hash the token: %v", err)
	}
	if !invite.TokenMatches(presented) {
		t.Fatal("the token does not match its own hash")
	}
}

func TestAnotherTokenDoesNotMatch(t *testing.T) {
	t.Parallel()
	invite, _ := validInvite(t)
	other, _, err := planner.NewInviteToken()
	if err != nil {
		t.Fatalf("new token: %v", err)
	}

	presented, err := planner.HashInviteToken(other)
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if invite.TokenMatches(presented) {
		t.Fatal("a different token matched")
	}
}

func TestAMalformedTokenIsRefusedRatherThanHashed(t *testing.T) {
	t.Parallel()
	for _, token := range []string{"", "not-base64!", "c2hvcnQ"} {
		if _, err := planner.HashInviteToken(token); err == nil {
			t.Errorf("%q was accepted", token)
		}
	}
}

// Two tokens issued in a row must not collide, which is the whole of the
// unguessability claim.
func TestEveryInviteTokenDiffers(t *testing.T) {
	t.Parallel()
	seen := map[string]bool{}
	for range 100 {
		token, _, err := planner.NewInviteToken()
		if err != nil {
			t.Fatalf("new token: %v", err)
		}
		if seen[token] {
			t.Fatal("a token repeated")
		}
		seen[token] = true
	}
}

func TestWhyAnInviteIsRefused(t *testing.T) {
	t.Parallel()
	now := time.Now().UTC()
	revoked := now.Add(-time.Minute)

	cases := []struct {
		name    string
		mutate  func(*planner.Invite)
		account string
		want    error
	}{
		{"revoked", func(i *planner.Invite) { i.RevokedAt = &revoked }, "acct-2", planner.ErrInviteRevoked},
		{"expired", func(i *planner.Invite) { i.ExpiresAt = now.Add(-time.Second) }, "acct-2", planner.ErrInviteExpired},
		{"spent", func(i *planner.Invite) { i.Uses = i.MaxUses }, "acct-2", planner.ErrInviteSpent},
		{"bound elsewhere", func(i *planner.Invite) { i.BoundAccountID = "acct-3" }, "acct-2", planner.ErrInviteBound},
		{"bound to the caller", func(i *planner.Invite) { i.BoundAccountID = "acct-2" }, "acct-2", nil},
		{"open", func(*planner.Invite) {}, "acct-2", nil},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			invite, _ := validInvite(t)
			tc.mutate(&invite)
			if got := invite.Redeemable(tc.account, now); got != tc.want {
				t.Fatalf("Redeemable = %v, want %v", got, tc.want)
			}
		})
	}
}

// A revoked invite answers that it is revoked rather than that it is expired,
// whichever it also is: the caller reports why, and the reasons are not the same
// to whoever asks.
func TestRevocationOutranksExpiry(t *testing.T) {
	t.Parallel()
	now := time.Now().UTC()
	invite, _ := validInvite(t)
	revoked := now.Add(-time.Hour)
	invite.RevokedAt = &revoked
	invite.ExpiresAt = now.Add(-time.Minute)

	if got := invite.Redeemable("acct-2", now); got != planner.ErrInviteRevoked {
		t.Fatalf("Redeemable = %v, want revoked", got)
	}
}

// A stranger holding a bound invite learns that it is bound, never to whom.
func TestASummaryNamesNobody(t *testing.T) {
	t.Parallel()
	invite, _ := validInvite(t)
	invite.BoundAccountID = "acct-2"

	encoded, err := json.Marshal(invite.Summary())
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	for _, leaked := range []string{"acct-1", "acct-2", "tokenHash", "plannerID"} {
		if strings.Contains(string(encoded), leaked) {
			t.Fatalf("summary leaks %q: %s", leaked, encoded)
		}
	}
	if !invite.Summary().Bound {
		t.Fatal("a bound invite does not say it is bound")
	}
}

func TestAnInviteMustBeFitToStore(t *testing.T) {
	t.Parallel()
	cases := map[string]func(*planner.Invite){
		"no id":      func(i *planner.Invite) { i.ID = "" },
		"no planner": func(i *planner.Invite) { i.PlannerID = "" },
		"no hash":    func(i *planner.Invite) { i.TokenHash = nil },
		"short hash": func(i *planner.Invite) { i.TokenHash = []byte("short") },
		"no creator": func(i *planner.Invite) { i.CreatedBy = "" },
		"no uses":    func(i *planner.Invite) { i.MaxUses = 0 },
		"no expiry":  func(i *planner.Invite) { i.ExpiresAt = time.Time{} },
	}
	for name, mutate := range cases {
		t.Run(name, func(t *testing.T) {
			invite, _ := validInvite(t)
			mutate(&invite)
			if err := invite.Validate(); err == nil {
				t.Fatal("accepted")
			}
		})
	}

	invite, _ := validInvite(t)
	if err := invite.Validate(); err != nil {
		t.Fatalf("a sound invite was refused: %v", err)
	}
}
