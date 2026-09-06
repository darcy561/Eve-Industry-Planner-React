package esiclient_test

import (
	"testing"
	"time"

	"eve-industry-planner/testing/redisfake"
	"eve-industry-planner/testing/redislive"

	"github.com/redis/go-redis/v9"
)

// The store suite runs against miniredis by default and against a real Redis
// when the gate is set. miniredis stays the fast inner loop; the real server is
// what settles questions a reimplementation can only answer approximately -
// TIME, script atomicity, and hash-field expiry, which miniredis implements
// differently enough that the shipped script is written around it.
//
// Both are driven through this one handle so the suite is the same suite either
// way, rather than a second set of tests that drifts from the first.

// backend is a Redis a test can drive. Time travel is the one thing only the
// fake can do: a real server's clock is the wall clock, so a test that needs to
// skip a window is fake-only and says so.
type backend struct {
	Client *redis.Client

	fake *redisfake.Redis
}

// live reports whether this is a real Redis rather than the fake.
func (b backend) live() bool { return b.fake == nil }

// FastForward ages TTLs. Only the fake can do it; on a real server the test is
// skipped, because the alternative is sleeping for a window.
func (b backend) FastForward(t *testing.T, d time.Duration) {
	t.Helper()
	if b.fake == nil {
		t.Skipf("needs to skip %v of TTL, which only the fake can do", d)
	}
	b.fake.Server.FastForward(d)
}

// Exists reports whether a key is present.
func (b backend) Exists(t *testing.T, key string) bool {
	t.Helper()
	if b.fake != nil {
		return b.fake.Server.Exists(key)
	}
	n, err := b.Client.Exists(t.Context(), key).Result()
	if err != nil {
		t.Fatalf("exists %s: %v", key, err)
	}
	return n > 0
}

// newBackend is the fake unless the live gate is set, in which case it is a
// throwaway Redis cleaned before and after the test.
func newBackend(t *testing.T) backend {
	t.Helper()
	if !redislive.Enabled() {
		fake := redisfake.New(t)
		return backend{Client: fake.Client, fake: fake}
	}

	client := redislive.Require(t)
	// Every test gets the keyspace to itself: these run in one process against
	// one server, and a bucket left behind would be another test's starting
	// state.
	redislive.Clean(t, client, "esi:")
	t.Cleanup(func() { redislive.Clean(t, client, "esi:") })
	return backend{Client: client}
}
