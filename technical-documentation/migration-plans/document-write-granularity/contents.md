# Document write granularity

## Owns

How a change to a stored document is written, carried and applied — whether as the whole document or
as the fields that changed.

- The **write shape**: `BulkUpsertJobs` and its siblings setting an entire document on every save,
  and what replaces it.
- What the **client tracks** so it can say what changed: dirty fields through the persist debounce and
  the outbound coalescer.
- What **delivery carries**: `updatedFields` / `removedFields` from the change stream, which are
  already captured and currently discarded.
- How a **client applies** a change onto the document it holds rather than replacing it.
- Whether two writers editing **different fields** of one document can both keep their edit, and what
  a conflicting write is answered with.

## Does not own

- The ordering token, the owner-scoped baseline, and what `session_resume` may assert →
  [shared-planners/plan.md](../shared-planners/plan.md) § Stage G. That project found this problem and
  owns making write loss *visible*; this project decides whether the loss can be avoided.
- Per-owner delivery ordering and the shard FIFOs → same stage. This project assumes ordering is
  solved and does not re-solve it.
- Statistics deltas, which are already field-scoped `$inc` / `$set` operations →
  [archived-jobs-stats/contents.md](../archived-jobs-stats/contents.md). Those are a different write
  path that this project does not change.
- The document lock, which prevents overlap rather than resolving it → live SoT under
  [backend/](../../backend/contents.md).
- Live SPA and backend behaviour, promoted only when this project closes.

## Task map

| I need to… | Read |
|------------|------|
| Understand why whole-document writes are a problem | [plan.md](./plan.md) § Goal, § Starting position |
| See what shared planners settled that this project depends on | [plan.md](./plan.md) § What this project inherits |
| Know what the change stream already captures | [plan.md](./plan.md) § The delta is already there |
| See the options for a conflicting write | [plan.md](./plan.md) § What a conflicting write is answered with |
| Check what is additive and what breaks | [plan.md](./plan.md) § Wire compatibility |
| See the stages and their order | [plan.md](./plan.md) § Stages |
| Check what has landed | [plan.md](./plan.md) § Stage status |
| See how a part works while the project is in flight | [overlay.md](./overlay.md) |
