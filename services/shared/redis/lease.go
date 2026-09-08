package redis

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"uuid"

	"eve-industry-planner/shared/container"
	"eve-industry-planner/shared/logs"
)

// TTL is how long after a replica vanishes another can take over.
// RenewInterval is roughly TTL/3, so two missed renews still leave headroom.
const (
	DefaultLeaseTTL            = 15 * time.Second
	DefaultLeaseRenewInterval  = 5 * time.Second
	DefaultLeaseAcquireBackoff = 5 * time.Second
)

// LeaseOptions controls lease cadence. A zero field falls back to the package
// default; callers usually override only TTL and RenewInterval, for tests.
type LeaseOptions struct {
	TTL            time.Duration
	RenewInterval  time.Duration
	AcquireBackoff time.Duration
	// JitterFraction adds up to this fraction of AcquireBackoff as random
	// jitter on the wait between acquire attempts. 0 disables jitter.
	JitterFraction float64
	// Logger overrides the default, for tests that want silent runs.
	Logger LeaseLogger
}

// LeaseLogger lets a caller plug in a quieter logger than the project-wide
// structured one.
type LeaseLogger interface {
	Debugf(ctx context.Context, msg string, fields ...any)
	Warnf(ctx context.Context, msg string, fields ...any)
}

type defaultLeaseLogger struct{}

func (defaultLeaseLogger) Debugf(ctx context.Context, msg string, fields ...any) {
	logs.DebugCtx(ctx, msg, fields...)
}
func (defaultLeaseLogger) Warnf(ctx context.Context, msg string, fields ...any) {
	logs.WarnCtx(ctx, msg, fields...)
}

func (o LeaseOptions) withDefaults() LeaseOptions {
	if o.TTL <= 0 {
		o.TTL = DefaultLeaseTTL
	}
	if o.RenewInterval <= 0 {
		o.RenewInterval = DefaultLeaseRenewInterval
	}
	if o.AcquireBackoff <= 0 {
		o.AcquireBackoff = DefaultLeaseAcquireBackoff
	}
	if o.JitterFraction < 0 {
		o.JitterFraction = 0
	}
	if o.JitterFraction > 1 {
		o.JitterFraction = 1
	}
	if o.Logger == nil {
		o.Logger = defaultLeaseLogger{}
	}
	return o
}

// renewIfMineScript renews the lease's TTL if the value is still our instance
// id. KEYS[1] lease key, ARGV[1] instance id, ARGV[2] new TTL in milliseconds.
// Returns 1 if renewed.
var renewIfMineScript = Script(`
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("PEXPIRE", KEYS[1], ARGV[2])
end
return 0
`)

// releaseIfMineScript deletes the lease key if we still hold it.
// KEYS[1] lease key, ARGV[1] instance id. Returns 1 if deleted.
var releaseIfMineScript = Script(`
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`)

// InstanceID returns a per-hold lease value: "<container.ID()>:<uuid>". The
// container id attributes a held lease; the UUID keeps it unique across
// restarts, so a resurrected process cannot refresh its own stale lease.
func LeaseInstanceID() string {
	return container.ID() + ":" + strings.TrimSpace(uuid.New().String())
}

// RunWhileHeld blocks until ctx is cancelled. It acquires the named lease,
// runs `fn` under a derived context, renews the lease in the background,
// and re-acquires whenever the lease is lost (Redis pause, takeover, etc).
//
// The contract:
//   - `fn` MUST observe its context — when the lease is lost the scoped
//     context is cancelled and `fn` should stop work promptly.
//   - `fn` may return an error to indicate a transient failure; the lease
//     is released and re-acquisition continues. Use a clean return (nil)
//     for graceful "I'm done" shutdowns triggered by context cancellation.
//   - Concurrent callers are serialised by Redis itself: only one replica
//     can hold the lease at a time.
//
// `key` is the Redis lease key (e.g. `lease:doclock:expiry-subscriber`).
// `instanceID` should be stable per-process; use InstanceID() unless you
// have a reason to override.
func RunWhileHeld(
	ctx context.Context,
	r *Redis,
	key, instanceID string,
	opts LeaseOptions,
	fn func(ctx context.Context) error,
) error {
	if strings.TrimSpace(key) == "" {
		return ErrEmptyKey
	}
	if r == nil || r.conn == nil {
		return ErrNoClient
	}
	if strings.TrimSpace(instanceID) == "" {
		return errors.New("redis lease: instance id is required")
	}
	if fn == nil {
		return errors.New("redis lease: fn is required")
	}
	opts = opts.withDefaults()

	for {
		if err := ctx.Err(); err != nil {
			return err
		}

		acquired, err := acquire(ctx, r, key, instanceID, opts.TTL)
		if err != nil {
			opts.Logger.Warnf(ctx, "redis lease: acquire failed",
				"error", err,
				"lease_key", key,
				"instance_id", instanceID,
			)
			if !sleepWithCtx(ctx, opts.AcquireBackoff, opts.JitterFraction) {
				return ctx.Err()
			}
			continue
		}
		if !acquired {
			if !sleepWithCtx(ctx, opts.AcquireBackoff, opts.JitterFraction) {
				return ctx.Err()
			}
			continue
		}

		opts.Logger.Debugf(ctx, "redis lease: leader elected",
			"lease_key", key,
			"instance_id", instanceID,
			"ttl_ms", opts.TTL.Milliseconds(),
		)

		runFnUnderLease(ctx, r, key, instanceID, opts, fn)

		// Best-effort release: failure here only matters during deploy
		// overlap, and a stale lease will TTL out on its own.
		if err := ReleaseIfMine(context.WithoutCancel(ctx), r, key, instanceID); err != nil {
			opts.Logger.Warnf(ctx, "redis lease: release failed",
				"error", err,
				"lease_key", key,
			)
		}
	}
}

