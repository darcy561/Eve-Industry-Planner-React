package redis

import (
	"context"
	"testing"

	"eve-industry-planner/testing/redisfake"
)

// A script's result is read by the method matching what the script returns, so
// each reader is worth pinning: a caller reading the wrong one gets a zero
// value rather than an error.
func TestScriptResultReaders(t *testing.T) {
	ctx := context.Background()
	r := NewRedis(redisfake.New(t).Client)

	if got, err := r.Run(ctx, Script(`return "text"`), nil).Text(); err != nil || got != "text" {
		t.Errorf("Text = %q, %v; want text", got, err)
	}
	if got, err := r.Run(ctx, Script(`return 7`), nil).Int(); err != nil || got != 7 {
		t.Errorf("Int = %d, %v; want 7", got, err)
	}
	if err := r.Run(ctx, Script(`return 1`), nil).Err(); err != nil {
		t.Errorf("Err = %v, want nil", err)
	}

	// A script returning a table is parsed by the caller, so Value hands back
	// what the driver decoded rather than a single scalar.
	value, err := r.Run(ctx, Script(`return {1, "two"}`), nil).Value()
	if err != nil {
		t.Fatalf("Value: %v", err)
	}
	parts, ok := value.([]any)
	if !ok || len(parts) != 2 {
		t.Fatalf("Value = %#v, want a two-element slice", value)
	}
	if parts[0] != int64(1) || parts[1] != "two" {
		t.Errorf("Value = %#v, want [1 two]", parts)
	}
}

// A script that fails reports through every reader rather than answering a
// zero value.
func TestScriptFailureReachesTheCaller(t *testing.T) {
	ctx := context.Background()
	r := NewRedis(redisfake.New(t).Client)
	broken := Script(`this is not lua`)

	if err := r.Run(ctx, broken, nil).Err(); err == nil {
		t.Error("a broken script reported no error")
	}
	if _, err := r.Run(ctx, broken, nil).Text(); err == nil {
		t.Error("Text on a broken script reported no error")
	}
	if _, err := r.Run(ctx, broken, nil).Value(); err == nil {
		t.Error("Value on a broken script reported no error")
	}
}

// Keys and args reach the script in the order they were given.
func TestScriptReceivesItsKeysAndArgs(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	got, err := r.Run(ctx,
		Script(`redis.call("SET", KEYS[1], ARGV[1] .. ARGV[2]) return redis.call("GET", KEYS[1])`),
		[]string{"k"}, "a", "b").Text()
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if got != "ab" {
		t.Errorf("script wrote %q, want ab — keys or args arrived out of order", got)
	}
	if stored, _ := fake.Server.Get("k"); stored != "ab" {
		t.Errorf("stored %q, want ab", stored)
	}
}
