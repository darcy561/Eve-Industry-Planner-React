# Promote drafts — service-import-boundaries

Whole-file replacement drafts for every live doc this project owes a fold. Prefer the live paths
below for day-to-day edits once folded; this folder is the promote snapshot.

## Routing map

| Overlay content | Destination | Change |
|------------------|-------------|--------|
| Session kernel/request/maintenance package moves, `Store` API, cleanup reduction, wire compatibility | [`backend/api/auth/sessions.md`](./backend/api/auth/sessions.md) → [`…/backend/api/auth/sessions.md`](../../../backend/api/auth/sessions.md) | **Replaced** — package paths, § Cleanup, § Files rewritten for the moved code |
| Same move, cross-stack architecture + wire contract + file index | [`backend/api/auth/overview.md`](./backend/api/auth/overview.md) → [`…/backend/api/auth/overview.md`](../../../backend/api/auth/overview.md) | **Replaced** — identity primitives, flows, Redis key map, file index paths |
| Same move, system map + hygiene-job cadence | [`backend/api/auth/roadmap.md`](./backend/api/auth/roadmap.md) → [`…/backend/api/auth/roadmap.md`](../../../backend/api/auth/roadmap.md) | **Replaced** — layer/file paths, cadence bullet, service-boundaries line under Shipped foundation |
| Removal of the `cron.pruneExpiredAccountSessions` cron | [`backend/core/scheduler.md`](./backend/core/scheduler.md) → [`…/backend/core/scheduler.md`](../../../backend/core/scheduler.md) | **Updated** — cron row removed, pointer to the singleton sweep added |
| Redis key ownership moved from `api/helper/auth` to `shared/plannersession` | [`backend/shared/redis.md`](./backend/shared/redis.md) → [`…/backend/shared/redis.md`](../../../backend/shared/redis.md) | **Updated** — two Owner cells in § What Redis holds |
| `shared/plannersession` / `shared/httpmiddleware` are new shared-owned surfaces documented with sessions | [`backend/shared/contents.md`](./backend/shared/contents.md) → [`…/backend/shared/contents.md`](../../../backend/shared/contents.md) | **Updated** — one § Does not own line, alongside the existing `evesso` line |
| New harness packages: `serviceboundaries`, `sessionhandover`, `redisfixture` | [`testing/harness.md`](./testing/harness.md) → [`…/testing/harness.md`](../../../testing/harness.md) | **Updated** — three coverage-map rows, entrypoints, topic-only detail |
| New test depth for `shared/plannersession`, `shared/httpmiddleware` | [`testing/services/shared.md`](./testing/services/shared.md) → [`…/testing/services/shared.md`](../../../testing/services/shared.md) | **Updated** — entrypoints + coverage rows |
| `api/helper/auth` test depth shrank to the browser flow | [`testing/services/api.md`](./testing/services/api.md) → [`…/testing/services/api.md`](../../../testing/services/api.md) | **Updated** — `helper/auth` row and topic-only detail rewritten |
| `scheduler/maintenance` no longer registers a session-prune cron | [`testing/services/core.md`](./testing/services/core.md) → [`…/testing/services/core.md`](../../../testing/services/core.md) | **Updated** — cron-registration row, `singleton` row, topic-only note |
| `tasks/maintenance` no longer has a prune-sessions task | [`testing/services/worker.md`](./testing/services/worker.md) → [`…/testing/services/worker.md`](../../../testing/services/worker.md) | **Updated** — Thin row and topic-only note |

Also update live (no separate draft needed — a one-line row removal, not new content): the
project's own row in [`../../contents.md`](../../contents.md) (the migration-plans section task
map), removed at the same time the project folder is deleted.

## Apply

