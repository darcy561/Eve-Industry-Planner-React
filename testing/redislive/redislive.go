// Package redislive gates a test on a real Redis and gives it a namespace to
// work in.
//
// Miniredis runs Lua, but it is a reimplementation: TIME, sorted-set ordering
// and script atomicity are exactly the things a fake is most likely to get
// subtly right and materially different. A script that decides a rate-limit
// budget should meet the real interpreter at least once.
package redislive

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

// Gate is the environment variable that opts a run in to live Redis, and Addr
// overrides where to find it.
const (
	Gate = "EIP_REDIS_PARITY_LIVE"
	Addr = "EIP_REDIS_PARITY_ADDR"
)

const dial = 10 * time.Second

// DefaultAddr is a throwaway server, deliberately not 6379.
//
// The stack publishes its own Redis on 6379, and these tests delete keys under
// the prefix they work in. Defaulting there would point a destructive test at
// the running system's rate-limit budget whenever someone set the gate and
// nothing else, so the default is the throwaway port instead and the stack's
// port has to be typed out to be reached.
const DefaultAddr = "127.0.0.1:6399"

// StackAddr is where the stack publishes Redis. Named so the guard below can
// refuse it rather than leaving the number unexplained.
const StackAddr = "127.0.0.1:6379"

// Enabled reports whether this run is gated in to a real Redis, so a caller can
// choose a backend before deciding to skip.
func Enabled() bool { return os.Getenv(Gate) == "1" }

// Require connects to a throwaway Redis, or skips the test.
//
// Start one with:
//
//	docker run -d --rm --name eip-test-redis -p 6399:6379 redis:8
func Require(t *testing.T) *redis.Client {
	t.Helper()
	if os.Getenv(Gate) != "1" {
		t.Skipf("set %s=1 to run against a real Redis (start one with "+
			"`docker run -d --rm --name eip-test-redis -p 6399:6379 redis:8`)", Gate)
	}

	addr := os.Getenv(Addr)
	if addr == "" {
		addr = DefaultAddr
	}
	if addr == StackAddr || addr == "localhost:6379" {
		t.Fatalf("%s points at %s, which is where the stack publishes Redis. These tests delete "+
			"keys under the prefix they use, and the limiter's budget is shared state the running "+
			"system relies on. Use a throwaway server, such as %s.", Addr, addr, DefaultAddr)
	}

	client := redis.NewClient(&redis.Options{Addr: addr, Password: os.Getenv("EIP_REDIS_PARITY_PASSWORD")})
	ctx, cancel := context.WithTimeout(context.Background(), dial)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		t.Fatalf("redis at %s: %v", addr, err)
	}

	t.Cleanup(func() { _ = client.Close() })
	return client
}

// Clean removes every key under a prefix, so a run leaves nothing behind.
func Clean(t *testing.T, client *redis.Client, prefix string) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), dial)
	defer cancel()

	var cursor uint64
	for {
		keys, next, err := client.Scan(ctx, cursor, prefix+"*", 500).Result()
		if err != nil {
			t.Fatalf("scan %s: %v", prefix, err)
		}
		if len(keys) > 0 {
			if err := client.Del(ctx, keys...).Err(); err != nil {
				t.Fatalf("delete under %s: %v", prefix, err)
			}
		}
		if next == 0 {
			return
		}
		cursor = next
	}
}
