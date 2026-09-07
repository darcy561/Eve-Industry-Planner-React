package nats_test

import (
	"sync/atomic"
	"testing"

	"eve-industry-planner/testing/natsfake"

	natslib "github.com/nats-io/nats.go"
)

// Every registered handler runs on a reconnect, and the connection's own
// reconnect callback is kept rather than replaced by the first registration.
func TestOnReconnectRunsEveryHandlerAndKeepsTheExistingCallback(t *testing.T) {
	fake := natsfake.New(t)
	conn := fake.NATS.Conn()

	var existing atomic.Int32
	conn.SetReconnectHandler(func(*natslib.Conn) { existing.Add(1) })

	var first, second atomic.Int32
	fake.NATS.OnReconnect(func() { first.Add(1) })
	fake.NATS.OnReconnect(func() { second.Add(1) })

	// Invoke what the client would call on a re-established link.
	conn.Opts.ReconnectedCB(conn)

	if existing.Load() != 1 {
		t.Errorf("existing callback ran %d times, want 1: registering a handler must not replace it", existing.Load())
	}
	if first.Load() != 1 || second.Load() != 1 {
		t.Errorf("handlers ran %d and %d times, want 1 each", first.Load(), second.Load())
	}
}

func TestOnReconnectIgnoresNil(t *testing.T) {
	fake := natsfake.New(t)
	fake.NATS.OnReconnect(nil)

	if cb := fake.NATS.Conn().Opts.ReconnectedCB; cb != nil {
		// The fake connects with no reconnect callback, so a nil registration
		// must leave it that way rather than installing a dispatcher.
		t.Fatal("a nil handler installed a reconnect callback")
	}
}
