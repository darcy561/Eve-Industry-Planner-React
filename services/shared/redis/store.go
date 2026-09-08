// Package redis is the shared Redis handle: one connection, the retry policy,
// and the key builders for every namespace this application owns.
//
// Import as eipredis.
package redis

import (
	"context"
	"errors"

	"github.com/redis/go-redis/v9"
)

// Redis is the handle a role receives. It owns the connection and the health
// loop started with it; Close stops both.
type Redis struct {
	conn       *redis.Client
	stopHealth context.CancelFunc
}

// NewRedis binds a handle to an already-open client, for tests and for a
// caller that built its own. Connect is the usual entry point. A nil client
// yields a handle whose every method reports [ErrNoClient].
func NewRedis(client *redis.Client) *Redis {
	return &Redis{conn: client}
}

// Driver returns the driver client, or nil when the handle has none. It is the
// escape hatch for work the handle does not model, and is nil-receiver safe: a
// role that did not open Redis holds a nil handle.
func (r *Redis) Driver() *redis.Client {
	if r == nil {
		return nil
	}
	return r.conn
}

// client returns the driver client, or ErrNoClient when the handle was never
// given one. Every method that reaches the driver goes through it.
func (r *Redis) client() (*redis.Client, error) {
	if r == nil || r.conn == nil {
		return nil, ErrNoClient
	}
	return r.conn, nil
}

// Ping round-trips to the server rather than reporting link state.
func (r *Redis) Ping(ctx context.Context) error {
	c, err := r.client()
	if err != nil {
		return err
	}
	return c.Ping(ctx).Err()
}

// Close stops the health loop and closes the connection.
func (r *Redis) Close() error {
	if r == nil {
		return nil
	}
	if r.stopHealth != nil {
		r.stopHealth()
		r.stopHealth = nil
	}
	if r.conn == nil {
		return nil
	}
	return r.conn.Close()
}

// ErrNoClient reports a handle that was never given a connection.
var ErrNoClient = errors.New("redis: no client")
