package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// fakeMaintenanceFlag is the gate's only dependency, so the middleware can be
// exercised without Redis.
type fakeMaintenanceFlag struct {
	enabled bool
	reads   int
}

func (f *fakeMaintenanceFlag) Enabled(context.Context) bool {
	f.reads++
	return f.enabled
}

func servePath(t *testing.T, flag MaintenanceFlag, path string) (*httptest.ResponseRecorder, bool) {
	t.Helper()
	reached := false
	handler := MaintenanceModeConstructor(flag)(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		reached = true
	}))
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
	return rec, reached
}

func TestMaintenanceOffPassesEverythingThrough(t *testing.T) {
	t.Parallel()

	rec, reached := servePath(t, &fakeMaintenanceFlag{enabled: false}, "/api/v1/planners")
	if !reached {
		t.Fatal("the handler did not run with maintenance off")
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", rec.Code)
	}
}

func TestMaintenanceOnBlocksWithTheMaintenanceBody(t *testing.T) {
	t.Parallel()

	rec, reached := servePath(t, &fakeMaintenanceFlag{enabled: true}, "/api/v1/planners")
	if reached {
		t.Fatal("the handler ran during maintenance")
	}
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("content-type = %q", got)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("body: %v", err)
	}
	if body["error"] != "maintenance_mode" || body["maintenance_mode"] != true {
		t.Errorf("body = %v", body)
	}
}

// The probes keep the edge and Swarm from pulling the task, and app-config is
// where the SPA reads the banner and its recovery poll. Gating any of them would
// make the window worse than the outage it protects.
func TestMaintenanceOnStillAnswersTheBypassPaths(t *testing.T) {
	t.Parallel()

	for path := range maintenanceBypassPaths {
		t.Run(path, func(t *testing.T) {
			t.Parallel()
			rec, reached := servePath(t, &fakeMaintenanceFlag{enabled: true}, path)
			if !reached {
				t.Fatalf("%s was blocked during maintenance", path)
			}
			if rec.Code != http.StatusOK {
				t.Errorf("%s status = %d, want 200", path, rec.Code)
			}
		})
	}
}

func TestMaintenanceBypassIsExactPathNotPrefix(t *testing.T) {
	t.Parallel()

	// A path that merely starts with a bypassed one must still be gated.
	rec, reached := servePath(t, &fakeMaintenanceFlag{enabled: true}, "/api/v1/app-config/secrets")
	if reached {
		t.Fatal("a path under a bypassed prefix was let through")
	}
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, want 503", rec.Code)
	}
}

// The gate reads per request rather than caching the value at construction, so
// clearing maintenance takes effect without restarting the API.
func TestMaintenanceIsReadPerRequest(t *testing.T) {
	t.Parallel()

	flag := &fakeMaintenanceFlag{enabled: true}
	handler := MaintenanceModeConstructor(flag)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/planners", nil))
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("first request status = %d, want 503", rec.Code)
	}

	flag.enabled = false
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/planners", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status after clearing = %d, want 200 without a restart", rec.Code)
	}
	if flag.reads != 2 {
		t.Errorf("flag read %d times for 2 requests", flag.reads)
	}
}

// Mongo-only wiring carries no flag; the API must serve rather than block
// everything.
func TestMaintenanceNilFlagBlocksNothing(t *testing.T) {
	t.Parallel()

	_, reached := servePath(t, nil, "/api/v1/planners")
	if !reached {
		t.Fatal("a nil flag blocked the request")
	}
}
