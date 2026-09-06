package server

import (
	"testing"

	"eve-industry-planner/shared/models"
)

func TestHostedTenantsAccountViaUserConnections(t *testing.T) {
	t.Parallel()
	s := &Server{
		userConnections: map[string]map[string]bool{
			"acct-1": {"c1": true},
		},
		ownerKeyToClients: make(map[string]map[string]bool),
	}
	if !s.HostsTenant("account:acct-1") {
		t.Fatal("expected account hosted")
	}
	if s.HostedTenantCount() != 1 {
		t.Fatalf("count=%d", s.HostedTenantCount())
	}
	delete(s.userConnections, "acct-1")
	if s.HostsTenant("account:acct-1") || s.HostedTenantCount() != 0 {
		t.Fatal("expected cleared")
	}
}

func TestHostedTenantsOrgViaIndexesAndRefcount(t *testing.T) {
	t.Parallel()
	s := &Server{
		userConnections: map[string]map[string]bool{
			"acct-a": {"a": true},
			"acct-b": {"b": true},
		},
		ownerKeyToClients: make(map[string]map[string]bool),
	}
	corpKey := models.CorporationOwner(wsTestCorpRefValue).Key()
	allianceKey := models.AllianceOwner(wsTestAllianceRefValue).Key()
	a := &Client{
		id: "a", AccountID: "acct-a",
		Scopes: models.OwnerKeys{corpKey, allianceKey},
	}
	b := &Client{
		id: "b", AccountID: "acct-b",
		Scopes: models.OwnerKeys{corpKey},
	}

	s.setClientScopes(a, models.OwnerKeys{corpKey, allianceKey})
	s.setClientScopes(b, models.OwnerKeys{corpKey})

	if !s.HostsTenant("corporation:"+wsTestCorpRefValue) || !s.HostsTenant("alliance:"+wsTestAllianceRefValue) {
		t.Fatalf("hosted=%v", s.HostedTenants())
	}

	s.removeClientFromOwnerPools(a)
	delete(s.userConnections, "acct-a")

	if !s.HostsTenant("corporation:" + wsTestCorpRefValue) {
		t.Fatal("corp should remain via client b")
	}
	if s.HostsTenant("alliance:" + wsTestAllianceRefValue) {
		t.Fatal("alliance should drop with client a")
	}
	if !s.HostsTenant("account:acct-b") || s.HostsTenant("account:acct-a") {
		t.Fatalf("accounts=%v", s.HostedTenants())
	}

	got := s.HostedTenants()
	// 2 accounts initially; after unregister a: acct-b + the corporation only (alliance gone).
	want := map[string]bool{"account:acct-b": true, "corporation:" + wsTestCorpRefValue: true}
	if len(got) != 2 {
		t.Fatalf("HostedTenants=%v want 2 keys", got)
	}
	for _, k := range got {
		if !want[k] {
			t.Fatalf("unexpected key %q in %v", k, got)
		}
	}
	// Two tabs on one corporation would still be a single corporation: key.
	if s.HostedTenantCount() != 2 {
		t.Fatalf("HostedTenantCount=%d want 2 distinct keys", s.HostedTenantCount())
	}
}

// A ref the owner vocabulary refuses must address no pool. Owner.Key renders a
// zero owner as ":", so indexing on it unchecked would read one shared bucket
// that every unusable ref shares.
func TestClientsForOwnerRefusesTheZeroOwner(t *testing.T) {
	t.Parallel()
	s := &Server{ownerKeyToClients: map[string]map[string]bool{
		":": {"someone": true},
	}}
	if got := s.clientsForOwner(models.CorporationOwner("not-a-ref")); got != nil {
		t.Fatalf("clientsForOwner(zero) = %v, want nil", got)
	}
	if s.HostsTenant(":") {
		t.Fatal("the zero owner key must not name a hosted tenant")
	}
}
