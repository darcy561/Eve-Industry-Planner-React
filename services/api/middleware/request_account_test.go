package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/plannersession"
	sessionreq "eve-industry-planner/shared/plannersession/request"
	"eve-industry-planner/testing/redisfake"

	eipredis "eve-industry-planner/shared/redis"
)

func seedValidAccountSession(t *testing.T, rdb *eipredis.Redis, accountID, sessionID string) {
	t.Helper()
	ctx := t.Context()
	now := time.Now().UTC()
	rec := &plannersession.AccountRecord{
		AccountID: accountID,
		Sessions: map[string]plannersession.Session{
			sessionID: {
				SessionID:        sessionID,
				CharacterHash:    "hash-test",
				StartedAt:        now,
				LastSeenAt:       now,
				ReauthRequiredAt: plannersession.ReauthDeadlineFromSessionStart(now),
			},
		},
	}
	if err := plannersession.NewStore(rdb).SaveAccountRecord(ctx, rec); err != nil {
		t.Fatalf("SaveAccountSessionsRecord: %v", err)
	}
	if err := rdb.Driver().Set(ctx, plannersession.SessionIndexKeyPrefix+sessionID, accountID, plannersession.SessionTTL).Err(); err != nil {
		t.Fatalf("set session index: %v", err)
	}
}

func TestOptionalAccountLogConstructor_BindsValidSession(t *testing.T) {
	t.Parallel()

	rdb := eipredis.NewRedis(redisfake.New(t).Client)

	const (
		accountID = "acct-public"
		sessionID = "sess-public"
	)
	seedValidAccountSession(t, rdb, accountID, sessionID)

	var gotAccountID, gotSessionID string
	handler := OptionalAccountLogConstructor(rdb)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAccountID = logs.RequestAccountIDFromContext(r.Context())
		gotSessionID = logs.RequestSessionIDFromContext(r.Context())
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/feedback", nil)
	req.AddCookie(&http.Cookie{Name: sessionreq.SessionCookieName, Value: sessionID})
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d", rec.Code)
	}
	if gotAccountID != accountID {
		t.Fatalf("account_id = %q", gotAccountID)
	}
	if gotSessionID != sessionID {
		t.Fatalf("session_id = %q", gotSessionID)
	}
}

func TestAuthConstructor_BindsRequestIdentityOnSuccess(t *testing.T) {
	t.Parallel()

	rdb := eipredis.NewRedis(redisfake.New(t).Client)

	const (
		accountID = "acct-private"
		sessionID = "sess-private"
	)
	seedValidAccountSession(t, rdb, accountID, sessionID)

	var gotAccountID, gotSessionID string
	handler := AuthConstructor(rdb)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAccountID = logs.RequestAccountIDFromContext(r.Context())
		gotSessionID = logs.RequestSessionIDFromContext(r.Context())
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/corporation-claims", nil)
	req.AddCookie(&http.Cookie{Name: sessionreq.SessionCookieName, Value: sessionID})
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d", rec.Code)
	}
	if gotAccountID != accountID {
		t.Fatalf("account_id = %q", gotAccountID)
	}
	if gotSessionID != sessionID {
		t.Fatalf("session_id = %q", gotSessionID)
	}
}
