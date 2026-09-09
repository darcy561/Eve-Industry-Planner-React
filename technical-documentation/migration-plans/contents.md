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
| Service import boundaries (stop services importing each other) | [service-import-boundaries/contents.md](./service-import-boundaries/contents.md) |
| Task dispatch (task type authority, envelope collapse, operator CLI) | [task-dispatch/contents.md](./task-dispatch/contents.md) |
| ESI collections (one normalised row shape from the query layer for assets and blueprints; tree, search, quantity, library and location consumers) | [esi-collections/contents.md](./esi-collections/contents.md) |
| ESI limiter maintainability (slot-hash ledger overlay, benchmark data, property testing and ledger diagnostics) | [esi-limiter-maintainability/contents.md](./esi-limiter-maintainability/contents.md) |
| Mongo test database (a database of the tests' own, dropped between runs, and the live suite in CI) | [mongo-test-database/contents.md](./mongo-test-database/contents.md) |
| Document write granularity (whole-document writes to field-scoped ones, and how broad the document lock has to be; **found by shared-planners Stage G**) | [document-write-granularity/contents.md](./document-write-granularity/contents.md) |
| Planning stage panels (splitting the Edit Job market panel; selling costs at plan time; speculative child jobs) | [planning-stage-panels/contents.md](./planning-stage-panels/contents.md) |
| SPA token acquisition (auth tokens acquired at the point of use; React-lifecycle refresh clocks deleted, cloud/local split confined to one module) | [spa-token-acquisition/contents.md](./spa-token-acquisition/contents.md) |
