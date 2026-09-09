// Package sessionhandover checks that the services agree about a planner
// session they all read from Redis.
//
// Each service used to reach sessions by importing the API's code, so agreement
// was guaranteed by construction. They now call shared/plannersession instead,
// which is a better arrangement but makes agreement an assumption rather than a
// fact — and it is the kind of assumption unit tests cannot check, because each
// side can pass its own tests while disagreeing about what a stored session
// means.
//
// So this drives one session through the path each service actually uses: the
// API's login write and its auth middleware, the websocket's upgrade read, the
// worker's grants update, and the core's maintenance sweep.
package sessionhandover

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"eve-industry-planner/api/middleware"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/plannersession"
	"eve-industry-planner/shared/plannersession/maintenance"
	sessionreq "eve-industry-planner/shared/plannersession/request"
	"eve-industry-planner/testing/keys"
	"eve-industry-planner/testing/redisfixture"
)

const (
	accountID = "acct-handover"
	sessionID = "sess-handover"
)

func corpRef(t *testing.T, id int64) string {
	t.Helper()
	ref, err := keys.EntityCipher(t).Corporation(id)
	if err != nil {
		t.Fatalf("corporation ref: %v", err)
	}
	return ref
}

func corporationGrant(t *testing.T, id int64) models.OwnerKeys {
	t.Helper()
	return models.NewOwnerKeys().Add(models.AccountOwner(accountID)).Add(models.CorporationOwner(corpRef(t, id)))
}

func TestASessionSurvivesEveryServiceThatTouchesIt(t *testing.T) {
	ctx := context.Background()
	fake := redisfixture.New(t)
	store := plannersession.NewStore(fake.Handle)

	// The API's login path: write the session, then the grants it resolved.
	now := time.Now().UTC()
	if err := store.PutSession(ctx, accountID, plannersession.Session{
		SessionID:     sessionID,
		CharacterHash: "hash",
		AppVersion:    "1.0.0",
		StartedAt:     now,
		LastSeenAt:    now,
	}); err != nil {
		t.Fatalf("api login write: %v", err)
	}
	if err := store.SetGrants(ctx, accountID, corporationGrant(t, 100)); err != nil {
		t.Fatalf("api grants write: %v", err)
	}

	// The websocket's upgrade path presents the session id as a query parameter.
	wsRequest := httptest.NewRequest(http.MethodGet, "/ws?"+sessionreq.SessionIDQueryParam+"="+sessionID, nil)
	identity, err := sessionreq.ExtractSession(ctx, wsRequest, store)
	if err != nil {
		t.Fatalf("websocket upgrade read: %v", err)
	}
	if identity.AccountID != accountID {
		t.Fatalf("websocket resolved account %q, want %q", identity.AccountID, accountID)
	}
	if !identity.Session.Grants.Allows(models.AccountOwner(accountID)) {
		t.Fatal("the websocket sees a session without the grants the API wrote")
	}

	// The worker's grants task rewrites what the account may reach.
	if err := store.SetGrants(ctx, accountID, corporationGrant(t, 200)); err != nil {
		t.Fatalf("worker grants update: %v", err)
	}

	// The API's auth middleware presents the same session as a header, and must
	// see the grants the worker wrote — not the ones login wrote.
	var seen *sessionreq.Identity
	handler := middleware.AuthConstructor(fake.Handle)(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		got, ok := sessionreq.TryExtractSession(r.Context(), r, store)
		if !ok {
			t.Error("the middleware admitted a request it could not resolve")
			return
		}
		seen = got
		if id := sessionreq.AccountIDFromContext(r.Context()); id != accountID {
			t.Errorf("middleware bound account %q to the context, want %q", id, accountID)
		}
	}))

	apiRequest := httptest.NewRequest(http.MethodGet, "/api/v1/anything", nil)
	apiRequest.Header.Set(sessionreq.SessionIDHeader, sessionID)
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, apiRequest)

	if recorder.Code != http.StatusOK {
		t.Fatalf("api middleware rejected the session with %d", recorder.Code)
	}
	if seen == nil {
		t.Fatal("the handler never ran")
	}
	if !seen.Session.Grants.Allows(models.CorporationOwner(corpRef(t, 200))) {
		t.Fatalf("api sees grants %v, want the corporation the worker granted", seen.Session.Grants.OwnerKeys)
	}
	if seen.Session.Grants.Allows(models.CorporationOwner(corpRef(t, 100))) {
		t.Fatalf("api still sees the corporation login granted; the worker's update did not replace it")
	}

	// The core's maintenance sweep runs over the same keyspace and must leave a
	// live session alone.
	if _, err := maintenance.Run(ctx, store, maintenance.Options{}); err != nil {
		t.Fatalf("core maintenance sweep: %v", err)
	}
	if _, err := sessionreq.ExtractSession(ctx, wsRequest, store); err != nil {
		t.Fatalf("the sweep broke a live session: %v", err)
	}
}

// The sweep is the one service path that deletes, so what it removes and what it
// spares is the agreement most worth pinning.
func TestTheSweepRemovesOnlyWhatNoSessionHolds(t *testing.T) {
	ctx := context.Background()
	fake := redisfixture.New(t)
	store := plannersession.NewStore(fake.Handle)

	now := time.Now().UTC()
	if err := store.PutSession(ctx, accountID, plannersession.Session{
		SessionID: sessionID, StartedAt: now, LastSeenAt: now,
	}); err != nil {
		t.Fatalf("seed session: %v", err)
	}
	if err := store.PutRefreshToken(ctx, "live-token", plannersession.RefreshTokenData{
		AccountID: accountID, SessionID: sessionID, SessionStart: now,
	}); err != nil {
		t.Fatalf("seed live token: %v", err)
	}
	if err := store.PutRefreshToken(ctx, "orphan-token", plannersession.RefreshTokenData{
		AccountID: accountID, SessionID: "gone", SessionStart: now,
	}); err != nil {
		t.Fatalf("seed orphan token: %v", err)
	}
	stats, err := maintenance.Run(ctx, store, maintenance.Options{})
	if err != nil {
		t.Fatalf("sweep: %v", err)
	}
	if stats.OrphanRefreshTokensRemoved != 1 {
		t.Fatalf("stats = %+v, want one orphan token removed", stats)
	}

	if _, found, _ := store.RefreshToken(ctx, "live-token"); !found {
		t.Error("the sweep revoked a token its session still holds")
	}
	if _, found, _ := store.RefreshToken(ctx, "orphan-token"); found {
		t.Error("the sweep kept a token no session holds")
	}
	if _, found, _ := store.AccountForSession(ctx, sessionID); !found {
		t.Error("the sweep removed a live session's index")
	}
}
