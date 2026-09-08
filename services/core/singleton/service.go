// Package singleton runs one or more "exactly-one-replica-at-a-time" jobs
// inside the core process.
//
// # When to use this
//
// Some background loops in this codebase are safe to run from multiple
// replicas but waste resources (duplicate work, duplicate events) when
// they do. Examples:
//
//   - the doc-lock TTL expiry subscriber (every replica receives the same
//     keyspace notification but only one can ever win the underlying
//     transition);
//   - any future batched-event flusher / cron-style sweep / cluster-wide
//     bookkeeping job that should fire exactly once per tick.
//
// Each such loop is a `Job` here. `StartService` registers them, spawns
// one goroutine per Job that holds a Redis lease, and returns a stop fn
// that waits for every Job to drain.
//
// # Relationship to the lease primitive
//
// The shared Redis handle owns the lease itself — acquire, CAS-renew, release,
// and a scoped context cancelled on lease loss. This package is the service on
// top: it validates jobs at startup, runs them in parallel, aggregates their
// stop funcs and attaches uniform logging. A caller wanting its own lease
// wiring uses [eipredis.RunWhileHeld] directly.
package singleton

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"eve-industry-planner/shared/logs"
	eipredis "eve-industry-planner/shared/redis"
)

// Job describes one singleton workload.
//
// Two `Job`s registered in the same call to `StartService` MUST have
// distinct lease keys — sharing a key would create accidental cross-job
// leader election. `StartService` rejects duplicates at startup.
type Job struct {
	// Name is a short, stable identifier used in logs (e.g.
	// "doclock-expiry-subscriber"). Required.
	Name string

	// LeaseKey is the Redis key used to elect the leader for this job.
	// Required. Should be globally unique across the entire deployment;
	// the convention is `lease:<domain>:<job>`.
	LeaseKey string

	// Run is invoked under a context that is cancelled when:
	//   - the lease is lost (renew failed twice, or a peer took over), OR
	//   - the singleton service is stopped.
	// It must respect ctx and return promptly when cancelled. Returning a
	// non-nil error is logged; the service will release the lease and let
	// the lease package's outer loop re-acquire (so transient errors
	// recover on their own).
	Run func(ctx context.Context) error

	// Options overrides lease defaults (TTL, renew cadence, acquire
	// backoff, jitter). Zero-valued fields fall back to package defaults.
	Options eipredis.LeaseOptions
}

func (j Job) validate() error {
	if strings.TrimSpace(j.Name) == "" {
		return errors.New("singleton: Job.Name is required")
	}
	if strings.TrimSpace(j.LeaseKey) == "" {
		return fmt.Errorf("singleton: Job %q: LeaseKey is required", j.Name)
	}
	if j.Run == nil {
		return fmt.Errorf("singleton: Job %q: Run is required", j.Name)
	}
	return nil
}

// StartService spawns one lease-gated runner per Job and returns a stop
// function that waits for every runner to drain. Validation failures and
// duplicate lease keys are returned immediately; no goroutines are spawned
// in that case.
//
// The stop fn is idempotent and safe to call from lifecycle shutdown.
func StartService(r *eipredis.Redis, jobs ...Job) (func(), error) {
	if r.Driver() == nil {
		return nil, errors.New("singleton: redis client is required")
	}
	if len(jobs) == 0 {
		return nil, errors.New("singleton: at least one Job is required")
	}

	seenKeys := make(map[string]string, len(jobs))
	for _, j := range jobs {
		if err := j.validate(); err != nil {
			return nil, err
		}
		if prev, dup := seenKeys[j.LeaseKey]; dup {
			return nil, fmt.Errorf("singleton: lease key %q reused by %q and %q",
				j.LeaseKey, prev, j.Name)
		}
		seenKeys[j.LeaseKey] = j.Name
	}

	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup
	wg.Add(len(jobs))

	for _, j := range jobs {
		leaseID := eipredis.LeaseInstanceID() + ":" + j.Name
		go func() {
			defer wg.Done()
			runOne(ctx, r, j, leaseID)
		}()
	}

	var stopOnce sync.Once
	return func() {
		stopOnce.Do(func() {
			cancel()
			wg.Wait()
		})
	}, nil
}

// runOne wraps lease.RunWhileHeld for a single Job and centralises the
// structured-log fields so every Job logs in the same shape.
func runOne(ctx context.Context, r *eipredis.Redis, j Job, leaseID string) {
	err := eipredis.RunWhileHeld(
		ctx,
		r,
		j.LeaseKey,
		leaseID,
		j.Options,
		func(scoped context.Context) error {
			logs.InfoCtx(scoped, "singleton: leader elected",
				"job", j.Name,
				"lease_key", j.LeaseKey,
				"lease_id", leaseID,
			)
			return j.Run(scoped)
		},
	)
	if err != nil && !errors.Is(err, context.Canceled) {
		logs.WarnCtx(ctx, "singleton: lease loop exited",
			"error", err,
			"job", j.Name,
			"lease_key", j.LeaseKey,
		)
	}
}
