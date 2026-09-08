# Retry consolidation — overlay

How retrying works **while this project is in flight**. Live docs remain the truth where this file is
silent; where they overlap, this file wins.

The engine lives at **`services/shared/retry`**, beside the clients that use it, and is the only
backoff loop in `services/` — a test enforces that. Every area supplies its own predicate and budget.

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
    retry.WithOperationName(…), retry.WithJitter(…), retry.WithFullJitter(),
    retry.WithUnlimitedAttempts(),
)
```

**What the engine decides.** How many attempts, how long each wait is, that every wait is abandoned
when the context ends, and which error the caller receives.

**`shouldRetry` is not called on the last attempt.** There is no retry left to authorise, so an area
that logs inside the predicate logs only retries it actually makes. An area wanting a line about the
final failure logs it after `Do` returns, as `shared/redis` does.

**`WithOperationName` is logging-only.** It reaches the caller's predicate through the caller's own
closure; the engine never puts it in an error.

**Jitter is an option, off by default,** so every area keeps its exact timing unless it asks. Both
forms apply *after* the `MaxDelay` cap — jittering first and then capping would erase the spread at
exactly the point contention is worst.

| Option | Delay | For |
|--------|-------|-----|
| *(default)* | exactly the backoff | an operation that has to answer now |
| `WithJitter(f)` | backoff ± `f` of itself, `f` clamped to 1 | spreading a small number of callers |
| `WithFullJitter()` | uniform over `(0, backoff]` | a heavily contended operation, where losers should spread across the window rather than bunch at its end |

The two are exclusive: the last one passed wins. A jittered delay never falls below 1ns.

**`WithUnlimitedAttempts` waits instead of budgeting.** Retrying continues until the operation
succeeds, the predicate refuses, or the context ends — for waiting on something that will arrive, not
for an operation that has to answer now. The context becomes the only bound, so a caller must have one
that ends. `AttemptContext.MaxAttempts` is 0 for such a run, since there is no total to count towards,
and the delay's doubling is clamped so a long run cannot shift it into overflow.

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

*Done.* `mongo.Retry` keeps its signature and supplies `IsRetryableMongoError` as the predicate with
its three attempts as options, so the call sites and the `Docs` / `writers` helpers are untouched.
`RetryOption` / `WithOpName` still label the logs, unchanged.

Because the engine does not consult the predicate on the last attempt, classification lives in one
closure called from two places: from the predicate for attempts that can still retry, and after `Do`
returns for a failure on the last one. Without that, a non-retryable final failure would be logged as
exhaustion. A missing document still logs nothing — it is the answer the caller asked for — and a
cancelled context logs nothing either.

## Stage C — NATS

*Done.* `nats.Retry` keeps its signature; `RetryPolicy` becomes engine options at the call, and
`PublishRetry` / `AckRetry` stay as named values with the reason acknowledgement backs off less kept
beside them. Its log levels are unchanged — the retry line stays `Info` and a refusal stays `Warn`,
which differs from Mongo's and is the area's own choice.

`IsRetryable` treats `context.DeadlineExceeded` as retryable, because a publish carries its own
deadline and a lapsed one means the server is not answering. A context that ended before any attempt
ran is different — that is the caller giving up — so the two are told apart by whether an attempt
ever ran.

## Stage D — Close

*Code done; promotion pending.* Four more loops were found while enforcing the goal, none of them in
the plan's original scope, and all four moved onto the engine:

| Loop | Now | Note |
|------|-----|------|
| `shared/redis/cas.go` | `WithFullJitter` | the contended caller that grew its own randomised backoff, and the reason jitter was added to the engine |
| `shared/redis/connect.go` | flat delay (`InitialDelay` = `MaxDelay`) | a server still starting comes up on its own schedule, so the wait does not grow away from it |
| `shared/mongo/connect.go` | flat delay | was a blocking `time.Sleep`, so it is now cancellable too |
| `api/helper/sdecache/cache.go` | `WithUnlimitedAttempts` | the warmer waits for static data to arrive rather than budgeting attempts; its outer scheduling loop is untouched |

`shared/httpclient` keeps its own retry: it retries a request rather than an operation, with its own
budget, and is a different concern.

**Enforcement.** `TestRetry_isTheOnlyBackoffLoop` parses every non-test file under `services/` and
fails on a function whose loop both waits on a timer and bounds itself by an attempt count, skipping
loops that call `retry.Do` (a loop *around* the engine is scheduling repeated work, not hand-rolling
backoff). It was checked against a deliberately reintroduced loop, so it fails when it should.

**Still to do:** promote this file's Stage A – Stage D content into live documentation under
`backend/`, which has no home for the retry flow today, then delete this folder.
