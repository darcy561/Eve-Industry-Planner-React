package appconfig

import (
	"context"
	"sync"
	"testing"

	"eve-industry-planner/testing/redisfake"
)

// The flag lives in Redis, not the process: a fresh flag reads what was set.
func TestMaintenanceFlagReadsWhatRedisHolds(t *testing.T) {
	r := redisfake.New(t)
	ctx := context.Background()
	flag := NewMaintenanceFlag(r.Client)

	if flag.Enabled(ctx) {
		t.Fatal("Enabled = true before anything was set")
	}
	if err := flag.Set(ctx, true); err != nil {
		t.Fatalf("set: %v", err)
	}
	if !NewMaintenanceFlag(r.Client).Enabled(ctx) {
		t.Fatal("Enabled = false from a fresh flag, want true")
	}
	if err := flag.Set(ctx, false); err != nil {
		t.Fatalf("clear: %v", err)
	}
	if NewMaintenanceFlag(r.Client).Enabled(ctx) {
		t.Fatal("Enabled = true after the clear")
	}
}

// No key is an answer, not an outage: a flushed Redis reads as off rather than
// holding a window open with nothing behind it.
func TestMaintenanceFlagNoKeyReadsOff(t *testing.T) {
	r := redisfake.New(t)
	ctx := context.Background()
	flag := NewMaintenanceFlag(r.Client)

	if err := flag.Set(ctx, true); err != nil {
		t.Fatalf("set: %v", err)
	}
	r.Server.FlushAll()

	if flag.Enabled(ctx) {
		t.Fatal("Enabled = true after the key was flushed, want off")
	}
}

func TestMaintenanceFlagHoldsLastKnownOnReadFailure(t *testing.T) {
	r := redisfake.New(t)
	ctx := context.Background()
	flag := NewMaintenanceFlag(r.Client)

	if err := flag.Set(ctx, true); err != nil {
		t.Fatalf("set: %v", err)
	}
	if !flag.Enabled(ctx) {
		t.Fatal("Enabled = false before the outage, want true")
	}

	r.Server.Close()

	if !flag.Enabled(ctx) {
		t.Fatal("Enabled = false during a Redis outage, want true: a read failure must not flap the stack out of maintenance")
	}
}

// A process that has never read anything has nothing to hold; off is the only
// safe answer to an outage before the first read.
func TestMaintenanceFlagReadsOffWithNothingCached(t *testing.T) {
	r := redisfake.New(t)
	r.Server.Close()

	if NewMaintenanceFlag(r.Client).Enabled(context.Background()) {
		t.Fatal("Enabled = true with nothing cached, want off")
	}
}

// A stored value keeps the truthy spelling, so a hand-edited key behaves.
func TestMaintenanceFlagReadsTruthySpellings(t *testing.T) {
	r := redisfake.New(t)
	ctx := context.Background()

	for _, tc := range []struct {
		stored string
		want   bool
	}{
		{"1", true}, {"true", true}, {"YES", true}, {" on ", true},
		{"0", false}, {"false", false}, {"", false}, {"nonsense", false},
	} {
		r.Server.Set(MaintenanceKey, tc.stored)
		if got := NewMaintenanceFlag(r.Client).Enabled(ctx); got != tc.want {
			t.Errorf("stored %q: Enabled = %v, want %v", tc.stored, got, tc.want)
		}
	}
}

func TestMaintenanceFlagWithoutRedisReportsTheMisconfiguration(t *testing.T) {
	flag := NewMaintenanceFlag(nil)
	ctx := context.Background()

	if err := flag.Set(ctx, true); err == nil {
		t.Error("Set succeeded with no client, want an error")
	}
	// Reading still answers, because a caller mid-request must not be blocked
	// by a wiring fault it cannot act on.
	if flag.Enabled(ctx) {
		t.Error("Enabled = true with no client, want off")
	}
}

func TestMaintenanceFlagNilIsInert(t *testing.T) {
	var flag *MaintenanceFlag
	ctx := context.Background()

	if flag.Enabled(ctx) {
		t.Error("nil flag reported enabled")
	}
	if err := flag.Set(ctx, true); err == nil {
		t.Error("nil Set succeeded, want an error")
	}
}

// The flag is read from request goroutines while the operator command writes,
// so reads and writes must be safe together.
func TestMaintenanceFlagConcurrentReadAndWrite(t *testing.T) {
	r := redisfake.New(t)
	ctx := context.Background()
	flag := NewMaintenanceFlag(r.Client)

	var wg sync.WaitGroup
	for range 8 {
		wg.Go(func() {
			for range 50 {
				flag.Enabled(ctx)
			}
		})
	}
	wg.Go(func() {
		for i := range 50 {
			if err := flag.Set(ctx, i%2 == 0); err != nil {
				t.Errorf("set: %v", err)
				return
			}
		}
	})
	wg.Wait()
}
