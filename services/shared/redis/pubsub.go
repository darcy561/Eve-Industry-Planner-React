package redis

import (
	"context"

	"github.com/redis/go-redis/v9"
)

// Subscription is a live pattern subscription. Payloads arrives closed when the
// subscription ends, so a receive on a closed channel means the subscription is
// gone rather than that nothing happened.
type Subscription struct {
	pubsub   *redis.PubSub
	payloads chan string
}

// SubscribePattern subscribes to every channel matching pattern and delivers
// each message's payload.
//
// Keyspace notifications are the reason this exists, and they are opt-in on the
// server: a subscription succeeds even when the server publishes nothing, so a
// silent channel is not proof of a broken subscription.
func (r *Redis) SubscribePattern(ctx context.Context, pattern string) (*Subscription, error) {
	c, err := r.client()
	if err != nil {
		return nil, err
	}

	pubsub := c.PSubscribe(ctx, pattern)
	s := &Subscription{pubsub: pubsub, payloads: make(chan string)}

	go func() {
		defer close(s.payloads)
		for msg := range pubsub.Channel() {
			if msg == nil {
				continue
			}
			select {
			case s.payloads <- msg.Payload:
			case <-ctx.Done():
				return
			}
		}
	}()

	return s, nil
}

// Payloads delivers each message's payload until the subscription closes.
func (s *Subscription) Payloads() <-chan string { return s.payloads }

// Close ends the subscription.
func (s *Subscription) Close() error { return s.pubsub.Close() }
