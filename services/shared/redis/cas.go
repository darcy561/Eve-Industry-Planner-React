package redis

import (
	"context"
	"encoding/json"
	"errors"
	"math/rand/v2"
	"time"

	"github.com/redis/go-redis/v9"
)

// ErrCASConflict reports that a key changed while a read-modify-write was in
// flight, so the write was refused rather than overwriting the other writer.
var ErrCASConflict = errors.New("redis: compare-and-set conflict")

// A conflicting update is retried with a short randomised backoff. Retrying
// immediately makes contention worse: every loser re-reads and re-races at the
// same instant, so the same writer can keep losing.
const (
	casAttempts    = 20
	casBackoffUnit = 500 * time.Microsecond
	casBackoffMax  = 20 * time.Millisecond
)

// Update reads a JSON document, applies mutate, and writes it back only if
// nothing else wrote to the key in between.
//
// mutate receives the stored document, or the zero value with found false when
// the key is absent, and is called again on each attempt — so it must derive its
// result from what it is given rather than from a value captured outside.
// Returning an error abandons the update.
//
// The write goes through WATCH/MULTI/EXEC: a racing writer aborts this attempt
// rather than being silently overwritten. After [casAttempts] conflicts the
// caller gets [ErrCASConflict].
func Update[T any](ctx context.Context, r *Redis, key string, ttl time.Duration, mutate func(doc T, found bool) (T, error)) error {
	if err := requireKey(key); err != nil {
		return err
	}
	c, err := r.client()
	if err != nil {
		return err
	}

	for attempt := range casAttempts {
		if attempt > 0 && !casBackoff(ctx, attempt) {
			return ctx.Err()
		}

		err := c.Watch(ctx, func(tx *redis.Tx) error {
			var doc T
			found := true

			stored, err := tx.Get(ctx, key).Bytes()
			switch {
			case errors.Is(err, redis.Nil):
				found = false
			case err != nil:
				return err
			default:
				if err := json.Unmarshal(stored, &doc); err != nil {
					return err
				}
			}

			next, err := mutate(doc, found)
			if err != nil {
				return err
			}
			payload, err := json.Marshal(next)
			if err != nil {
				return err
			}

			// Only MULTI/EXEC honours the WATCH, so the write cannot be a plain
			// Set: a racing writer has to be able to abort it.
			_, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
				pipe.Set(ctx, key, payload, ttl)
				return nil
			})
			return err
		}, key)

		if errors.Is(err, redis.TxFailedErr) {
			continue
		}
		return err
	}

	return ErrCASConflict
}

// casBackoff waits a randomised, growing interval. Returns false if ctx ended.
func casBackoff(ctx context.Context, attempt int) bool {
	window := min(casBackoffUnit*time.Duration(1<<min(attempt, 5)), casBackoffMax)
	timer := time.NewTimer(time.Duration(rand.Int64N(int64(window)) + 1))
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}
