package cluster

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/redisfake"
)

const testWindow = 15 * time.Second

func cooldowns(t *testing.T, fake *redisfake.Redis) *Cooldowns {
	t.Helper()
	handle := eipredis.NewRedis(fake.Client)
	return NewCooldowns(handle)
}

func TestCooldownRoundTrips(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	c := cooldowns(t, fake)

	at := time.Now().UTC().Truncate(time.Millisecond)
	c.Record(ctx, ServiceWorker, at, testWindow)

	if got := c.State(ctx, ServiceWorker).LastApplyAt; !got.Equal(at) {
		t.Fatalf("last apply = %v, want %v", got, at)
	}
}

// The stamp the code being replaced wrote must still read back, or a restart
// forgets every window and can scale twice in a row.
func TestCooldownReadsWhatTheOldCodeWrote(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)

	at := time.Now().UTC().Truncate(time.Millisecond)
	stored, err := json.Marshal(cooldownBlob{LastApplyAt: at})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if err := fake.Client.Set(ctx, CooldownRedisKey(ServiceWorker), stored, 0).Err(); err != nil {
		t.Fatalf("seed: %v", err)
	}

	if got := cooldowns(t, fake).State(ctx, ServiceWorker).LastApplyAt; !got.Equal(at) {
		t.Fatalf("last apply = %v, want %v", got, at)
	}
}

func TestCooldownWritesTheSameKey(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)

	cooldowns(t, fake).Record(ctx, ServiceWorker, time.Now(), testWindow)

	if !fake.Server.Exists("eip:capacity:cooldown:v1:" + string(ServiceWorker)) {
		t.Fatalf("keys = %v", fake.Server.Keys())
	}
}

func TestCooldownIsPerService(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	c := cooldowns(t, fake)

	at := time.Now().UTC()
	c.Record(ctx, ServiceWorker, at, testWindow)

	if got := c.State(ctx, ServiceWebsocket).LastApplyAt; !got.IsZero() {
		t.Fatalf("an unrelated service reported %v", got)
	}
}

// A missing stamp is "no cooldown", not a failure: it is what every service
// reports before it has ever been scaled.
func TestCooldownAbsentIsZero(t *testing.T) {
	got := cooldowns(t, redisfake.New(t)).State(context.Background(), ServiceWorker)
	if !got.LastApplyAt.IsZero() {
		t.Fatalf("last apply = %v, want zero", got.LastApplyAt)
	}
}

// The controller runs without Redis, and a stamp is hysteresis rather than
// state that must survive — so an unreachable store reports no cooldown instead
// of stopping the loop.
func TestCooldownWithoutAStoreReportsNone(t *testing.T) {
	ctx := context.Background()
	for name, c := range map[string]*Cooldowns{
		"nil store":  nil,
		"nil handle": NewCooldowns(nil),
	} {
		t.Run(name, func(t *testing.T) {
			// Must not panic: the caller takes no error from either.
			c.Record(ctx, ServiceWorker, time.Now(), testWindow)
			if got := c.State(ctx, ServiceWorker); !got.LastApplyAt.IsZero() {
				t.Fatalf("last apply = %v, want zero", got.LastApplyAt)
			}
		})
	}
}

// A stamp is kept for as long as it can still suppress an action. The window is
// operator-configured with no upper bound, so a fixed expiry would silently
// stop honouring a long one.
func TestCooldownLifetimeFollowsTheConfiguredWindow(t *testing.T) {
	for name, tc := range map[string]struct {
		window time.Duration
		want   time.Duration
	}{
		"the shipped default": {15 * time.Second, cooldownTTLFloor},
		"a short window":      {time.Minute, cooldownTTLFloor},
		"a long window":       {48 * time.Hour, 96 * time.Hour},
		"no window":           {0, cooldownTTLFloor},
	} {
		t.Run(name, func(t *testing.T) {
			if got := cooldownTTL(tc.window); got != tc.want {
				t.Errorf("ttl = %v, want %v", got, tc.want)
			}
			if got := cooldownTTL(tc.window); got <= tc.window {
				t.Errorf("ttl %v does not outlive the %v window", got, tc.window)
			}
		})
	}
}

func TestCooldownWriteCarriesTheLifetime(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)

	const window = 48 * time.Hour
	cooldowns(t, fake).Record(ctx, ServiceWorker, time.Now(), window)

	if got := fake.Server.TTL(CooldownRedisKey(ServiceWorker)); got != cooldownTTL(window) {
		t.Fatalf("ttl = %v, want %v", got, cooldownTTL(window))
	}
}
