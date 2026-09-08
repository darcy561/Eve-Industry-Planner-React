# Retry consolidation

## Owns

One retry engine for the whole backend, and the flow every retried operation follows.

- **`services/shared/retry`** as the single backoff loop: attempts, delays, jitter, context handling,
  and the outcome a caller gets — including where the package lives.
- The **shape a caller supplies**: which failures are worth retrying, what the operation is called,
  and what is logged around it.
- The **per-area policies** — Mongo's three attempts, NATS's publish and acknowledgement budgets,
  Redis's — expressed as configuration of the one engine rather than as separate loops.
- The **defects in the engine** found while adopting it, including the unreachable
  exhausted-attempts wrapper.
- The **test that keeps the loop sole** — what counts as a backoff loop, and what is exempt.

## Does not own

- Which errors each area considers transient. `IsRetryableMongoError`, `nats.IsRetryable` and
  `redis.IsRetryableError` stay with the packages that understand those failures; this project
  changes where they are called from, not what they decide.
- The Redis handle and its keyspace → [backend/shared/redis.md](../../backend/shared/redis.md).
  Redis already calls the shared engine; this project does not revisit it.
- HTTP-level retry and its budget → `services/shared/httpclient`, which retries a request rather
  than an operation and is a different concern, and is exempt from the sole-loop test.
- Live SoT under [backend/](../../backend/contents.md), promoted only when this project closes.

## Task map

| I need to… | Read |
|------------|------|
| Understand why three loops exist and what replaces them | [plan.md](./plan.md) § Goal, § Starting position |
| See what the engine is missing before anything moves onto it | [plan.md](./plan.md) § What the engine owes first |
| Know what the engine guarantees a caller today | [overlay.md](./overlay.md) § Stage A |
| Know what a caller supplies and what the engine decides | [plan.md](./plan.md) § The shape a caller supplies |
| Check what is additive and what breaks | [plan.md](./plan.md) § Wire compatibility |
| See the stages and their order | [plan.md](./plan.md) §§ Stage A – Stage D |
| Check what has landed | [plan.md](./plan.md) § Stage status |
