# Retry consolidation — overlay

How retrying works **while this project is in flight**. Live docs remain the truth where this file is
silent; where they overlap, this file wins.

The engine lives at **`services/shared/retry`**, beside the clients that use it. `services/shared/mongo`
and `services/shared/nats` still hold a loop of their own; see [plan.md](./plan.md) § Starting position.

## Stage A — The engine

*Done.* `services/shared/retry` is the loop, and its behaviour is pinned by its own tests rather than
by its callers.

**Where it lives.** The package moved from `shared/core/retry` to `shared/retry`. `core/` holds
application components (`documentlock`, `objectstore`, `sde`); a backoff loop is a library the clients
sit on, so it belongs at the same level as `logs`, `mongo`, `nats` and `redis`. The four import sites
moved with it and no forwarding alias was left behind.

**What a caller supplies.** An operation, a `shouldRetry` predicate that both decides and reports, and
options for the budget:

```go
retry.Do(ctx,
    func(context.Context) error { return operation() },
    func(err error, at retry.AttemptContext) bool { … },
    retry.WithMaxAttempts(…), retry.WithInitialDelay(…), retry.WithMaxDelay(…),
    retry.WithOperationName(…), retry.WithJitter(…),
)
```

**What the engine decides.** How many attempts, how long each wait is, that every wait is abandoned
when the context ends, and which error the caller receives.

**`shouldRetry` is not called on the last attempt.** There is no retry left to authorise, so an area
that logs inside the predicate logs only retries it actually makes. An area wanting a line about the
final failure logs it after `Do` returns, as `shared/redis` does.

**`WithOperationName` is logging-only.** It reaches the caller's predicate through the caller's own
closure; the engine never puts it in an error.

**Jitter is an option, off by default.** `WithJitter(fraction)` spreads each delay by up to that
fraction of itself in either direction, so simultaneous losers of a contended operation stop retrying
in step. It is applied *after* the `MaxDelay` cap — jittering first and then capping would erase the
spread at exactly the point contention is worst. Every existing area keeps its exact timing because
the default is 0. The fraction is clamped to 1 and the delay never falls below 1ns.

### Deliberate differences from what is replaced

| Behaviour | Was | Is | Why |
|-----------|-----|----|-----|
| Exhausted retry | wrapped with the attempt count | the operation's own error, unwrapped | a caller classifies the cause with `errors.Is` and area predicates without unwrapping |
| Package path | `shared/core/retry` | `shared/retry` | a library the clients sit on, not an application component under `core/` |
| Jitter | none, and a contended caller grew its own | `WithJitter`, default off | one place decides backoff timing |

The exhausted-retry change was dead code in the engine — `Do` returned early at the last attempt, so
its wrapper never ran and `WithOperationName` had no effect on any returned error. It becomes a real
change for Mongo and NATS at Stages B and C, whose loops `break` and so do reach their wrappers today.
No test asserts the wrapped message, and every caller inspecting these errors uses `errors.Is`, which
works on the cause.

## Stage B — Mongo

*Not started.* Will record how `mongo.Retry` and its `RetryOption` reach the engine.

Note for that stage: `mongo.Retry` logs the exhausted failure from inside its loop, and the engine does
not call `shouldRetry` on the last attempt — so that line moves to after `Do` returns.

## Stage C — NATS

*Not started.* Will record how `RetryPolicy`, `PublishRetry` and `AckRetry` reach the engine.

## Stage D — Close

*Not started.* Will carry the retry flow that live documentation should hold.
