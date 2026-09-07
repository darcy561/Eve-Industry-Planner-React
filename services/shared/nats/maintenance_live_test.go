package nats_test

import (
	"context"
	"sync/atomic"
	"testing"
	"time"

	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/testing/natsfake"
	"eve-industry-planner/testing/wait"
)

func TestLiveMaintenanceStateReachesSubscribers(t *testing.T) {
	fake := natsfake.New(t)

	var got atomic.Bool
	var delivered atomic.Int32
	stop, err := eipnats.SubscribeMaintenanceState(fake.NATS, func(state eipnats.MaintenanceState) {
		got.Store(state.Enabled)
		delivered.Add(1)
	})
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer stop()

	if err := eipnats.PublishMaintenanceState(fake.NATS, true); err != nil {
		t.Fatalf("publish: %v", err)
	}
	wait.For(t, 2*time.Second, func() (bool, string) {
		return delivered.Load() == 1, "waiting for the announce"
	})
	if !got.Load() {
		t.Fatal("subscriber saw enabled=false, want true")
	}

	if err := eipnats.PublishMaintenanceState(fake.NATS, false); err != nil {
		t.Fatalf("publish off: %v", err)
	}
	wait.For(t, 2*time.Second, func() (bool, string) {
		return delivered.Load() == 2, "waiting for the clear"
	})
	if got.Load() {
		t.Fatal("subscriber saw enabled=true after the clear")
	}
}

func TestLiveMaintenanceAskAnswersCurrentValue(t *testing.T) {
	fake := natsfake.New(t)

	var enabled atomic.Bool
	stop, err := eipnats.SubscribeMaintenanceAsk(fake.NATS, enabled.Load)
	if err != nil {
		t.Fatalf("subscribe ask: %v", err)
	}
	defer stop()

	state, err := eipnats.AskMaintenanceState(context.Background(), fake.NATS, 2*time.Second)
	if err != nil {
		t.Fatalf("ask: %v", err)
	}
	if state.Enabled {
		t.Fatal("ask returned enabled=true, want false")
	}

	enabled.Store(true)
	state, err = eipnats.AskMaintenanceState(context.Background(), fake.NATS, 2*time.Second)
	if err != nil {
		t.Fatalf("ask after set: %v", err)
	}
	if !state.Enabled {
		t.Fatal("ask returned enabled=false after the value changed, want true")
	}
}

// A subscriber that starts after the announce has missed it — core-NATS replays
// nothing — so the ask is what gets it the current value.
func TestLiveMaintenanceAskCatchesUpALateSubscriber(t *testing.T) {
	fake := natsfake.New(t)

	holder := atomic.Bool{}
	holder.Store(true)
	stop, err := eipnats.SubscribeMaintenanceAsk(fake.NATS, holder.Load)
	if err != nil {
		t.Fatalf("subscribe ask: %v", err)
	}
	defer stop()

	if err := eipnats.PublishMaintenanceState(fake.NATS, true); err != nil {
		t.Fatalf("publish: %v", err)
	}

	late, err := eipnats.AskMaintenanceState(context.Background(), fake.NATS, 2*time.Second)
	if err != nil {
		t.Fatalf("late ask: %v", err)
	}
	if !late.Enabled {
		t.Fatal("late subscriber read enabled=false, want true")
	}
}

func TestLiveMaintenanceAskTimesOutWithNoHolder(t *testing.T) {
	fake := natsfake.New(t)

	if _, err := eipnats.AskMaintenanceState(context.Background(), fake.NATS, 200*time.Millisecond); err == nil {
		t.Fatal("ask succeeded with nothing subscribed, want an error")
	}
}
