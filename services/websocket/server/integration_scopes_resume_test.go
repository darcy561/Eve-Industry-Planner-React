package server

import (
	"fmt"
	"testing"
	"time"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/testing/wait"
)

// A connection receives what its session grants, without asking: the ceiling is
// known before the socket is open, so there is nothing for a browser to request.
func TestIntegrationScopesAreDerivedAtConnect(t *testing.T) {
	f := newIntegFixture(t)
	const (
		accountID = "acct-derived"
		sessionID = "sess-derived"
	)
	f.seedSessionWithGrants(accountID, sessionID, []int64{10}, []int64{99})

	conn := f.dial(sessionID)
	_ = f.readJSONMessage(conn, 2*time.Second)
	f.waitClients(1, 2*time.Second)

	corpTenant := models.CorporationOwner(wsTestCorpRef(t, 10)).Key()
	allianceTenant := models.AllianceOwner(wsTestAllianceRef(t, 99)).Key()
	wait.For(t, 2*time.Second, func() (bool, string) {
		ok := f.Server.HostsTenant(corpTenant) && f.Server.HostsTenant(allianceTenant)
		return ok, fmt.Sprintf("hosted=%v, want %s and %s", f.Server.HostedTenants(), corpTenant, allianceTenant)
	})
}

// An account granted nothing beyond itself hosts no organisation tenant, so a
// connection cannot reach an owner its session never held.
func TestIntegrationScopesStopAtTheCeiling(t *testing.T) {
	f := newIntegFixture(t)
	const (
		accountID = "acct-ceiling"
		sessionID = "sess-ceiling"
	)
	f.seedSessionWithGrants(accountID, sessionID, nil, nil)

	conn := f.dial(sessionID)
	_ = f.readJSONMessage(conn, 2*time.Second)
	f.waitClients(1, 2*time.Second)

	if got := f.Server.HostsTenant(models.CorporationOwner(wsTestCorpRef(t, 10)).Key()); got {
		t.Fatalf("hosted=%v, want no organisation tenant for an account granted none", f.Server.HostedTenants())
	}
}

// Resume restores document subscriptions. Scopes are not among them: they come
// from the ceiling on the new connection, so a resume neither carries nor needs
// them.
func TestIntegrationSessionResumeKeepsDerivedScopes(t *testing.T) {
	f := newIntegFixture(t)
	const (
		accountID = "acct-resume"
		sessionID = "sess-resume"
	)
	f.seedSessionWithGrants(accountID, sessionID, []int64{10}, nil)

	conn1 := f.dial(sessionID)
	connected := f.readJSONMessage(conn1, 2*time.Second)
	prevID, _ := connected["clientID"].(string)
	if prevID == "" {
		t.Fatalf("missing clientID in %v", connected)
	}
	f.waitClients(1, 2*time.Second)

	_ = conn1.Close()
	f.waitClients(0, 2*time.Second)

	conn2 := f.dial(sessionID)
	_ = f.readJSONMessage(conn2, 2*time.Second)
	f.waitClients(1, 2*time.Second)

	f.writeJSON(conn2, map[string]any{
		"type":             "session_resume",
		"previousClientID": prevID,
	})
	if resume := f.readJSONOfType(conn2, "resume_ack", 2*time.Second); resume == nil {
		t.Fatal("expected a resume_ack")
	}

	corpTenant := models.CorporationOwner(wsTestCorpRef(t, 10)).Key()
	if !f.Server.HostsTenant(corpTenant) {
		t.Fatalf("hosted after resume=%v, want %s", f.Server.HostedTenants(), corpTenant)
	}
}

// The account owner is delivered through userConnections, so it must not also sit
// in the owner index: a connection in both places is one tenant reported twice,
// and hosted-tenant counts drive placement.
func TestIntegrationAccountIsHostedOnce(t *testing.T) {
	f := newIntegFixture(t)
	const (
		accountID = "acct-once"
		sessionID = "sess-once"
	)
	f.seedSessionWithGrants(accountID, sessionID, []int64{10}, nil)

	conn := f.dial(sessionID)
	_ = f.readJSONMessage(conn, 2*time.Second)
	f.waitClients(1, 2*time.Second)

	accountTenant := models.AccountOwner(accountID).Key()
	var seen int
	for _, tenant := range f.Server.HostedTenants() {
		if tenant == accountTenant {
			seen++
		}
	}
	if seen != 1 {
		t.Fatalf("hosted=%v, want %s exactly once", f.Server.HostedTenants(), accountTenant)
	}
	if got, want := f.Server.HostedTenantCount(), 2; got != want {
		t.Fatalf("HostedTenantCount=%d, want %d (the account and its corporation)", got, want)
	}
}
