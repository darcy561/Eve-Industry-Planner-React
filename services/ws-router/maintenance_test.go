package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"eve-industry-planner/shared/appconfig"
	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/shared/orchestrationprobes"
	"eve-industry-planner/testing/natsfake"
	"eve-industry-planner/testing/wait"
)

// routerWithMaintenance builds a router whose only working part is the gate:
// a refused upgrade must not need a backend, and an allowed one fails later.
func routerWithMaintenance(t *testing.T, watcher *appconfig.MaintenanceWatcher) *Router {
	t.Helper()
	return &Router{
		cfg:         config{},
		be:          newBackendRegistry(config{}),
		place:       newPlacementStore(),
		maintenance: watcher,
	}
}

// startedWatcher returns a watcher told the flag is enabled the way a router
// learns it in production: from whoever holds the flag.
func startedWatcher(t *testing.T, enabled bool) *appconfig.MaintenanceWatcher {
	t.Helper()
	fake := natsfake.New(t)
	stopAsk, err := eipnats.SubscribeMaintenanceAsk(fake.NATS, func() bool { return enabled })
	if err != nil {
		t.Fatalf("subscribe ask: %v", err)
	}
	t.Cleanup(stopAsk)

	watcher := appconfig.NewMaintenanceWatcher(fake.NATS)
	stop, err := watcher.Start(context.Background())
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	t.Cleanup(stop)
	return watcher
}

func serveWS(t *testing.T, r *Router, path string) *httptest.ResponseRecorder {
	t.Helper()
	rec := httptest.NewRecorder()
	r.handleProxy(rec, httptest.NewRequest(http.MethodGet, path, nil))
	return rec
}

// The router refuses the upgrade itself rather than placing the client on a
// backend that would refuse it a moment later.
func TestUpgradeRefusedDuringMaintenance(t *testing.T) {
	r := routerWithMaintenance(t, startedWatcher(t, true))

	rec := serveWS(t, r, "/ws")
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
	if r.refusedMaint.Load() != 1 {
		t.Errorf("refused counter = %d, want 1", r.refusedMaint.Load())
	}
}

// A refused upgrade is still an upgrade attempt: an operator watching a window
// needs to see clients arriving, not a router that looks idle.
func TestRefusedUpgradeIsStillCountedAsAnAttempt(t *testing.T) {
	r := routerWithMaintenance(t, startedWatcher(t, true))

	serveWS(t, r, "/ws")
	serveWS(t, r, "/ws")

	if got := r.upgrades.Load(); got != 2 {
		t.Errorf("upgrades = %d, want 2", got)
	}
	if got := r.snapshot().RefusedMaintenance; got != 2 {
		t.Errorf("snapshot RefusedMaintenance = %d, want 2", got)
	}
}

// Without a window the gate must not stand in the way; this request gets past it
// and fails on having no backend, which is the next step.
func TestUpgradeReachesPlacementWithoutMaintenance(t *testing.T) {
	r := routerWithMaintenance(t, startedWatcher(t, false))

	rec := serveWS(t, r, "/ws")
	if rec.Code == http.StatusServiceUnavailable {
		t.Fatal("the gate refused an upgrade with maintenance off")
	}
	if r.refusedMaint.Load() != 0 {
		t.Errorf("refused counter = %d, want 0", r.refusedMaint.Load())
	}
}

// A router with no watcher wired must serve rather than refuse everything.
func TestUpgradeAllowedWhenNoWatcherIsWired(t *testing.T) {
	r := routerWithMaintenance(t, nil)

	if rec := serveWS(t, r, "/ws"); rec.Code == http.StatusServiceUnavailable {
		t.Fatal("a nil watcher refused an upgrade")
	}
}

// Anything off the /ws prefix is still a 404, not a maintenance refusal: the
// gate must not turn the router into a catch-all during a window.
func TestNonWSPathsAreStillNotFoundDuringMaintenance(t *testing.T) {
	r := routerWithMaintenance(t, startedWatcher(t, true))

	if rec := serveWS(t, r, "/healthz"); rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
}

// The probe handlers are a separate mux on a separate port and never consult the
// flag, so a window cannot make Swarm restart the task or Traefik pull it from
// the loadbalancer.
func TestProbeHandlersIgnoreMaintenance(t *testing.T) {
	routerReady := func(context.Context) error { return nil }
	for name, handler := range map[string]http.HandlerFunc{
		"/healthy": orchestrationprobes.HealthyHandler,
		"/health":  orchestrationprobes.HealthyHandler,
		"/ready":   orchestrationprobes.ReadyHandler(routerReady),
	} {
		rec := httptest.NewRecorder()
		handler(rec, httptest.NewRequest(http.MethodGet, name, nil))
		if rec.Code != http.StatusOK {
			t.Errorf("%s = %d during maintenance, want 200", name, rec.Code)
		}
	}
}

// The router carries no Redis client: it takes the state from the broadcast.
func TestLiveRouterAdoptsMaintenanceFromTheBroadcast(t *testing.T) {
	fake := natsfake.New(t)

	watcher := appconfig.NewMaintenanceWatcher(fake.NATS)
	stop, err := watcher.Start(context.Background())
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	defer stop()

	r := routerWithMaintenance(t, watcher)
	if rec := serveWS(t, r, "/ws"); rec.Code == http.StatusServiceUnavailable {
		t.Fatal("refused before any announce")
	}

	if err := eipnats.PublishMaintenanceState(fake.NATS, true); err != nil {
		t.Fatalf("publish: %v", err)
	}
	wait.For(t, 2*time.Second, func() (bool, string) {
		return serveWS(t, r, "/ws").Code == http.StatusServiceUnavailable, "waiting for the announce"
	})

	if err := eipnats.PublishMaintenanceState(fake.NATS, false); err != nil {
		t.Fatalf("clear: %v", err)
	}
	wait.For(t, 2*time.Second, func() (bool, string) {
		return serveWS(t, r, "/ws").Code != http.StatusServiceUnavailable, "waiting for the clear"
	})
}

// A router that started or reconnected mid-window missed the announce, so it
// asks whoever holds the flag.
func TestLiveRouterAdoptsMaintenanceFromTheStartupRequest(t *testing.T) {
	r := routerWithMaintenance(t, startedWatcher(t, true))
	if rec := serveWS(t, r, "/ws"); rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503: a router starting mid-window asks for the state", rec.Code)
	}
}
