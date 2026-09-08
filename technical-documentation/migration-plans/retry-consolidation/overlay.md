# Retry consolidation — overlay

How retrying works **while this project is in flight**. Live docs remain the truth where this file is
silent; where they overlap, this file wins.

Nothing has landed. Today `services/shared/core/retry` is the engine used by the object store, EVE
SSO, the SDE fetcher and the Redis handle, while `services/shared/mongo` and `services/shared/nats`
each hold a loop of their own. See [plan.md](./plan.md) § Starting position.

## Stage A — The engine

*Not started.* Will record what a caller receives when attempts run out, whether the engine jitters,
and what its options mean.

### Deliberate differences from what is replaced

| Behaviour | Was | Is | Why |
|-----------|-----|----|-----|
| Exhausted retry | wrapped with the attempt count | *to be decided in Stage A* | a caller should be able to classify the cause without unwrapping |

## Stage B — Mongo

*Not started.* Will record how `mongo.Retry` and its `RetryOption` reach the engine.

## Stage C — NATS

*Not started.* Will record how `RetryPolicy`, `PublishRetry` and `AckRetry` reach the engine.

## Stage D — Close

*Not started.* Will carry the retry flow that live documentation should hold.
