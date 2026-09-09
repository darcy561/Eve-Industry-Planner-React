package request

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"eve-industry-planner/shared/dependency"
	"eve-industry-planner/shared/plannersession"
	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/redisfake"
)

func newStore(t *testing.T, fake *redisfake.Redis) *plannersession.Store {
	t.Helper()
	return plannersession.NewStore(eipredis.NewRedis(fake.Client))
}

func TestSessionIDPrefersTheHeaderThenTheQueryThenTheCookie(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/?"+SessionIDQueryParam+"=from-query", nil)
	r.AddCookie(&http.Cookie{Name: SessionCookieName, Value: "from-cookie"})
	r.Header.Set(SessionIDHeader, "from-header")
	if got := SessionID(r); got != "from-header" {
		t.Fatalf("with a header present: %q", got)
	}

	r.Header.Del(SessionIDHeader)
	if got := SessionID(r); got != "from-query" {
		t.Fatalf("with only a query param: %q", got)
	}

	r = httptest.NewRequest(http.MethodGet, "/", nil)
	r.AddCookie(&http.Cookie{Name: SessionCookieName, Value: "from-cookie"})
	if got := SessionID(r); got != "from-cookie" {
		t.Fatalf("with only a cookie: %q", got)
	}
	if got := SessionID(httptest.NewRequest(http.MethodGet, "/", nil)); got != "" {
		t.Fatalf("with nothing at all: %q", got)
	}
}

func TestSessionCookieRoundTrips(t *testing.T) {
	w := httptest.NewRecorder()
	SetSessionCookie(w, "sess")

	r := httptest.NewRequest(http.MethodGet, "/", nil)
	for _, c := range w.Result().Cookies() {
		r.AddCookie(c)
	}
	if got := ReadSessionCookie(r); got != "sess" {
		t.Fatalf("read back %q", got)
	}
	if got := SessionCookieMaxAgeSeconds(); got != int(plannersession.RefreshTokenTTL.Seconds()) {
		t.Fatalf("max age = %d", got)
	}
}

func TestClearSessionCookieExpiresIt(t *testing.T) {
	w := httptest.NewRecorder()
	ClearSessionCookie(w)
	cookies := w.Result().Cookies()
	if len(cookies) != 1 || cookies[0].MaxAge >= 0 {
		t.Fatalf("clearing should send an expiring cookie, got %+v", cookies)
	}
}

func TestExtractSessionReportsWhyItFailed(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	store := newStore(t, fake)

	withID := func(sid string) *http.Request {
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		if sid != "" {
			r.Header.Set(SessionIDHeader, sid)
		}
		return r
	}

	// No session id at all.
	_, err := ExtractSession(ctx, withID(""), store)
	assertSessionError(t, err, "session_missing", reasonSessionAbsent)

	// An id nothing indexes.
	_, err = ExtractSession(ctx, withID("unknown"), store)
	assertSessionError(t, err, "session_missing", reasonSessionIndexMissing)

	// An index that resolves, but a record that no longer holds the row: a
	// different fault from an id nothing indexes, and logged as one.
	if err := store.PutSessionIndex(ctx, "stranded", "acct"); err != nil {
		t.Fatalf("put index: %v", err)
	}
	_, err = ExtractSession(ctx, withID("stranded"), store)
	assertSessionError(t, err, "session_missing", reasonSessionRowMissing)
}

func TestExtractSessionRejectsRevokedAndExpiredSessions(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	store := newStore(t, fake)

	revokedAt := time.Now().UTC()
	if err := store.PutSession(ctx, "acct", plannersession.Session{SessionID: "revoked", RevokedAt: &revokedAt}); err != nil {
		t.Fatalf("put revoked: %v", err)
	}
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set(SessionIDHeader, "revoked")
	_, err := ExtractSession(ctx, r, store)
	assertSessionError(t, err, "session_revoked", "")
}

