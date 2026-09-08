package esiclient_test

import (
	"context"
	"fmt"
	"sync/atomic"
	"testing"
	"time"

	"eve-industry-planner/shared/esiclient"
	"eve-industry-planner/testing/redisfake"

	"github.com/redis/go-redis/v9"

	eipredis "eve-industry-planner/shared/redis"
)

// roundTripHook counts trips to Redis rather than commands: a pipeline of many commands is one
// trip, which is the difference States exists to make.
type roundTripHook struct{ trips atomic.Int64 }

func (h *roundTripHook) DialHook(next redis.DialHook) redis.DialHook { return next }

func (h *roundTripHook) ProcessHook(next redis.ProcessHook) redis.ProcessHook {
	return func(ctx context.Context, cmd redis.Cmder) error {
		h.trips.Add(1)
		return next(ctx, cmd)
	}
}

func (h *roundTripHook) ProcessPipelineHook(next redis.ProcessPipelineHook) redis.ProcessPipelineHook {
	return func(ctx context.Context, cmds []redis.Cmder) error {
		h.trips.Add(1)
		return next(ctx, cmds)
	}
}

// Reporting callers read every bucket on a timer, so the cost has to stay flat as buckets are
// added rather than growing two commands at a time.
func TestStatesCostDoesNotGrowWithBucketCount(t *testing.T) {
	trips := func(n int) int64 {
		rdb := redisfake.New(t)
		store := esiclient.NewStore(eipredis.NewRedis(rdb.Client), esiclient.DefaultConfig())

		buckets := make([]esiclient.Bucket, 0, n)
		for i := range n {
			buckets = append(buckets, esiclient.Bucket{Group: fmt.Sprintf("g%d", i), User: "u"})
		}

		hook := &roundTripHook{}
		rdb.Client.AddHook(hook)

		states, err := store.States(t.Context(), buckets)
		if err != nil {
			t.Fatalf("States(%d): %v", n, err)
		}
		if len(states) != n {
			t.Fatalf("got %d states, want %d", len(states), n)
		}
		return hook.trips.Load()
	}

	few, many := trips(2), trips(40)
	if many > few {
		t.Fatalf("40 buckets cost %d round trips against %d for 2: cost grows with bucket count", many, few)
	}
}

func TestStatesWithNoBucketsTalksToNobody(t *testing.T) {
	rdb := redisfake.New(t)
	store := esiclient.NewStore(eipredis.NewRedis(rdb.Client), esiclient.DefaultConfig())

	hook := &roundTripHook{}
	rdb.Client.AddHook(hook)

	states, err := store.States(t.Context(), nil)
	if err != nil {
		t.Fatalf("States: %v", err)
	}
	if len(states) != 0 {
		t.Fatalf("got %d states, want 0", len(states))
	}
	if got := hook.trips.Load(); got != 0 {
		t.Fatalf("made %d round trips for no buckets, want 0", got)
	}
}

// The batch read walks the ledger itself rather than going through [Store.State], so it can drift
// from the single-bucket path and report a spend nothing has charged.
func TestStatesReportsTheSameSpendAsState(t *testing.T) {
	store, _ := newStore(t)
	bucket := esiclient.Bucket{Group: "market-order", User: esiclient.AnonymousUser}
	known(t, store, bucket, 100, time.Minute)

	for range 3 {
		grant, err := store.Reserve(t.Context(), bucket, esiclient.ClassBackground, marketPolicy, 1)
		if err != nil {
			t.Fatalf("reserve: %v", err)
		}
		if !grant.Granted {
			t.Fatalf("not granted: %+v", grant)
		}
		err = store.Settle(t.Context(), grant.Reservations[0], esiclient.Outcome{
			Status:     200,
			Cost:       2,
			ObservedAt: time.Now(),
			Limit:      100,
			Window:     time.Minute,
			Remaining:  90,
			Metered:    true,
		})
		if err != nil {
			t.Fatalf("settle: %v", err)
		}
	}

	one, err := store.State(t.Context(), bucket)
	if err != nil {
		t.Fatalf("State: %v", err)
	}
	if one.Spent == 0 {
		t.Fatalf("nothing charged, the test proves nothing: %+v", one)
	}

	many, err := store.States(t.Context(), []esiclient.Bucket{bucket})
	if err != nil {
		t.Fatalf("States: %v", err)
	}
	batch, ok := many[bucket]
	if !ok {
		t.Fatalf("bucket missing from batch read: %+v", many)
	}
	if batch.Spent != one.Spent {
		t.Fatalf("States spent %d, State spent %d", batch.Spent, one.Spent)
	}
	if batch.Unaccounted != one.Unaccounted {
		t.Fatalf("States unaccounted %d, State unaccounted %d", batch.Unaccounted, one.Unaccounted)
	}
}
