// Package retry is the backend's backoff loop. An area supplies what a failure
// means to it and what its budget is; the loop itself lives here once.
package retry

import (
	"context"
	"math/rand/v2"
	"time"
)

// Config defines retry behaviour for transient external failures.
type Config struct {
	MaxAttempts   int
	InitialDelay  time.Duration
	MaxDelay      time.Duration
	OperationName string
	Jitter        float64
}

// Option overrides default retry behaviour. Pass zero or more to Do.
type Option func(*Config)

// AttemptContext includes metadata for retry callbacks.
type AttemptContext struct {
	Attempt     int
	MaxAttempts int
}

// DefaultConfig returns conservative defaults for external API calls.
func DefaultConfig() Config {
	return Config{
		MaxAttempts:  3,
		InitialDelay: 200 * time.Millisecond,
		MaxDelay:     2 * time.Second,
	}
}

// WithMaxAttempts sets the maximum number of attempts (including the first try).
func WithMaxAttempts(n int) Option {
	return func(c *Config) {
		c.MaxAttempts = n
	}
}

// WithInitialDelay sets the delay before the first retry (after attempt 1 fails).
func WithInitialDelay(d time.Duration) Option {
	return func(c *Config) {
		c.InitialDelay = d
	}
}

// WithMaxDelay caps exponential backoff between attempts.
func WithMaxDelay(d time.Duration) Option {
	return func(c *Config) {
		c.MaxDelay = d
	}
}

// WithOperationName sets a name for a caller's own logging. Do never puts it in
// an error: an exhausted retry returns the failure itself.
func WithOperationName(name string) Option {
	return func(c *Config) {
		c.OperationName = name
	}
}

// WithJitter spreads each delay by up to fraction of itself in either direction,
// so simultaneous losers of a contended operation do not retry in step. 0
// (the default) keeps backoff exact; values above 1 are clamped to 1.
func WithJitter(fraction float64) Option {
	return func(c *Config) {
		c.Jitter = fraction
	}
}

// Do executes operation with exponential backoff while shouldRetry returns true.
// Defaults match DefaultConfig(); pass Options only when you need overrides.
//
// The error returned is always the one the operation produced — never a wrapper
// counting the attempts — so errors.Is and an area's own predicates work on it
// without unwrapping. A cancelled context returns ctx.Err() instead.
func Do(
	ctx context.Context,
	operation func(context.Context) error,
	shouldRetry func(error, AttemptContext) bool,
	opts ...Option,
) error {
	cfg := DefaultConfig()
	for _, opt := range opts {
		opt(&cfg)
	}

	if cfg.MaxAttempts <= 0 {
		cfg.MaxAttempts = 3
	}
	if cfg.InitialDelay <= 0 {
		cfg.InitialDelay = 200 * time.Millisecond
	}
	if cfg.MaxDelay <= 0 {
		cfg.MaxDelay = 2 * time.Second
	}

	for attempt := 1; attempt <= cfg.MaxAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return err
		}

		err := operation(ctx)
		if err == nil {
			return nil
		}

		attemptCtx := AttemptContext{
			Attempt:     attempt,
			MaxAttempts: cfg.MaxAttempts,
		}
		if attempt == cfg.MaxAttempts || !shouldRetry(err, attemptCtx) {
			return err
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(backoff(cfg, attempt)):
		}
	}

	// Unreachable: the loop returns on success, on exhaustion, and on refusal.
	return nil
}

// backoff returns the wait before the attempt after this one: the delay doubles
// per attempt, is capped at MaxDelay, and only then is jittered — so jitter
// spreads the cap rather than being erased by it.
func backoff(cfg Config, attempt int) time.Duration {
	delay := min(cfg.InitialDelay<<(attempt-1), cfg.MaxDelay)
	if cfg.Jitter <= 0 {
		return delay
	}

	fraction := min(cfg.Jitter, 1)
	spread := float64(delay) * fraction
	jittered := float64(delay) + spread*(2*rand.Float64()-1)
	if jittered < 1 {
		return 1
	}
	return time.Duration(jittered)
}
