package planners

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"eve-industry-planner/api/helper/auth"
	"eve-industry-planner/shared/models/planner"
)

// The invite routes sit under a planner handle, and the handle is the rest of
// the path rather than one segment: an owner key is `kind:id`.
func TestInvitePathsSplitAtTheInviteSegment(t *testing.T) {
	t.Parallel()

	cases := []struct {
		path       string
		wantHandle string
		wantID     string
		wantFound  bool
	}{
		{"account:acct-1/invites/inv-1", "account:acct-1", "inv-1", true},
		{"corporation:corp_ref/invites/inv-2", "corporation:corp_ref", "inv-2", true},
		{"account:acct-1/invites", "", "", false},
		{"account:acct-1/invites/", "", "", false},
		{"/invites/inv-1", "", "", false},
		{"account:acct-1/invites/inv-1/extra", "", "", false},
		{"account:acct-1/settings", "", "", false},
	}
	for _, tc := range cases {
		handle, inviteID, found := cutInvitePath(tc.path)
		if found != tc.wantFound || handle != tc.wantHandle || inviteID != tc.wantID {
			t.Errorf("cutInvitePath(%q) = %q, %q, %v; want %q, %q, %v",
				tc.path, handle, inviteID, found, tc.wantHandle, tc.wantID, tc.wantFound)
		}
	}
}

// A route reached with the wrong verb says so rather than running a handler
// that would then need an authenticated account it has not got.
func TestInviteRoutesRefuseTheWrongMethod(t *testing.T) {
	t.Parallel()
	h := New(nil)

	cases := []struct {
		method string
		path   string
	}{
		{http.MethodPut, "/api/v1/planners/account:acct-1/invites"},
		{http.MethodDelete, "/api/v1/planners/account:acct-1/invites"},
		{http.MethodGet, "/api/v1/planners/account:acct-1/invites/inv-1"},
		{http.MethodPost, "/api/v1/planners/account:acct-1/invites/inv-1"},
		{http.MethodGet, "/api/v1/planners/join"},
		{http.MethodDelete, "/api/v1/planners/join"},
	}
	for _, tc := range cases {
		w := httptest.NewRecorder()
		h.Router(w, httptest.NewRequest(tc.method, tc.path, nil))
		if w.Code != http.StatusMethodNotAllowed {
			t.Errorf("%s %s = %d, want 405", tc.method, tc.path, w.Code)
		}
	}
}

// Join carries no owner handle, so it must not be mistaken for one — a planner
// called "join" would otherwise take the route.
func TestJoinIsARouteRatherThanAPlannerHandle(t *testing.T) {
	t.Parallel()
	h := New(nil)

	w := httptest.NewRecorder()
	h.Router(w, httptest.NewRequest(http.MethodPut, "/api/v1/planners/join", nil))
	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("PUT /planners/join = %d, want the join route's 405 rather than the planner route", w.Code)
	}
}

// A path under the prefix that names nothing this router serves is a 404 rather
// than falling through to a handler.
func TestUnknownPlannerPathsAreNotFound(t *testing.T) {
	t.Parallel()
	h := New(nil)

	for _, path := range []string{
		"/api/v1/planners/account:acct-1/invites/inv-1/extra",
		"/api/v1/planners/account:acct-1/unknown",
		"/api/v1/planners//invites",
	} {
		w := httptest.NewRecorder()
		h.Router(w, httptest.NewRequest(http.MethodGet, path, nil))
		if w.Code != http.StatusNotFound && w.Code != http.StatusMethodNotAllowed {
			t.Errorf("GET %s = %d, want it refused", path, w.Code)
		}
	}
}

// A refusal must not tell a caller holding an id whether the invite exists, was
// revoked, is bound to somebody else, or simply had the wrong token: all four
// answer the same. Expired and spent differ, but only the right token reaches
// them, so they disclose nothing a holder does not already have.
func TestEveryGuessableRefusalAnswersTheSame(t *testing.T) {
	t.Parallel()

	same := []error{
		planner.ErrInviteNotFound,
		planner.ErrInviteToken,
		planner.ErrInviteRevoked,
		planner.ErrInviteBound,
	}
	for _, err := range same {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodPost, "/api/v1/planners/join", nil)
		respondInviteRefused(w, r, inviteMetrics(r.Context()), err)
		if w.Code != http.StatusNotFound {
			t.Errorf("%v answered %d, want 404 like the others", err, w.Code)
		}
	}

	for _, err := range []error{planner.ErrInviteExpired, planner.ErrInviteSpent} {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodPost, "/api/v1/planners/join", nil)
		respondInviteRefused(w, r, inviteMetrics(r.Context()), err)
		if w.Code != http.StatusGone {
			t.Errorf("%v answered %d, want 410", err, w.Code)
		}
	}
}

