package cli

import (
	"context"
	"sync/atomic"
	"testing"
	"time"

	"eve-industry-planner/shared/appconfig"
	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/testing/natsfake"
	"eve-industry-planner/testing/redisfake"
	"eve-industry-planner/testing/wait"
)

// The other tests use a fake announcer, which proves applyMaintenance calls one
// but not that the command publishes on the subject services listen to. This
// runs the real announcer against a real subscriber.
func TestLiveToggleAnnouncesOnTheSubjectServicesFollow(t *testing.T) {
	fake := natsfake.New(t)
	r := redisfake.New(t)
	ctx := context.Background()

	var got atomic.Bool
	var count atomic.Int32
	stop, err := eipnats.SubscribeMaintenanceState(fake.NATS, func(state eipnats.MaintenanceState) {
		got.Store(state.Enabled)
		count.Add(1)
	})
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer stop()

	flag := appconfig.NewMaintenanceFlag(r.Client)
	announce := natsAnnouncer(fake.NATS)

	if _, err := applyMaintenance(ctx, flag, announce, maintenanceRequest{changing: true, enable: true}); err != nil {
		t.Fatalf("turn on: %v", err)
	}
	wait.For(t, 2*time.Second, func() (bool, string) {
		return count.Load() == 1, "waiting for the announce"
	})
	if !got.Load() {
		t.Error("subscribers were told enabled=false when the operator turned it on")
	}

	if _, err := applyMaintenance(ctx, flag, announce, maintenanceRequest{changing: true, enable: false}); err != nil {
		t.Fatalf("turn off: %v", err)
	}
	wait.For(t, 2*time.Second, func() (bool, string) {
		return count.Load() == 2, "waiting for the clear"
	})
	if got.Load() {
		t.Error("subscribers were told enabled=true when the operator turned it off")
	}
}

// A report must not announce on the real subject either.
func TestLiveReportAnnouncesNothing(t *testing.T) {
	fake := natsfake.New(t)
	r := redisfake.New(t)

	var count atomic.Int32
	stop, err := eipnats.SubscribeMaintenanceState(fake.NATS, func(eipnats.MaintenanceState) {
		count.Add(1)
	})
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer stop()

	if _, err := applyMaintenance(context.Background(), appconfig.NewMaintenanceFlag(r.Client),
		natsAnnouncer(fake.NATS), maintenanceRequest{}); err != nil {
		t.Fatalf("report: %v", err)
	}

	time.Sleep(200 * time.Millisecond)
	if count.Load() != 0 {
		t.Errorf("a report published %d announces, want 0", count.Load())
	}
}
