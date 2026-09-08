# Retrying an operation (`services/shared/retry`)

Live SoT for the backend's backoff loop: how many attempts an operation gets, how long it waits
between them, and which error the caller ends up with. Package:
[`services/shared/retry`](../../../services/shared/retry).

It is the only backoff loop in `services/`. An area supplies what a failure means to it and what its
budget is; the loop itself is not rewritten per area. What each area considers transient stays with the
package that understands those failures — [mongo.md](./mongo.md) § Errors and retry,
[nats.md](./nats.md) § Errors and retry, [redis.md](./redis.md) § Errors and retry — and outbound HTTP
retries a request rather than an operation, with its own budget → [esi.md](./esi.md) § Outbound HTTP.

## Defaults

| Piece | Default | Change |
|-------|---------|--------|
| Attempts | 3, including the first try | `WithMaxAttempts(n)`, or `WithUnlimitedAttempts()` |
| Delay | 200ms, doubling per attempt | `WithInitialDelay(d)` |
| Delay cap | 2s | `WithMaxDelay(d)` |
| Jitter | none | `WithJitter(f)` or `WithFullJitter()` |
| Log label | none | `WithOperationName(name)` |

A non-positive attempt count, initial delay or delay cap falls back to the default rather than
disabling the loop.

## The shape a caller supplies

```go
retry.Do(ctx,
    func(ctx context.Context) error { return operation(ctx) },
    func(err error, at retry.AttemptContext) bool {
        if !IsRetryableError(err) {
            return false
        }
        logs.WarnCtx(ctx, "operation failed, retrying",
            "attempt", at.Attempt, "max_attempts", at.MaxAttempts, "error", err)
        return true
    },
    retry.WithMaxAttempts(3), retry.WithInitialDelay(100*time.Millisecond),
)
```

Three things come from the caller — the operation, a predicate, and the budget as options — and the
engine owns the rest.

**The predicate decides and reports.** It answers whether the failure earns another attempt, and it is
where the area logs the retry, so each area keeps its own vocabulary and log levels while the loop
stays one implementation. Nothing about logging lives in the engine.

**It is not called on the last attempt.** There is no retry left to authorise, so a predicate that logs
only ever logs retries that actually happen. Two consequences for a caller: a line about the final
failure belongs after `Do` returns, and so does any classification of it — a failure on the last
attempt has not been through the predicate. `shared/mongo` and `shared/nats` both hold that
classification in one closure called from both places.

## What the caller receives

| Outcome | Returned |
|---------|----------|
| Success on any attempt | `nil` |
| The predicate refuses | that failure, unwrapped |
| Attempts run out | the last failure, unwrapped |
| Context ends, before or between attempts | `ctx.Err()` |

The failure is never wrapped with an attempt count, so `errors.Is` and an area's own
`IsUnavailable`-style predicates work on what comes back without unwrapping first. `WithOperationName`
is a label for a caller's own logging and never appears in a returned error.

The context is checked before each attempt and during every wait, so cancellation ends the loop
promptly rather than sleeping out the remaining backoff.

## Backoff and jitter

The delay doubles each attempt and is capped at `MaxDelay`. Jitter is applied **after** the cap:
capping a jittered delay instead would erase the spread at exactly the point contention is worst.

| Option | Delay | Use for |
|--------|-------|---------|
| *(default)* | exactly the backoff | an operation that has to answer now |
| `WithJitter(f)` | the backoff ± `f` of itself, `f` capped at 1 | spreading a small number of callers |
| `WithFullJitter()` | uniform over `(0, backoff]` | a contended operation, where losers should spread across the window rather than bunch at its end |

The two forms are exclusive — the last option passed wins — and a jittered delay never reaches zero.
Without jitter, every loser of a contended operation retries on the same schedule and the same writer
can keep losing; the Redis compare-and-set uses full jitter for that reason.

## Waiting instead of budgeting

`WithUnlimitedAttempts()` retries until the operation succeeds, the predicate refuses, or the context
ends. It is for waiting on something that will arrive rather than for an operation that has to answer
now — the static-data cache warmer waits for its data this way. The context becomes the only bound, so
a caller must have one that ends. `AttemptContext.MaxAttempts` is 0 for such a run, since there is no
total to count towards.

## Fixed delays

An area that wants a flat wait rather than a growing one sets `InitialDelay` equal to `MaxDelay`. Both
connection-establishment loops do: a server that is still starting comes up on its own schedule, so
growing the wait only moves the retry further away from the moment it becomes useful.

## Topic-only detail

The sole-loop rule is enforced, not just documented. `TestRetry_isTheOnlyBackoffLoop` parses every
non-test file under `services/` and fails on a function whose loop both waits on a timer and bounds
itself by an attempt count. Loops that call `retry.Do` are skipped — a loop *around* the engine is
scheduling repeated work, not hand-rolling backoff — and `shared/httpclient` is exempt because it
retries a request rather than an operation.

A ticker that paces recurring work is not a backoff loop and is unaffected.
