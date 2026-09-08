package v1endpoints

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"eve-industry-planner/api/apideps"
	"eve-industry-planner/shared/appconfig"
	"eve-industry-planner/testing/redisfake"

	eipredis "eve-industry-planner/shared/redis"
)

func appConfigBody(t *testing.T, h *Handlers) AppConfigResponse {
	t.Helper()
	rec := httptest.NewRecorder()
	h.AppConfigHandler(rec, httptest.NewRequest(http.MethodGet, "/api/v1/app-config", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	var got AppConfigResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("body: %v", err)
	}
	return got
}

// The banner follows the live flag, so turning maintenance on reaches the SPA
// without an API redeploy.
func TestAppConfigReportsTheRuntimeFlag(t *testing.T) {
	r := redisfake.New(t)
	ctx := context.Background()

	flag := appconfig.NewMaintenanceFlag(eipredis.NewRedis(r.Client))
	h := New(&apideps.Deps{Maintenance: flag})

	if appConfigBody(t, h).MaintenanceMode {
		t.Fatal("maintenance_mode = true before anything was set")
	}

	if err := flag.Set(ctx, true); err != nil {
		t.Fatalf("set: %v", err)
	}
	if !appConfigBody(t, h).MaintenanceMode {
		t.Fatal("maintenance_mode = false after the flag was set, want true without a restart")
	}

	if err := flag.Set(ctx, false); err != nil {
		t.Fatalf("clear: %v", err)
	}
	if appConfigBody(t, h).MaintenanceMode {
		t.Fatal("maintenance_mode = true after the flag was cleared")
	}
}

// Mongo-only wiring carries no flag, and must report off rather than panic.
func TestAppConfigWithoutAFlagReportsOff(t *testing.T) {
	if appConfigBody(t, New(&apideps.Deps{})).MaintenanceMode {
		t.Fatal("maintenance_mode = true with no flag wired, want false")
	}
}

// The ETag must follow the flag, or a client holding the previous one would be
// told the config had not changed for the whole window.
func TestAppConfigETagChangesWithTheFlag(t *testing.T) {
	r := redisfake.New(t)
	flag := appconfig.NewMaintenanceFlag(eipredis.NewRedis(r.Client))
	h := New(&apideps.Deps{Maintenance: flag})

	rec := httptest.NewRecorder()
	h.AppConfigHandler(rec, httptest.NewRequest(http.MethodGet, "/api/v1/app-config", nil))
	before := rec.Header().Get("ETag")
	if before == "" {
		t.Fatal("no ETag on the first response")
	}

	if err := flag.Set(context.Background(), true); err != nil {
		t.Fatalf("set: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/app-config", nil)
	req.Header.Set("If-None-Match", before)
	rec = httptest.NewRecorder()
	h.AppConfigHandler(rec, req)

	if rec.Code == http.StatusNotModified {
		t.Fatal("304 after the flag changed: a parked client would never see the window end")
	}
	if after := rec.Header().Get("ETag"); after == before {
		t.Errorf("ETag %q unchanged after the flag changed", after)
	}
}