func TestExtractSessionReturnsTheIdentity(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	store := newStore(t, fake)

	if err := store.PutSession(ctx, "acct", plannersession.Session{SessionID: "sess"}); err != nil {
		t.Fatalf("put session: %v", err)
	}
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set(SessionIDHeader, "sess")

	identity, err := ExtractSession(ctx, r, store)
	if err != nil {
		t.Fatalf("extract: %v", err)
	}
	if identity.AccountID != "acct" || identity.SessionID != "sess" {
		t.Fatalf("identity = %+v", identity)
	}
	if _, ok := TryExtractSession(ctx, r, store); !ok {
		t.Fatal("TryExtractSession should agree")
	}
}

func TestIdentityRoundTripsThroughContext(t *testing.T) {
	ctx := WithIdentity(context.Background(), " acct ", " sess ")
	if got := AccountIDFromContext(ctx); got != "acct" {
		t.Fatalf("account id = %q", got)
	}
	if got := SessionIDFromContext(ctx); got != "sess" {
		t.Fatalf("session id = %q", got)
	}
	if got := AccountIDFromContext(context.Background()); got != "" {
		t.Fatalf("an unstamped context should be empty, got %q", got)
	}
}

func TestFailureDetailCarriesWhatTheRequestPresented(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.AddCookie(&http.Cookie{Name: SessionCookieName, Value: "sess"})
	r.Header.Set(SessionIDHeader, "sess")

	d := FailureDetailFromError(&SessionError{Code: "reauth_required", AccountID: "acct", SessionID: "sess"}, r)
	if !d.HasEipSessionCookie || !d.HasPlannerSessionIDHeader {
		t.Fatalf("detail should record what was presented: %+v", d)
	}
	if d.ClientFailureMessage() != "auth session reauth required" {
		t.Fatalf("message = %q", d.ClientFailureMessage())
	}
	fields := d.ClientFailureDetail(map[string]any{"extra": 1})
	if fields["failure_class"] != "auth_reauth_required" || fields["extra"] != 1 {
		t.Fatalf("fields = %v", fields)
	}
	if len(d.LogFields("k", "v")) < 2 {
		t.Fatal("log fields should carry the extras")
	}
}

func TestIsInfrastructureErrorOnlyForRedisFailures(t *testing.T) {
	if !IsInfrastructureError(&SessionError{Reason: reasonRedisError}) {
		t.Fatal("a redis-reason failure is infrastructure")
	}
	if IsInfrastructureError(&SessionError{Reason: reasonSessionAbsent}) {
		t.Fatal("a missing session is not infrastructure")
	}
	if IsInfrastructureError(nil) {
		t.Fatal("no error is not infrastructure")
	}
}

func assertSessionError(t *testing.T, err error, wantCode, wantReason string) {
	t.Helper()
	sessErr, ok := err.(*SessionError)
	if !ok {
		t.Fatalf("error = %v (%T), want *SessionError", err, err)
	}
	if sessErr.Code != wantCode {
		t.Fatalf("code = %q, want %q", sessErr.Code, wantCode)
	}
	if wantReason != "" && sessErr.Reason != wantReason {
		t.Fatalf("reason = %q, want %q", sessErr.Reason, wantReason)
	}
}

// With no connection the store cannot say whether a session exists. Reporting
// "session missing" would blame the caller for an outage, so the failure has to
// stay classifiable as a dependency problem.
func TestExtractSessionReportsAnOutageRatherThanAMissingSession(t *testing.T) {
	ctx := context.Background()
	store := plannersession.NewStore(eipredis.NewRedis(nil))

	for name, r := range map[string]*http.Request{
		"no session id presented": httptest.NewRequest(http.MethodGet, "/", nil),
		"a session id presented":  httptest.NewRequest(http.MethodGet, "/?"+SessionIDQueryParam+"=sess", nil),
	} {
		_, err := ExtractSession(ctx, r, store)
		if err == nil {
			t.Fatalf("%s: expected a failure", name)
		}
		if !IsInfrastructureError(err) && !dependency.IsUnavailable(err) {
			t.Errorf("%s: error %v is neither infrastructure nor unavailable", name, err)
		}
	}
}
