package server

import (
	"encoding/json"
	"testing"
	"time"

	sessionreq "eve-industry-planner/shared/plannersession/request"
)

// Real HandleWS upgrade with seeded Redis session → connected frame + hosted account.
func TestIntegrationConnectReceivesConnected(t *testing.T) {
	f := newIntegFixture(t)
	f.seedSession("acct-connect", "sess-connect-1")

	conn := f.dial("sess-connect-1")
	msg := f.readJSONMessage(conn, 2*time.Second)
	if got, _ := msg["type"].(string); got != "connected" {
		t.Fatalf("type=%v want connected full=%v", msg["type"], msg)
	}
	clientID, _ := msg["clientID"].(string)
	if clientID == "" {
		t.Fatalf("missing clientID in %v", msg)
	}

	f.waitClients(1, 2*time.Second)
	if !f.Server.HostsTenant("account:acct-connect") {
		t.Fatalf("hosted=%v", f.Server.HostedTenants())
	}

	_ = conn.Close()
	f.waitClients(0, 2*time.Second)
	if f.Server.HostsTenant("account:acct-connect") {
		t.Fatal("account should clear after disconnect")
	}
}

func TestIntegrationConnectMissingSessionUnauthorized(t *testing.T) {
	f := newIntegFixture(t)
	status, body := f.dialRefuse("no-such-session")
	if status != 401 {
		t.Fatalf("status=%d body=%q want 401", status, body)
	}
}

func TestIntegrationConnectRefusedWhileDraining(t *testing.T) {
	f := newIntegFixture(t)
	f.seedSession("acct-d", "sess-d")
	f.Server.draining.Store(true)

	status, body := f.dialRefuse("sess-d")
	if status != 503 {
		t.Fatalf("status=%d body=%q want 503", status, body)
	}
	if !stringContainsFold(body, "draining") {
		t.Fatalf("body=%q", body)
	}
}

// A session revoked while the tab was open is refused by its own code, not
// folded into session_missing. The two are different repairs: revoked means
// sign in again, missing may just mean a rotate is mid-flight.
func TestIntegrationConnectRevokedSessionUnauthorized(t *testing.T) {
	f := newIntegFixture(t)
	f.seedRevokedSession("acct-revoked", "sess-revoked")

	status, body := f.dialRefuse("sess-revoked")
	if status != 401 {
		t.Fatalf("status=%d body=%q want 401", status, body)
	}
	if code := refusalCode(t, body); code != "session_revoked" {
		t.Fatalf("code=%q body=%q want session_revoked", code, body)
	}
}

// An upgrade carrying a session whose reauth window has elapsed is refused as
// session_missing, not reauth_required — pruning removes the row before anything
// can classify it, so the extract path never reaches its own reauth check.
//
// reauth_required reaches a client from the rotate endpoint instead, which reads
// the session start off the refresh token row rather than the pruned record.
func TestIntegrationConnectElapsedReauthWindowUnauthorized(t *testing.T) {
	f := newIntegFixture(t)
	f.seedElapsedSession("acct-elapsed", "sess-elapsed")

	status, body := f.dialRefuse("sess-elapsed")
	if status != 401 {
		t.Fatalf("status=%d body=%q want 401", status, body)
	}
	if code := refusalCode(t, body); code != "session_missing" {
		t.Fatalf("code=%q body=%q want session_missing", code, body)
	}
}

// Every upgrade refusal answers the envelope the REST surface answers, so one
// vocabulary covers both in a log or a proxy trace.
func TestIntegrationConnectRefusalCarriesTheSharedEnvelope(t *testing.T) {
	f := newIntegFixture(t)

	status, body := f.dialRefuse("no-such-session")
	if status != 401 {
		t.Fatalf("status=%d body=%q want 401", status, body)
	}
	var envelope sessionreq.CodedError
	if err := json.Unmarshal([]byte(body), &envelope); err != nil {
		t.Fatalf("refusal body is not the shared envelope: %v (body %q)", err, body)
	}
	if envelope.Code != "session_missing" || envelope.Message == "" {
		t.Fatalf("envelope=%+v", envelope)
	}
}

// refusalCode reads the code out of an upgrade refusal body.
func refusalCode(t *testing.T, body string) string {
	t.Helper()
	var envelope sessionreq.CodedError
	if err := json.Unmarshal([]byte(body), &envelope); err != nil {
		t.Fatalf("decode refusal body %q: %v", body, err)
	}
	return envelope.Code
}

// Redis being unreachable is a dependency outage, not a missing session. The
// REST middleware has answered 503 for this since the two were split; the
// upgrade answered 401 and sent the browser to a login it did not need.
func TestIntegrationConnectRedisOutageIsUnavailableNotUnauthorized(t *testing.T) {
	f := newIntegFixture(t)
	f.seedSession("acct-outage", "sess-outage")
	f.MR.SetError("redis down")

	status, body := f.dialRefuse("sess-outage")
	if status != 503 {
		t.Fatalf("status=%d body=%q want 503", status, body)
	}
	if code := refusalCode(t, body); code != "redis_unavailable" {
		t.Fatalf("code=%q body=%q want redis_unavailable", code, body)
	}
}