// runFnUnderLease returns when fn returns or the lease is lost; RunWhileHeld
// handles release and re-acquisition.
func runFnUnderLease(
	parent context.Context,
	r *Redis,
	key, instanceID string,
	opts LeaseOptions,
	fn func(ctx context.Context) error,
) {
	scoped, cancel := context.WithCancel(parent)
	defer cancel()

	renewDone := make(chan struct{})
	go func() {
		defer close(renewDone)
		runRenewer(scoped, r, key, instanceID, opts)
		cancel()
	}()

	if err := fn(scoped); err != nil && !errors.Is(err, context.Canceled) {
		opts.Logger.Warnf(parent, "redis lease: fn returned error",
			"error", err,
			"lease_key", key,
		)
	}

	cancel()
	<-renewDone
}

// runRenewer CAS-renews the lease TTL every RenewInterval. One miss is a
// transient blip; two in a row is treated as a lost lease and returns, which
// cancels the scoped context.
func runRenewer(ctx context.Context, r *Redis, key, instanceID string, opts LeaseOptions) {
	ticker := time.NewTicker(opts.RenewInterval)
	defer ticker.Stop()

	const maxConsecutiveFailures = 2
	var consecutiveFailures int

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			ok, err := renewIfMine(ctx, r, key, instanceID, opts.TTL)
			if err != nil {
				consecutiveFailures++
				opts.Logger.Warnf(ctx, "redis lease: renew failed",
					"error", err,
					"lease_key", key,
					"consecutive_failures", consecutiveFailures,
				)
				if consecutiveFailures >= maxConsecutiveFailures {
					return
				}
				continue
			}
			if !ok {
				opts.Logger.Warnf(ctx, "redis lease: lease lost (no longer ours)",
					"lease_key", key,
					"instance_id", instanceID,
				)
				return
			}
			consecutiveFailures = 0
		}
	}
}

// acquire returns true if we successfully claimed the lease (SET NX EX).
func acquire(ctx context.Context, r *Redis, key, instanceID string, ttl time.Duration) (bool, error) {
	ok, err := r.PutIfAbsent(ctx, key, instanceID, ttl)
	if err != nil {
		return false, fmt.Errorf("setnx: %w", err)
	}
	return ok, nil
}

// renewIfMine returns true if we still held the lease and refreshed its TTL.
func renewIfMine(ctx context.Context, r *Redis, key, instanceID string, ttl time.Duration) (bool, error) {
	res, err := r.Run(ctx, renewIfMineScript, []string{key}, instanceID, ttl.Milliseconds()).Int()
	if err != nil {
		return false, fmt.Errorf("renew script: %w", err)
	}
	return res == 1, nil
}

// ReleaseIfMine deletes the lease key if our id still matches. No-op if we
// no longer hold it. Used for shutdown and unhealthy-leader forced release.
func ReleaseIfMine(ctx context.Context, r *Redis, key, instanceID string) error {
	if err := r.Run(ctx, releaseIfMineScript, []string{key}, instanceID).Err(); err != nil && !IsNotFound(err) {
		return fmt.Errorf("release script: %w", err)
	}
	return nil
}

// sleepWithCtx blocks for d (plus optional jitter) but returns early on
// ctx cancellation. Returns true if the sleep completed.
func sleepWithCtx(ctx context.Context, d time.Duration, jitterFraction float64) bool {
	if d <= 0 {
		return ctx.Err() == nil
	}
	if jitterFraction > 0 {
		extra := time.Duration(rand.Float64() * jitterFraction * float64(d))
		d += extra
	}
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-t.C:
		return true
	}
}