// Join validates the redemption before it reaches Redis or Mongo, so these run
// without either.
func TestJoinRefusesAnIncompleteRedemption(t *testing.T) {
	t.Parallel()
	h := New(nil)

	cases := []struct {
		name string
		body string
	}{
		{"no body", ""},
		{"not json", "{"},
		{"no invite", `{"token":"t"}`},
		{"no token", `{"inviteID":"inv-1"}`},
		{"neither", `{}`},
	}
	for _, tc := range cases {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodPost, "/api/v1/planners/join", strings.NewReader(tc.body))
		r = r.WithContext(auth.WithAuthIdentity(r.Context(), "acct-1", "sess-1"))
		h.PostPlannerJoinHandler(w, r)
		if w.Code != http.StatusBadRequest {
			t.Errorf("%s = %d, want 400: %s", tc.name, w.Code, w.Body.String())
		}
	}
}

// A request with no account reaches no store: the session is what says who is
// joining, and an invite grants membership to somebody rather than to a token.
func TestJoinRefusesAnUnauthenticatedRequest(t *testing.T) {
	t.Parallel()
	h := New(nil)

	w := httptest.NewRecorder()
	h.PostPlannerJoinHandler(w, httptest.NewRequest(http.MethodPost, "/api/v1/planners/join",
		strings.NewReader(`{"inviteID":"inv-1","token":"t"}`)))
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("join with no account = %d, want 401", w.Code)
	}
}

// Every invite route needs an account before it needs anything else, so a
// request without one is refused rather than reaching a nil handle.
func TestInviteRoutesRefuseAnUnauthenticatedRequest(t *testing.T) {
	t.Parallel()
	h := New(nil)
	const handle = "account:acct-1"

	calls := map[string]func(w *httptest.ResponseRecorder){
		"issue": func(w *httptest.ResponseRecorder) {
			h.PostPlannerInviteHandler(w, httptest.NewRequest(http.MethodPost,
				"/api/v1/planners/"+handle+"/invites", nil), handle)
		},
		"list": func(w *httptest.ResponseRecorder) {
			h.GetPlannerInvitesHandler(w, httptest.NewRequest(http.MethodGet,
				"/api/v1/planners/"+handle+"/invites", nil), handle)
		},
		"revoke": func(w *httptest.ResponseRecorder) {
			h.DeletePlannerInviteHandler(w, httptest.NewRequest(http.MethodDelete,
				"/api/v1/planners/"+handle+"/invites/inv-1", nil), handle, "inv-1")
		},
	}
	for name, run := range calls {
		w := httptest.NewRecorder()
		run(w)
		if w.Code != http.StatusUnauthorized {
			t.Errorf("%s with no account = %d, want 401", name, w.Code)
		}
	}
}

// An account planner holds one member and a corporation or alliance roster
// follows the entity, so neither takes invites. Refused before the planner is
// read, so this needs no database.
func TestInviteRoutesRefuseAPlannerThatTakesNoInvites(t *testing.T) {
	t.Parallel()
	h := New(nil)
	const handle = "account:acct-1"

	calls := map[string]func(w *httptest.ResponseRecorder, r *http.Request){
		"issue": func(w *httptest.ResponseRecorder, r *http.Request) {
			h.PostPlannerInviteHandler(w, r, handle)
		},
		"list": func(w *httptest.ResponseRecorder, r *http.Request) {
			h.GetPlannerInvitesHandler(w, r, handle)
		},
		"revoke": func(w *httptest.ResponseRecorder, r *http.Request) {
			h.DeletePlannerInviteHandler(w, r, handle, "inv-1")
		},
	}
	for name, run := range calls {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodPost, "/api/v1/planners/"+handle+"/invites", nil)
		r = r.WithContext(auth.WithAuthIdentity(r.Context(), "acct-1", "sess-1"))
		run(w, r)
		if w.Code != http.StatusConflict {
			t.Errorf("%s for an account planner = %d, want 409: %s", name, w.Code, w.Body.String())
		}
	}
}
