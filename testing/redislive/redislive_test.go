package redislive

import "testing"

// The stack publishes Redis on 6379 and these helpers delete keys. Pointing them
// there would clear the running limiter's budget, so the default is the
// throwaway port and the stack's is refused outright.

func TestTheDefaultIsNotTheStacksRedis(t *testing.T) {
	if DefaultAddr == StackAddr {
		t.Fatalf("DefaultAddr is %s, which is the stack's own Redis", DefaultAddr)
	}
}

func TestTheGateIsOffByDefault(t *testing.T) {
	t.Setenv(Gate, "")
	if Enabled() {
		t.Error("live Redis is enabled without the gate being set")
	}
	t.Setenv(Gate, "1")
	if !Enabled() {
		t.Error("the gate is set and live Redis is still not enabled")
	}
}
