package appconfig_test

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"eve-industry-planner/shared/appconfig"
	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/testing/natsfake"
	"eve-industry-planner/testing/redisfake"
	"eve-industry-planner/testing/wait"
)

// The watcher is what a service with NATS but no Redis client holds.
func TestLiveWatcherAdoptsCurrentValueOnStart(t *testing.T) {
	fake := natsfake.New(t)

	holder := atomic.Bool{}
	holder.Store(true)
	stopAsk, err := eipnats.SubscribeMaintenanceAsk(fake.NATS, holder.Load)
	if err != nil {
		t.Fatalf("subscribe ask: %v", err)
	}
	defer stopAsk()

	watcher := appconfig.NewMaintenanceWatcher(fake.NATS)
	stop, err := watcher.Start(context.Background())
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	defer stop()

	if !watcher.Enabled() {
		t.Fatal("Enabled = false, want true: a starting watcher asks for the current value")
	}
}

func TestLiveWatcherFollowsTheBroadcast(t *testing.T) {
	fake := natsfake.New(t)

	holder := atomic.Bool{}
	stopAsk, err := eipnats.SubscribeMaintenanceAsk(fake.NATS, holder.Load)
	if err != nil {
		t.Fatalf("subscribe ask: %v", err)
	}
	defer stopAsk()

	watcher := appconfig.NewMaintenanceWatcher(fake.NATS)
	stop, err := watcher.Start(context.Background())
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	defer stop()

	if watcher.Enabled() {
		t.Fatal("Enabled = true before any change, want false")
	}

	if err := eipnats.PublishMaintenanceState(fake.NATS, true); err != nil {
		t.Fatalf("publish: %v", err)
	}
	wait.For(t, 2*time.Second, func() (bool, string) {
		return watcher.Enabled(), "waiting for the announce to arrive"
	})

	if err := eipnats.PublishMaintenanceState(fake.NATS, false); err != nil {
		t.Fatalf("publish off: %v", err)
	}
	wait.For(t, 2*time.Second, func() (bool, string) {
		return !watcher.Enabled(), "waiting for the clear"
	})
}

// A request that goes unanswered leaves what the watcher already holds; it must
// not drop to off and take the router out of a window.
func TestLiveWatcherHoldsValueWhenTheAskFails(t *testing.T) {
	fake := natsfake.New(t)

	stopAsk, err := eipnats.SubscribeMaintenanceAsk(fake.NATS, func() bool { return true })
	if err != nil {
		t.Fatalf("subscribe ask: %v", err)
	}

	watcher := appconfig.NewMaintenanceWatcher(fake.NATS)
	stop, err := watcher.Start(context.Background())
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	defer stop()
	if !watcher.Enabled() {
		t.Fatal("Enabled = false after an answered start, want true")
	}

	stopAsk()
	conn := fake.NATS.Conn()
	conn.Opts.ReconnectedCB(conn)
	time.Sleep(300 * time.Millisecond)

	if !watcher.Enabled() {
		t.Fatal("Enabled = false after an unanswered re-ask, want the held value")
	}
}

// A reconnect re-asks: announces made while the link was down are never
// replayed, so without this a router would hold a stale flag indefinitely.
func TestLiveWatcherReAsksOnReconnect(t *testing.T) {
	fake := natsfake.New(t)

	holder := atomic.Bool{}
	stopAsk, err := eipnats.SubscribeMaintenanceAsk(fake.NATS, holder.Load)
	if err != nil {
		t.Fatalf("subscribe ask: %v", err)
	}
	defer stopAsk()

	watcher := appconfig.NewMaintenanceWatcher(fake.NATS)
	stop, err := watcher.Start(context.Background())
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	defer stop()

	if watcher.Enabled() {
		t.Fatal("Enabled = true at start, want false")
	}

	// The value changes while this watcher is not hearing announces.
	holder.Store(true)
	if watcher.Enabled() {
		t.Fatal("Enabled = true without an announce or a reconnect, want false")
	}

	conn := fake.NATS.Conn()
	conn.Opts.ReconnectedCB(conn)

	wait.For(t, 2*time.Second, func() (bool, string) {
		return watcher.Enabled(), "waiting for the reconnect re-ask"
	})
}

func TestLiveWatcherWithoutNATSIsInert(t *testing.T) {
	watcher := appconfig.NewMaintenanceWatcher(nil)

	stop, err := watcher.Start(context.Background())
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	defer stop()

	if watcher.Enabled() {
		t.Fatal("Enabled = true with no NATS handle, want off")
	}
}

