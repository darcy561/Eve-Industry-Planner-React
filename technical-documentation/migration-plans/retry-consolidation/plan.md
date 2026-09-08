# Retry consolidation — plan

**Rules:** Read and following [`../documentation-rules.md`](../documentation-rules.md)
and [`../technical-rules.md`](../technical-rules.md) (migration-plans).
Phase 1 (project folders/docs) before any product work.
For Go surfaces in scope only: `go fix -diff` before planned work; again on edited packages (not unrelated code).
Live SoT will not be edited until this project is complete and promotion is approved.

Redis is already on the shared engine — see [backend/shared/redis.md](../../backend/shared/redis.md)
§ Errors and retry — and is where the duplication was noticed. This project finishes the job across
the other areas.

## Goal

Four packages retry an operation, and three of them implement the loop themselves.

`services/shared/retry` is a generic engine — `Do(ctx, operation, shouldRetry, opts…)` — that
takes the retry predicate as an argument, so the part that differs per area is already a parameter.
It is used by the object store, EVE SSO, the SDE fetcher, and now the Redis handle.
`services/shared/mongo` and `services/shared/nats` each hand-roll the same loop beside it.

The project is finished when one loop exists, every area supplies only its own predicate and
policy, and a reader can find the retry flow in one place rather than inferring it from three
similar files.

## Starting position

| Package | Loop | Attempts | Backoff | Predicate | Callers |
|---------|------|----------|---------|-----------|---------|
| `shared/retry` | the engine | 3 (default) | 200ms → 2s | supplied by the caller | object store, EVE SSO, SDE fetch |
| `shared/redis` | uses the engine | 3 | 100ms → 2s | `IsRetryableError` | the handle's own operations |
| `shared/mongo` | its own | 3 | 100ms → 2s | `IsRetryableMongoError` | ~30 call sites, plus `Docs` helpers and `writers` |
| `shared/nats` | its own | per policy | per policy | `IsRetryable` | 4 call sites, two named policies |

The three loops agree on structure — attempt, classify, back off, honour the context — and differ in
their defaults, their logging, and small details of what they return. None of the differences needs a
separate loop:

- **NATS carries named policies.** `PublishRetry` (5 attempts, 500ms → 5s) and `AckRetry` (3, 100ms →
  400ms) are values, and the engine already takes attempts and delays as options. Acknowledgement
  backs off less because it holds a consumer's redelivery timer open — that reasoning is worth
  keeping, and it is a policy, not a loop.
- **Mongo takes `RetryOption`** to override the operation name for logging. The engine has
  `WithOperationName`.
- **Each logs slightly differently.** Redis showed the shape that works: the engine runs the loop,
  and the caller's `shouldRetry` logs each retried attempt, so nothing about logging needs to live in
  the engine.

## What the engine owes first

Adopting it should not spread its defects. Two are known, and both are fixed before anything moves.

**The exhausted-attempts wrapper is unreachable.** `Do` returns `err` at
`attempt == cfg.MaxAttempts`, so the `fmt.Errorf("%s failed after %d attempts: %w", …)` at the end of
the function never runs — and `WithOperationName` therefore has no effect on what a caller receives.
Either the wrapper goes, or the loop stops returning early; the decision is which error a caller
should get, and it is made once here rather than three times.

Returning the **cause** is the better answer, and is what Redis relies on today: `errors.Is` and the
area's own `IsUnavailable`-style predicates work on it without unwrapping. That makes the fix
"delete the unreachable wrapper and say so in the doc comment", and `WithOperationName` becomes
logging-only — which is all Mongo used it for.

**No jitter.** Every loser of a contended operation retries on the same schedule. The Redis
compare-and-set needed randomised backoff and got its own, separate from this engine; whether jitter
belongs here as an option is worth deciding while the engine is open, rather than after four areas
depend on its timing.

`go fix -diff` on `shared/retry`, `shared/mongo` and `shared/nats` before any of this, and again on
what is edited.

## The shape a caller supplies

Redis is the worked example. A caller supplies three things and the engine owns the rest:

```go
retry.Do(ctx,
    func(context.Context) error { return operation() },
    func(err error, at retry.AttemptContext) bool {
        if !IsRetryableError(err) {
            return false
        }
        logs.WarnCtx(ctx, "…retrying", "attempt", at.Attempt, …)
        return true
    },
    retry.WithMaxAttempts(…), retry.WithInitialDelay(…), retry.WithMaxDelay(…),
)
```

The predicate decides **and** reports, so an area keeps its own vocabulary for what a failure means
while the loop stays one implementation. Each area keeps a thin `Retry` of its own as the name its
call sites use — the ~30 Mongo sites do not change — so this is a change of implementation, not of
surface.

## Wire compatibility

**Additive.** Nothing crosses a process boundary. `mongo.Retry`, `nats.Retry` and their policies keep
their signatures, so call sites are untouched.

**One behavioural change, deliberately:** an exhausted retry returns the cause rather than an error
wrapped with the attempt count. A caller matching on the message would break; a caller using
`errors.Is` improves. The message form is not part of any contract that is tested today, and Stage A
adds tests that fix the new one.

**Not migrate-required.** No stored data, keys or payloads are involved.

## Stages

### Stage A — Fix the engine — **done**

The engine moved to `services/shared/retry` (out of `core/`, which holds application components), the
unreachable wrapper is gone so an exhausted retry returns the cause, `WithOperationName` is
logging-only, and `WithJitter` exists as an option that is off by default. The engine has its own
tests for exhaustion, cancellation mid-wait, a non-retryable failure, option fallbacks, and the
backoff curve.

What landed, and why each way: [overlay.md](./overlay.md) § Stage A.

### Stage B — Mongo

`mongo.Retry` keeps its signature and calls the engine. `IsRetryableMongoError` becomes the predicate;
`RetryOption` maps to `WithOperationName`. The ~30 call sites and the `Docs` / `writers` helpers do
not change.

Done when: `shared/mongo` holds no loop, and its retry tests pass unchanged.

### Stage C — NATS

`nats.Retry` keeps its signature; `RetryPolicy` becomes engine options at the call. `PublishRetry`
and `AckRetry` stay as named values, with the reason acknowledgement backs off less kept where it is.

Done when: `shared/nats` holds no loop, and its retry tests pass unchanged.

### Stage D — Close

Confirm no package outside `shared/retry` implements a backoff loop, enforced by a test. Promote the
retry flow into live documentation — it has no home today — and delete this folder.

Done when: one loop exists, the live docs describe it, and this folder is gone.

## Stage status

| Stage | Status |
|-------|--------|
| Phase 1 — project folder and docs | **done** |
| Stage A — fix the engine | **done** |
| Stage B — Mongo | not started |
| Stage C — NATS | not started |
| Stage D — close | not started |

## Pickup

Start at Stage B. The engine's contract is settled and tested, so B and C are now mechanical: replace
each loop with a `retry.Do` call that supplies the area's predicate and its policy as options.

Two things the converted areas must account for, both recorded in [overlay.md](./overlay.md) § Stage A:

- An exhausted retry returns the cause, so the `fmt.Errorf("… failed after %d attempts")` in each loop
  goes rather than moving.
- `shouldRetry` is not called on the last attempt, so a loop's "all retries exhausted" log line moves
  to after `Do` returns.

The Redis adoption is the reference for what a converted area looks like —
`services/shared/redis/retry.go`, a predicate plus options and no loop of its own.
