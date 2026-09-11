# Migration plans

## Owns

Decision/history/work logs for long-running migrations. **Not SoT.**

## Does not own

- Live contracts → promote into [frontend/](../frontend/contents.md), [backend/](../backend/contents.md), [stack/](../stack/contents.md), or [deployment/](../deployment/contents.md) only when a project is complete and promotion is approved (see [documentation-rules.md](./documentation-rules.md))

## Task map

| I need to… | Read |
|------------|------|
| Entity id encryption (entity refs, refresh-token encryption at rest) | [entity-id-encryption/contents.md](./entity-id-encryption/contents.md) |
| Swarm stack migration (**promoted** — kept only because changestream-tenant-scale cites its overlays) | [swarm-stack/contents.md](./swarm-stack/contents.md) |
| Changestream tenant scale (publisher queues / metrics / future auto-detect) | [changestream-tenant-scale/contents.md](./changestream-tenant-scale/contents.md) |
| Shared planners (planner as a scope, membership, invites, the owner block, realtime consistency and the document lock under more than one writer) | [shared-planners/contents.md](./shared-planners/contents.md) |
| Archived jobs statistics (rollups, snapshots, corp aggregation) | [archived-jobs-stats/contents.md](./archived-jobs-stats/contents.md) |
| Collection naming (**promoted** — kept only because archived-jobs-stats cites its renames; live SoT in [backend/shared/mongo.md](../backend/shared/mongo.md)) | [collection-naming/contents.md](./collection-naming/contents.md) |
| Go 1.27 adoption (json/v2, simulated-time tests, `go fix` sweep) | [go-127-adoption/contents.md](./go-127-adoption/contents.md) |
| Task dispatch (task type authority, envelope collapse, operator CLI) | [task-dispatch/contents.md](./task-dispatch/contents.md) |
| Maintenance mode (stack-wide gate: router/websocket rejection, scheduler pause, runtime toggle) | [maintenance-mode/contents.md](./maintenance-mode/contents.md) |
| ESI limiter maintainability (slot-hash ledger overlay, benchmark data, property testing and ledger diagnostics) | [esi-limiter-maintainability/contents.md](./esi-limiter-maintainability/contents.md) |
| Location names (one cache entry per id, the ladder from ESI to a character's token to the community store, and what is retried against what is remembered) | [location-names/contents.md](./location-names/contents.md) |
| Mongo test database (a database of the tests' own, dropped between runs, and the live suite in CI) | [mongo-test-database/contents.md](./mongo-test-database/contents.md) |
| Document write granularity (whole-document writes to field-scoped ones, and how broad the document lock has to be; **found by shared-planners Stage G**) | [document-write-granularity/contents.md](./document-write-granularity/contents.md) |
| Document defaults (the defaults a job and a group are born with, the schema upgrader on their read path, and the extras category id space; **found by the model parity sweep**) | [document-defaults/contents.md](./document-defaults/contents.md) |
| Planning stage panels (splitting the Edit Job market panel; selling costs at plan time; speculative child jobs) | [planning-stage-panels/contents.md](./planning-stage-panels/contents.md) |
| Auth hardening (session rejection shape, account-wide revocation, auth observability and the outage runbook, cloud ESI credential failures, bootstrap half-success) | [auth-hardening/contents.md](./auth-hardening/contents.md) |
| App shell rollout (moving screens onto the shared surface and the component layer above it; **found while converting first login**) | [app-shell-rollout/contents.md](./app-shell-rollout/contents.md) |
| Effect-driven state synchronisation (state kept in step by an effect, and whether the area wants a different shape; **found while clearing the SPA lint backlog**) | [effect-state-sync/contents.md](./effect-state-sync/contents.md) |
