package helper

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"
	sessionreq "eve-industry-planner/shared/plannersession/request"
	"eve-industry-planner/testing/keys"
)

type stubMemberships struct {
	mayReach bool
	err      error
	asked    []models.Owner
}

func (s *stubMemberships) AccountMayReach(_ context.Context, _ string, owner models.Owner) (bool, error) {
	s.asked = append(s.asked, owner)
	return s.mayReach, s.err
}

func ownerRequest(t *testing.T, accountID, handle string) *http.Request {
	t.Helper()
	r := httptest.NewRequest(http.MethodPut, "/api/v1/job-documents", nil)
	if handle != "" {
		r.Header.Set(PlannerOwnerHeader, handle)
	}
	if accountID != "" {
		r = r.WithContext(sessionreq.WithIdentity(r.Context(), accountID, "sess-1"))
	}
	return r
}

func trackerFor(t *testing.T) *RequestMetricsTracker {
	t.Helper()
	return BeginRequestMetrics(context.Background(), RequestMetricsHooks{})
}

// A request naming no planner writes into the account's own, which keeps every
// client that predates the header working.
func TestRequestPlannerOwnerDefaultsToTheAccountsOwnPlanner(t *testing.T) {
	t.Parallel()
	memberships := &stubMemberships{}
	rec := httptest.NewRecorder()

	owner, ok := RequestPlannerOwner(rec, ownerRequest(t, "acct-1", ""), memberships,
		keys.EntityCipher(t), trackerFor(t), "job_documents")

	if !ok {
		t.Fatalf("a request with no planner was refused: %d", rec.Code)
	}
	if owner != models.AccountOwner("acct-1") {
		t.Errorf("owner = %v, want the account's own planner", owner)
	}
	if len(memberships.asked) != 0 {
		t.Error("the account's own planner cost a membership read")
	}
}

// A member writing into a planner they hold a row for gets that planner as the
// owner, not their own.
func TestRequestPlannerOwnerAcceptsAPlannerTheAccountReaches(t *testing.T) {
	t.Parallel()
	cipher := keys.EntityCipher(t)
	ref, err := cipher.Corporation(98000001)
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}
	memberships := &stubMemberships{mayReach: true}
	rec := httptest.NewRecorder()

	owner, ok := RequestPlannerOwner(rec, ownerRequest(t, "acct-1", "corporation:98000001"),
		memberships, cipher, trackerFor(t), "job_documents")

	if !ok {
		t.Fatalf("a reachable planner was refused: %d %s", rec.Code, rec.Body.String())
	}
	if owner != models.CorporationOwner(ref) {
		t.Errorf("owner = %v, want the corporation planner", owner)
	}
	if len(memberships.asked) != 1 {
		t.Fatalf("membership reads = %d, want exactly one", len(memberships.asked))
	}
}

// Naming a planner the account holds no row for is refused, and answered 404 so
// the id reveals only that it is not theirs.
func TestRequestPlannerOwnerRefusesAPlannerTheAccountDoesNotReach(t *testing.T) {
	t.Parallel()
	rec := httptest.NewRecorder()

	if _, ok := RequestPlannerOwner(rec, ownerRequest(t, "acct-1", "corporation:98000001"),
		&stubMemberships{mayReach: false}, keys.EntityCipher(t), trackerFor(t), "job_documents"); ok {
		t.Fatal("a planner the account holds no membership for was accepted")
	}
	if rec.Code != http.StatusNotFound {
		t.Errorf("code = %d, want %d", rec.Code, http.StatusNotFound)
	}
}

// A membership lookup that fails refuses rather than falling back to the
// account's own planner, which would write into the wrong one.
func TestRequestPlannerOwnerRefusesWhenTheMembershipReadFails(t *testing.T) {
	t.Parallel()
	rec := httptest.NewRecorder()

	if _, ok := RequestPlannerOwner(rec, ownerRequest(t, "acct-1", "corporation:98000001"),
		&stubMemberships{err: errors.New("mongo down")}, keys.EntityCipher(t),
		trackerFor(t), "job_documents"); ok {
		t.Fatal("a failed membership read was treated as permission")
	}
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("code = %d, want %d", rec.Code, http.StatusInternalServerError)
	}
}

// An account naming its own planner explicitly is the same answer as naming
// none, and still costs no membership read.
func TestRequestPlannerOwnerTakesTheAccountsOwnHandleWithoutARead(t *testing.T) {
	t.Parallel()
	memberships := &stubMemberships{}
	rec := httptest.NewRecorder()

	owner, ok := RequestPlannerOwner(rec, ownerRequest(t, "acct-1", "account:acct-1"),
		memberships, keys.EntityCipher(t), trackerFor(t), "job_documents")

	if !ok {
		t.Fatalf("an account's own handle was refused: %d", rec.Code)
	}
	if owner != models.AccountOwner("acct-1") {
		t.Errorf("owner = %v, want the account's own planner", owner)
	}
	if len(memberships.asked) != 0 {
		t.Error("the account's own planner cost a membership read")
	}
}

// A handle that does not parse is a bad request, not a fallback to the account.
func TestRequestPlannerOwnerRefusesAnUnparseableHandle(t *testing.T) {
	t.Parallel()
	rec := httptest.NewRecorder()

	if _, ok := RequestPlannerOwner(rec, ownerRequest(t, "acct-1", "not-a-handle"),
		&stubMemberships{mayReach: true}, keys.EntityCipher(t), trackerFor(t),
		"job_documents"); ok {
		t.Fatal("an unparseable planner handle was accepted")
	}
	if rec.Code != http.StatusBadRequest {
		t.Errorf("code = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

// A nil *eipmongo.Mongo satisfies the interface while holding nothing to read
// from, and must answer as missing rather than be dereferenced.
func TestRequestPlannerOwnerTreatsANilMongoAsMissing(t *testing.T) {
	t.Parallel()
	rec := httptest.NewRecorder()
	var mongo *eipmongo.Mongo

	if _, ok := RequestPlannerOwner(rec, ownerRequest(t, "acct-1", "corporation:98000001"),
		mongo, keys.EntityCipher(t), trackerFor(t), "job_documents"); ok {
		t.Fatal("a nil mongo handle was treated as a membership reader")
	}
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("code = %d, want %d", rec.Code, http.StatusServiceUnavailable)
	}
}
