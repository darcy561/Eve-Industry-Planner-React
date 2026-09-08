package redis

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"eve-industry-planner/testing/redisfake"
)

func TestConnectRejectsAMalformedURL(t *testing.T) {
	_, err := connectFromURL(context.Background(), func() (string, error) {
		return "not a redis url", nil
	})
	if err == nil {
		t.Fatal("connect accepted a malformed URL")
	}
	if !strings.Contains(err.Error(), "parse") {
		t.Fatalf("error = %v, want it to name the parse failure", err)
	}
}

func TestConnectReportsTheURLBuilderFailure(t *testing.T) {
	want := errors.New("REDIS_PASSWORD is required")
	_, err := connectFromURL(context.Background(), func() (string, error) {
		return "", want
	})
	if !errors.Is(err, want) {
		t.Fatalf("error = %v, want %v", err, want)
	}
}

func TestConnectStopsOnACancelledContext(t *testing.T) {
	// Nothing listens on this port, so every attempt fails.
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	start := time.Now()
	_, err := connectFromURL(ctx, func() (string, error) {
		return "redis://127.0.0.1:1", nil
	})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("error = %v, want context.Canceled", err)
	}
	// Five attempts five seconds apart would be 20s of sleeping.
	if elapsed := time.Since(start); elapsed > 2*time.Second {
		t.Fatalf("connect slept through cancellation for %v", elapsed)
	}
}

func TestCloseStopsTheHealthLoop(t *testing.T) {
	fake := redisfake.New(t)
	handle := NewRedis(fake.Client)

	ctx, stop := context.WithCancel(context.Background())
	handle.stopHealth = stop
	done := make(chan struct{})
	go func() {
		defer close(done)
		monitorConnection(ctx, fake.Client)
	}()

	if err := handle.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("health loop still running after Close")
	}
}

func TestPingReportsAHandleWithNoClient(t *testing.T) {
	var handle *Redis
	if err := handle.Ping(context.Background()); !errors.Is(err, ErrNoClient) {
		t.Fatalf("error = %v, want ErrNoClient", err)
	}
}

func TestAHandleWithNoClientReportsSo(t *testing.T) {
	if err := NewRedis(nil).Ping(context.Background()); !errors.Is(err, ErrNoClient) {
		t.Fatalf("Ping on a clientless handle = %v, want ErrNoClient", err)
	}
}

func TestPingRoundTrips(t *testing.T) {
	fake := redisfake.New(t)
	handle := NewRedis(fake.Client)
	if err := handle.Ping(context.Background()); err != nil {
		t.Fatalf("ping: %v", err)
	}
}