// Readers and announces run together on a router.
func TestLiveWatcherConcurrentReadsAndAnnounces(t *testing.T) {
	fake := natsfake.New(t)

	holder := atomic.Bool{}
	stopAsk, err := eipnats.SubscribeMaintenanceAsk(fake.NATS, holder.Load)
	if err != nil {
		t.Fatalf("subscribe ask: %v", err)
	}
	defer stopAsk()

	watcher := appconfig.NewMaintenanceWatcher(fake.NATS)
	stop, err := watcher.Start(context.Background())
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	defer stop()

	var wg sync.WaitGroup
	for range 8 {
		wg.Go(func() {
			for range 50 {
				watcher.Enabled()
			}
		})
	}
	for i := range 20 {
		if err := eipnats.PublishMaintenanceState(fake.NATS, i%2 == 0); err != nil {
			t.Errorf("publish: %v", err)
			break
		}
	}
	wg.Wait()
}

// A holder that is up but slow must not hold the service offline: Start bounds
// its ask and carries on with the seed.
func TestLiveWatcherStartIsNotHeldUpByASlowHolder(t *testing.T) {
	fake := natsfake.New(t)

	release := make(chan struct{})
	stopAsk, err := eipnats.SubscribeMaintenanceAsk(fake.NATS, func() bool {
		<-release
		return false
	})
	if err != nil {
		t.Fatalf("subscribe ask: %v", err)
	}
	defer stopAsk()
	defer close(release)

	watcher := appconfig.NewMaintenanceWatcher(fake.NATS)
	start := time.Now()
	stop, err := watcher.Start(context.Background())
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	defer stop()

	if elapsed := time.Since(start); elapsed > 4*time.Second {
		t.Errorf("Start took %s, want a bounded wait", elapsed)
	}
	if watcher.Enabled() {
		t.Error("Enabled = true while the ask went unanswered, want off")
	}
}

// The reconnect ask runs off the connection's callback goroutine, which is
// serialized: blocking it would stall every other callback on the handle.
func TestLiveWatcherReconnectAskDoesNotBlockTheDispatcher(t *testing.T) {
	fake := natsfake.New(t)

	release := make(chan struct{})
	stopAsk, err := eipnats.SubscribeMaintenanceAsk(fake.NATS, func() bool {
		<-release
		return true
	})
	if err != nil {
		t.Fatalf("subscribe ask: %v", err)
	}
	defer stopAsk()
	defer close(release)

	watcher := appconfig.NewMaintenanceWatcher(fake.NATS)
	stop, err := watcher.Start(context.Background())
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	defer stop()

	conn := fake.NATS.Conn()
	done := make(chan struct{})
	go func() {
		conn.Opts.ReconnectedCB(conn)
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("the reconnect callback was still blocked on the ask")
	}
}

// The responder is what makes the watcher's ask work in production: without a
// holder answering, every ask times out and a router never learns the state.
func TestLiveServeMaintenanceStateAnswersAWatcher(t *testing.T) {
	fake := natsfake.New(t)
	r := redisfake.New(t)
	ctx := context.Background()

	flag := appconfig.NewMaintenanceFlag(r.Client)
	if err := flag.Set(ctx, true); err != nil {
		t.Fatalf("set: %v", err)
	}
	stopServe, err := appconfig.ServeMaintenanceState(ctx, fake.NATS, flag)
	if err != nil {
		t.Fatalf("serve: %v", err)
	}
	defer stopServe()

	watcher := appconfig.NewMaintenanceWatcher(fake.NATS)
	stop, err := watcher.Start(ctx)
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	defer stop()

	if !watcher.Enabled() {
		t.Fatal("the watcher read false, want true from the responder")
	}
}

func TestLiveServeMaintenanceStateIsInertWithoutItsInputs(t *testing.T) {
	fake := natsfake.New(t)

	stop, err := appconfig.ServeMaintenanceState(context.Background(), nil, nil)
	if err != nil {
		t.Fatalf("nil inputs: %v", err)
	}
	stop()

	stop, err = appconfig.ServeMaintenanceState(context.Background(), fake.NATS, nil)
	if err != nil {
		t.Fatalf("nil flag: %v", err)
	}
	stop()
}

// The responder's reads are bounded by the context it was given, so shutdown
// does not leave a reply handler blocked on Redis.
func TestLiveServeMaintenanceStateStillAnswersAfterItsContextEnds(t *testing.T) {
	fake := natsfake.New(t)
	r := redisfake.New(t)

	ctx, cancel := context.WithCancel(context.Background())
	flag := appconfig.NewMaintenanceFlag(r.Client)
	if err := flag.Set(ctx, true); err != nil {
		t.Fatalf("set: %v", err)
	}

	stopServe, err := appconfig.ServeMaintenanceState(ctx, fake.NATS, flag)
	if err != nil {
		t.Fatalf("serve: %v", err)
	}
	defer stopServe()

	cancel()

	// A cancelled read holds the last known value rather than hanging or failing
	// the reply, so an asker still gets an answer.
	state, err := eipnats.AskMaintenanceState(context.Background(), fake.NATS, 2*time.Second)
	if err != nil {
		t.Fatalf("ask after cancel: %v", err)
	}
	if !state.Enabled {
		t.Error("the reply lost the flag once its context was cancelled")
	}
}