| Draft | Live target | Apply |
|-------|-------------|-------|
| [backend/api/auth/sessions.md](./backend/api/auth/sessions.md) | [`…/backend/api/auth/sessions.md`](../../../backend/api/auth/sessions.md) | Replace whole file |
| [backend/api/auth/overview.md](./backend/api/auth/overview.md) | [`…/backend/api/auth/overview.md`](../../../backend/api/auth/overview.md) | Replace whole file |
| [backend/api/auth/roadmap.md](./backend/api/auth/roadmap.md) | [`…/backend/api/auth/roadmap.md`](../../../backend/api/auth/roadmap.md) | Replace whole file |
| [backend/core/scheduler.md](./backend/core/scheduler.md) | [`…/backend/core/scheduler.md`](../../../backend/core/scheduler.md) | Replace whole file |
| [backend/shared/redis.md](./backend/shared/redis.md) | [`…/backend/shared/redis.md`](../../../backend/shared/redis.md) | Replace whole file |
| [backend/shared/contents.md](./backend/shared/contents.md) | [`…/backend/shared/contents.md`](../../../backend/shared/contents.md) | Replace whole file |
| [testing/harness.md](./testing/harness.md) | [`…/testing/harness.md`](../../../testing/harness.md) | Replace whole file |
| [testing/services/shared.md](./testing/services/shared.md) | [`…/testing/services/shared.md`](../../../testing/services/shared.md) | Replace whole file |
| [testing/services/api.md](./testing/services/api.md) | [`…/testing/services/api.md`](../../../testing/services/api.md) | Replace whole file |
| [testing/services/core.md](./testing/services/core.md) | [`…/testing/services/core.md`](../../../testing/services/core.md) | Replace whole file |
| [testing/services/worker.md](./testing/services/worker.md) | [`…/testing/services/worker.md`](../../../testing/services/worker.md) | Replace whole file |

## To add to `technical-documentation/technical-rules.md`

A rules file is folded into, never replaced — every project and session edits it, so a whole-file
draft would discard whatever landed while these drafts waited. Add this section under
**Engineering practices — Go / backend & Deployment Tool**, immediately before
§ Prefer modern Go:

```markdown
### Service boundaries (`services/`)

Each service under `services/` — `api`, `core`, `worker`, `websocket`, `ws-router`, `capacity-controller` — is its own deployable, and the fleet's import graph must say so:

- **A service must not import another service's packages.** Code two or more services need lives in `services/shared/`, not in whichever service's package happened to write it first.
- **`services/shared/` must not import a service.** A shared package that reaches into `api`, `core`, `worker`, `websocket`, `ws-router` or `capacity-controller` couples every one of its consumers to that service, which breaks the boundary as surely as a direct service-to-service import.
- Guarded by `testing/serviceboundaries`, which **discovers** services by reading `services/` (so a new deployable is covered from the day it exists) rather than listing them, and parses every Go file's imports, including `_test.go` and files behind a build tag.
- `services/` and `deployment-tool/` are separate Go modules; neither imports the other.
```

## Not promoted

Stays in the project folder (or is discarded with it) rather than folding into live SoT:

- **The staged history** — Stage A1–A4, B, C narrative, the "Landed" notes, the alternatives considered for the package split, the name chosen for `plannersession` and the names rejected, the middleware-type decision, and the differential-harness design. Live docs describe the system as it is, not the sequence that built it.
- **The differential harness itself** (`testing/plannersessionparity`) — deleted at Stage A4 once it had a live implementation to compare against and no second subject left. Its cases that still mattered were folded into `shared/plannersession`'s own tests before it was deleted; nothing about the harness is live SoT.
- **Options weighed and rejected** — move-the-package-whole, kernel-plus-remainder, the other candidate names (`authsession`, `appsession`, `session`, `usersession`), `shared/core/plannersession`, reshape-in-place, move-first-reshape-later, and the two ways of handling the middleware type that were not chosen. These are process record, not behaviour.
- **Two pre-existing problems this project found but does not own**, and does not claim fixed:
  - `testing/esi_soak/lib` does not compile at HEAD (`esi_soak/lib/run.go:194` passes a raw `*redis.Client` where `esiclient.New` wants `*eipredis.Redis`) — confirmed against a clean worktree, predates this work.
  - `testing/wait`'s `TestUntil_timeoutCarriesDetail` is flaky (failed once in three runs on an untouched file) — shared test infrastructure, not diagnosed, not this project's to fix.
  - Also noted in the plan and left alone: `go fix -diff` modernisations in `api/helper/endpointHelpers.go`, `api/helper/json.go`, and three `v1endpoints` files this project touched but did not write; `testing/ws_soak/lib/profile_test.go` unformatted at HEAD; `services/services/` an empty untracked stray directory.
