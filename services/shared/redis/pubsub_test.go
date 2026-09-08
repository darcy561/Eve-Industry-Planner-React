package redis

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/testing/redisfake"
)

func TestSubscribePatternDeliversPayloads(t *testing.T) {
	ctx := t.Context()

	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	sub, err := r.SubscribePattern(ctx, "news.*")
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer func() { _ = sub.Close() }()

	// miniredis delivers to subscribers registered before the publish.
	waitForSubscriber(t, fake)
	fake.Server.Publish("news.sport", "a goal")

	select {
	case got := <-sub.Payloads():
		if got != "a goal" {
			t.Errorf("payload = %q, want %q", got, "a goal")
		}
	case <-time.After(2 * time.Second):
		t.Fatal("no payload arrived")
	}
}

// Closing ends the channel, so a consumer ranging over it stops rather than
// blocking forever.
func TestSubscriptionCloseEndsThePayloads(t *testing.T) {
	ctx := t.Context()

	fake := redisfake.New(t)
	sub, err := NewRedis(fake.Client).SubscribePattern(ctx, "x.*")
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	if err := sub.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}

	select {
	case _, open := <-sub.Payloads():
		if open {
			t.Error("a closed subscription delivered a payload")
		}
	case <-time.After(2 * time.Second):
		t.Fatal("the payload channel stayed open after Close")
	}
}

func TestSubscribePatternReportsAHandleWithNoClient(t *testing.T) {
	if _, err := NewRedis(nil).SubscribePattern(context.Background(), "x"); err == nil {
		t.Fatal("subscribing on a clientless handle returned no error")
	}
}

func waitForSubscriber(t *testing.T, fake *redisfake.Redis) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if fake.Server.PubSubNumPat() > 0 {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatal("the subscription never registered")
}

// The delivering goroutine must end with the context, or a subscription per
// caller leaks one for the life of the process.
func TestSubscriptionGoroutineEndsWithTheContext(t *testing.T) {
	fake := redisfake.New(t)
	ctx, cancel := context.WithCancel(context.Background())

	sub, err := NewRedis(fake.Client).SubscribePattern(ctx, "x.*")
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	waitForSubscriber(t, fake)

	cancel()
	// Closing is what ends the driver's channel, and the goroutine ranges over
	// it; the cancelled context stops a blocked send from outliving the caller.
	if err := sub.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}

	select {
	case _, open := <-sub.Payloads():
		if open {
			t.Error("a cancelled subscription still delivered")
		}
	case <-time.After(2 * time.Second):
		t.Fatal("the delivering goroutine outlived its context")
	}
}
