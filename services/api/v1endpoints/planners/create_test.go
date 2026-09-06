package planners

import (
	"context"
	"errors"
	"testing"

	"eve-industry-planner/api/apideps"
	"eve-industry-planner/shared/crypto/entityid"
	"eve-industry-planner/shared/models"
)

func testHandlers(t *testing.T) (*Handlers, *entityid.Cipher) {
	t.Helper()
	cipher, err := entityid.New([]byte("a-test-secret-long-enough-for-the-cipher"))
	if err != nil {
		t.Fatalf("build cipher: %v", err)
	}
	return New(&apideps.Deps{EntityCipher: cipher}), cipher
}

// One of EVE's own corporations is refused before anything is written and before
// EVE is asked for a name: nobody administers such a corporation, and every
// character who has not joined a player one is in it.
func TestPlannerNameRefusesNPCCorporations(t *testing.T) {
	t.Parallel()
	h, cipher := testHandlers(t)

	ref, err := cipher.Corporation(1_000_035)
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}

	// No ESI client on the handler, so reaching the lookup would fail with a
	// different error — the refusal has to come first.
	_, err = h.plannerName(context.Background(), models.CorporationOwner(ref))
	if !errors.Is(err, errNPCCorporation) {
		t.Fatalf("err = %v, want the NPC corporation refusal", err)
	}
}

// An account's own planner is named without asking EVE anything.
func TestPlannerNameForAnAccountNeedsNoLookup(t *testing.T) {
	t.Parallel()
	h, _ := testHandlers(t)

	name, err := h.plannerName(context.Background(), models.AccountOwner("acct-1"))
	if err != nil {
		t.Fatalf("plannerName: %v", err)
	}
	if name == "" {
		t.Error("an account planner was left unnamed")
	}
}

// A player corporation is not refused: it reaches the lookup, which fails here
// only because the test handler has no ESI client.
func TestPlannerNameAllowsPlayerCorporations(t *testing.T) {
	t.Parallel()
	h, cipher := testHandlers(t)

	ref, err := cipher.Corporation(98_000_001)
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}

	_, err = h.plannerName(context.Background(), models.CorporationOwner(ref))
	if errors.Is(err, errNPCCorporation) {
		t.Fatal("a player corporation was refused as an NPC one")
	}
	if err == nil {
		t.Fatal("expected the lookup to fail without an ESI client")
	}
}

// A handle whose kind has no naming rule is refused rather than written unnamed.
func TestPlannerNameRefusesAnUnknownKind(t *testing.T) {
	t.Parallel()
	h, _ := testHandlers(t)

	if _, err := h.plannerName(context.Background(),
		models.Owner{Kind: models.OwnerPlanner, ID: "01HZ"}); err == nil {
		t.Fatal("a kind with no naming rule was accepted")
	}
}
