package server

import (
	"context"
	"encoding/json"
	"strconv"
	"testing"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/testing/keys"
)

// The ids a client names its planners by, and the owners they resolve to.
const (
	wsTestCorpIDA = int64(98000001)
	wsTestCorpIDB = int64(98000002)
)

func activePlannerMsg(t *testing.T, handle string) []byte {
	t.Helper()
	raw, err := json.Marshal(activePlannerMessage{Type: "active_planner", Owner: handle})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	return raw
}

// corpHandle is what a client sends, and corpOwner is what it addresses.
func corpHandle(id int64) string {
	return "corporation:" + strconv.FormatInt(id, 10)
}

func corpOwner(t *testing.T, id int64) models.Owner {
	t.Helper()
	ref, err := keys.EntityCipher(t).Corporation(id)
	if err != nil {
		t.Fatalf("encrypt corporation %d: %v", id, err)
	}
	return models.CorporationOwner(ref)
}

// Switching replaces the planner a connection receives rather than adding to it.
// A merge could only ever widen, so nothing would stop receiving the planner it
// left — which is the whole reason the message this replaces was removed.
func TestActivePlannerReplacesRatherThanWidens(t *testing.T) {
	f := newIntegFixture(t)

	const account = "acct-switcher"
	corpA := corpOwner(t, wsTestCorpIDA)
	corpB := corpOwner(t, wsTestCorpIDB)

	client := f.newClient("switcher", account, nil, nil)
	client.Ceiling = models.NewOwnerKeys().
		Add(models.AccountOwner(account)).Add(corpA).Add(corpB).Normalized()
	client.Scopes = client.Ceiling
	f.register(client)

	f.Server.handleActivePlannerWS(context.Background(), client, activePlannerMsg(t, corpHandle(wsTestCorpIDA)))

	if !client.Scopes.Has(corpA) {
		t.Error("the planner just switched to is not in scope")
	}
	if client.Scopes.Has(corpB) {
		t.Error("the planner left behind is still in scope: the switch widened rather than replaced")
	}

	// And back again, which only works because the ceiling was kept.
	f.Server.handleActivePlannerWS(context.Background(), client, activePlannerMsg(t, corpHandle(wsTestCorpIDB)))
	if !client.Scopes.Has(corpB) || client.Scopes.Has(corpA) {
		t.Errorf("scopes after switching back = %v", client.Scopes)
	}
}

// The account's own key survives every switch. It carries the account's settings
// and watchlist, which stay live wherever the account is working.
func TestActivePlannerKeepsTheAccountsOwnScope(t *testing.T) {
	f := newIntegFixture(t)

	const account = "acct-keeps-own"
	own := models.AccountOwner(account)
	corp := corpOwner(t, wsTestCorpIDA)

	client := f.newClient("keeper", account, nil, nil)
	client.Ceiling = models.NewOwnerKeys().Add(own).Add(corp).Normalized()
	client.Scopes = client.Ceiling
	f.register(client)

	f.Server.handleActivePlannerWS(context.Background(), client, activePlannerMsg(t, corpHandle(wsTestCorpIDA)))

	if !client.Scopes.Has(own) {
		t.Error("switching to a corporation planner silenced the account's own documents")
	}
	if !client.Scopes.Has(corp) {
		t.Error("the corporation planner is not in scope")
	}
}

// Switching to the account's own planner leaves one key rather than two copies of
// it: the active planner and the account are the same owner, which composes
// without a case of its own.
func TestActivePlannerToOwnPlannerCollapsesToOneScope(t *testing.T) {
	f := newIntegFixture(t)

	const account = "acct-own-planner"
	own := models.AccountOwner(account)

	client := f.newClient("own", account, nil, nil)
	client.Ceiling = models.NewOwnerKeys().
		Add(own).Add(corpOwner(t, wsTestCorpIDA)).Normalized()
	client.Scopes = client.Ceiling
	f.register(client)

	f.Server.handleActivePlannerWS(context.Background(), client, activePlannerMsg(t, own.Key()))

	if len(client.Scopes) != 1 || !client.Scopes.Has(own) {
		t.Errorf("scopes = %v, want just the account's own key", client.Scopes)
	}
}

// A client naming an owner the session was never granted keeps the scopes it had.
// The ceiling is what the session may reach, and a switch selects within it.
func TestActivePlannerRefusesAnOwnerOutsideTheCeiling(t *testing.T) {
	f := newIntegFixture(t)

	const account = "acct-refused"
	own := models.AccountOwner(account)
	granted := corpOwner(t, wsTestCorpIDA)
	notGranted := corpOwner(t, wsTestCorpIDB)

	client := f.newClient("refused", account, nil, nil)
	client.Ceiling = models.NewOwnerKeys().Add(own).Add(granted).Normalized()
	client.Scopes = client.Ceiling
	f.register(client)

	f.Server.handleActivePlannerWS(context.Background(), client, activePlannerMsg(t, corpHandle(wsTestCorpIDB)))

	if client.Scopes.Has(notGranted) {
		t.Fatal("a connection received a planner its session was never granted")
	}
	if !client.Scopes.Has(granted) || !client.Scopes.Has(own) {
		t.Errorf("a refused switch changed the scopes: %v", client.Scopes)
	}
}

// An unreadable message changes nothing, rather than narrowing the connection to
// whatever an empty owner would produce.
func TestActivePlannerRefusesUnreadableMessages(t *testing.T) {
	f := newIntegFixture(t)

	const account = "acct-bad-input"
	own := models.AccountOwner(account)
	corp := corpOwner(t, wsTestCorpIDA)

	client := f.newClient("bad-input", account, nil, nil)
	client.Ceiling = models.NewOwnerKeys().Add(own).Add(corp).Normalized()
	client.Scopes = client.Ceiling
	f.register(client)

	for _, msg := range [][]byte{
		[]byte("{"),
		[]byte(`{"type":"active_planner"}`),
		[]byte(`{"type":"active_planner","owner":"not-a-key"}`),
		// A ref where an id belongs: a client returning what it was never given.
		[]byte(`{"type":"active_planner","owner":"corporation:corp_56_J_Dz"}`),
		[]byte(`{"type":"active_planner","owner":""}`),
	} {
		f.Server.handleActivePlannerWS(context.Background(), client, msg)
		if len(client.Scopes) != 2 {
			t.Fatalf("message %q changed the scopes to %v", msg, client.Scopes)
		}
	}
}
