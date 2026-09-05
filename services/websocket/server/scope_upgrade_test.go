package server

import (
	"eve-industry-planner/shared/models"
	"testing"

	"eve-industry-planner/testing/keys"
)

// A client asks for scopes by id; grants and indexes hold refs. Conversion happens
// at this boundary, so a raw id must never be compared against a grant.
func TestScopeUpgradeConvertsRequestedIDsToRefs(t *testing.T) {
	h := keys.EntityCipher(t)
	corpRef, err := h.Corporation(10)
	if err != nil {
		t.Fatalf("RefFromCorporationID: %v", err)
	}

	s := &Server{entityCipher: h, ownerKeyToClients: map[string]map[string]bool{}}
	client := &Client{
		id:           "c1",
		ownerCeiling: models.OwnerKeys(nil).Add(models.CorporationOwner(corpRef)),
	}

	if !s.GrantRequestedScopes(client, []string{"10"}, nil) {
		t.Fatal("expected the upgrade to apply after converting the id")
	}
	if !client.Scopes.Has(models.CorporationOwner(corpRef)) {
		t.Fatalf("scopes = %v, want the corporation %s", client.Scopes, corpRef)
	}
}

// An id outside the grant ceiling must still be refused after conversion.
func TestScopeUpgradeStillHonoursTheGrantCeiling(t *testing.T) {
	h := keys.EntityCipher(t)
	granted, err := h.Corporation(10)
	if err != nil {
		t.Fatalf("RefFromCorporationID: %v", err)
	}

	s := &Server{entityCipher: h, ownerKeyToClients: map[string]map[string]bool{}}
	client := &Client{
		id:           "c1",
		ownerCeiling: models.OwnerKeys(nil).Add(models.CorporationOwner(granted)),
	}

	if s.GrantRequestedScopes(client, []string{"999"}, nil) {
		t.Fatal("a corporation outside the grant ceiling must be refused")
	}
}

// Malformed input must be dropped rather than compared raw, which would let a
// client's own string sneak into a grant comparison.
func TestScopeUpgradeDropsMalformedIDs(t *testing.T) {
	h := keys.EntityCipher(t)
	s := &Server{entityCipher: h, ownerKeyToClients: map[string]map[string]bool{}}
	client := &Client{
		id:           "c1",
		ownerCeiling: models.OwnerKeys{"corp_whatever"},
	}

	for _, bad := range [][]string{{"corp_whatever"}, {"not-a-number"}, {"0"}, {"-5"}} {
		if s.GrantRequestedScopes(client, bad, nil) {
			t.Fatalf("expected %v to be dropped", bad)
		}
	}
}

// Without the key no upgrade can be derived; dropping is correct, but it must not
// fall through to comparing raw ids.
func TestScopeUpgradeWithoutAHelperDropsEverything(t *testing.T) {
	s := &Server{ownerKeyToClients: map[string]map[string]bool{}}
	client := &Client{
		id:           "c1",
		ownerCeiling: models.OwnerKeys{"10"},
	}
	if s.GrantRequestedScopes(client, []string{"10"}, nil) {
		t.Fatal("a raw id must not match a grant when no helper is configured")
	}
}
