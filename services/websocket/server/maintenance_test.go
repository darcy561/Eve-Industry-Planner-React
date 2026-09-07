package server

import (
	"context"
	"net/http"
	"strings"
	"testing"
	"time"

	"eve-industry-planner/shared/appconfig"
)

// enterMaintenance turns the flag on for the fixture's server.
func enterMaintenance(t *testing.T, f *integFixture) {
	t.Helper()
	if f.Server.maintenance == nil {
		f.Server.maintenance = appconfig.NewMaintenanceFlag(f.Redis)
	}
	if err := f.Server.maintenance.Set(context.Background(), true); err != nil {
		t.Fatalf("enter maintenance: %v", err)
	}
}

func leaveMaintenance(t *testing.T, f *integFixture) {
	t.Helper()
	if err := f.Server.maintenance.Set(context.Background(), false); err != nil {
		t.Fatalf("leave maintenance: %v", err)
	}
}

// An upgrade during a window is refused through the existing block path, so it
// inherits the reject metrics and log fields rather than growing a second shape.
func TestUpgradeRefusedDuringMaintenance(t *testing.T) {
	f := newIntegFixture(t)
	f.seedSession("acct-maint", "sess-maint-1")
	enterMaintenance(t, f)

	status, _ := f.dialRefuse("sess-maint-1")
	if status != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", status)
	}
	if got := f.Server.upgradeBlockReason(context.Background(), true); got != "maintenance" {
		t.Errorf("block reason = %q, want maintenance", got)
	}
}

// Maintenance is checked before draining, so a container in a window reports the
// reason a client can act on.
func TestMaintenanceReasonWinsOverCutoff(t *testing.T) {
	f := newIntegFixture(t)
	enterMaintenance(t, f)
	f.setPlacementLimits(1, 1)

	if got := f.Server.upgradeBlockReason(context.Background(), true); got != "maintenance" {
		t.Fatalf("block reason = %q, want maintenance", got)
	}
}

// The window starting tells every connected client, then closes it.
func TestMaintenanceClosesLiveSessions(t *testing.T) {
	f := newIntegFixture(t)
	f.seedSession("acct-live", "sess-live-maint")
	conn := f.dial("sess-live-maint")
	_ = f.readJSONMessage(conn, 2*time.Second) // connected
	f.waitClients(1, 2*time.Second)

	enterMaintenance(t, f)
	f.Server.applyMaintenanceState(context.Background(), true)

	msg := f.readJSONOfType(conn, "maintenance", 3*time.Second)
	if got, _ := msg["enabled"].(bool); !got {
		t.Fatalf("enabled = %v, want true: %v", msg["enabled"], msg)
	}
	if text, _ := msg["message"].(string); text == "" || strings.Contains(text, "eligible instance") {
		t.Errorf("message = %q: must say maintenance, not promise another instance", text)
	}

	_ = conn.SetReadDeadline(time.Now().Add(3 * time.Second))
	if _, _, err := conn.ReadMessage(); err == nil {
		t.Fatal("the socket stayed open after a maintenance close")
	}
	f.waitClients(0, 2*time.Second)
}

// The container is not going away: it must stay ready through a window so Swarm
// does not restart it and the router does not pull it.
func TestContainerStaysReadyDuringMaintenance(t *testing.T) {
	f := newIntegFixture(t)
	enterMaintenance(t, f)
	f.Server.applyMaintenanceState(context.Background(), true)

	if err := f.readyCheck(context.Background()); err != nil {
		t.Fatalf("ready check failed during maintenance: %v", err)
	}
	if f.Server.IsDraining() {
		t.Error("the server marked itself draining for a maintenance window")
	}
	if f.Server.IsCordoned() {
		t.Error("the server cordoned itself for a maintenance window")
	}
}

// Clearing the flag lets a new upgrade through without a restart, which is the
// point of not running the drain path.
func TestUpgradeAllowedAgainAfterMaintenanceClears(t *testing.T) {
	f := newIntegFixture(t)
	f.seedSession("acct-after", "sess-after-1")
	enterMaintenance(t, f)

	if status, _ := f.dialRefuse("sess-after-1"); status != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503 during the window", status)
	}

	leaveMaintenance(t, f)
	f.Server.applyMaintenanceState(context.Background(), false)

	conn := f.dial("sess-after-1")
	defer func() { _ = conn.Close() }()
	_ = f.readJSONMessage(conn, 2*time.Second)
	f.waitClients(1, 2*time.Second)
}

// A server with no flag wired serves normally rather than refusing everything.
func TestUpgradeAllowedWhenNoFlagIsWired(t *testing.T) {
	f := newIntegFixture(t)
	f.Server.maintenance = nil

	if got := f.Server.upgradeBlockReason(context.Background(), true); got == "maintenance" {
		t.Fatal("a server with no flag reported maintenance")
	}
}
