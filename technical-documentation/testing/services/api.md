# api — tests

Live SoT for test depth under [`services/api`](../../../services/api). Behaviour → [api/contents.md](../../backend/api/contents.md). Module entrypoints → [contents.md](./contents.md).

## Entrypoints

| Check | Where | Notes |
|-------|--------|--------|
| Service tree | From `services/`: `go test ./api/...` | No Docker; live Mongo and live Redis tests skip unless gated |
| Package-scoped | e.g. `go test ./api/helper/auth/` | Tightest loop |
| Live Mongo (opt-in) | `EIP_MONGO_PARITY_LIVE=1 go test ./api/helper/ -run Live -count=1` | Needs stack Mongo env (`MONGO_*`); same gate as `shared/mongo` parity |
| Live Redis (opt-in) | `EIP_REDIS_PARITY_LIVE=1 EIP_REDIS_PARITY_ADDR=… go test ./v1endpoints/ -run 'RefreshToken\|Rotat' -count=1` | **A throwaway Redis, never the stack's** — the harness clears `refresh_token:*`, which would sign out every live planner session |
| Live Mongo, cloud ESI (opt-in) | `bash scripts/testing/live-mongo.sh ./api/helper/cloudstoredesi` | Runs in a container on the stack network — [harness.md](../harness.md) § Live Mongo |

```bash
go test ./api/...
EIP_MONGO_PARITY_LIVE=1 go test ./api/helper/ -run Live -count=1
```

The live Redis suite wants a server of its own:

```bash
docker run --rm -d --name eip_redis_test -p 6380:6379 redis:8
cd services/api && EIP_REDIS_PARITY_LIVE=1 EIP_REDIS_PARITY_ADDR=127.0.0.1:6380 \
  go test ./v1endpoints/ -run 'RefreshToken|Rotat' -count=1
docker rm -f eip_redis_test
```

## Coverage map

**Depth:** Strong around the browser auth flow and some middleware. Most HTTP handlers and app wiring are untested. Opt-in live Mongo covers the main account Docs call paths handlers use after auth/lock, and the cloud ESI refresh; opt-in live Redis covers the rotate handler end to end. Planner session and refresh-token lifecycle tests live with the package that owns them now — `services/shared/plannersession` — not here; see [shared.md](./shared.md).

### Tested

| Area | What the tests cover |
|------|----------------------|
| `helper/auth` | Browser auth flow: refresh-cookie rotation and its logging, ESI OAuth storage cookie labels, tenant-affinity key format, EVE SSO token validation and error messages |
| `middleware` | Auth failure detail, optional-account binding, request logging, rate-limiter 503 / Retry-After, unregistered-route wrapping |
| `helper/sdecache` | SDE cache warm / rewarm, readiness gating, signal-driven rewarm |
| `helper` (root) | Endpoint error mapping (context cancel / Redis / Mongo → non-500) |
| `helper` (live Mongo, opt-in) | `ResolveUserDocumentsForLogin`; user/settings upsert+reload; watchlist put/get; job/group put/get/list/delete (`DeleteManyAfterStampingMeta`); group membership deltas — same Docs APIs handlers use after auth/lock (scratch `eip-api-live-account`) |
| `helper/cloudstoredesi` | Which rows a request resolves to, including a hash asked for twice resolving once — a second exchange would spend the refresh token the first rotated. Live Mongo: several characters on one account refreshing concurrently keep every rotated token, an unlinked character is reported against itself rather than failing the batch, and an empty hash list refreshes every stored row |
| `v1endpoints` | Session bootstrap/rotate JSON shapes; ESI OAuth storage field presence |
| `v1endpoints` (live Redis, opt-in) | `RotateHandler` against a real Redis and a real signed SSO token: presenting a rotated-away refresh token answers `401 {"code":"session_revoked"}`; its replacement still rotates; a token that was never issued, and a session past the 7-day reauth deadline, answer terminally too |
| `v1endpoints/user` | Batch access-token request validation — empty list, oversized list — answered before anything reaches Mongo |
| `v1endpoints/sso` | `IsSSOGrantClientError` classification only |
| `tests` | `/ready` vs `/healthy` probe contract — mux isolates **SDE warm** gating; production `app.startProbes` also **Pings Mongo** (not asserted in this isolated mux) |

### Thin

- Middleware: no tests for compression, maintenance, request timeout / start-time helpers
- Root `helper`: error-response logging + opt-in live login/job/group flows; guards / lock HTTP still untested
- `v1endpoints`: bootstrap and logout handlers have no HTTP-level tests; rotate is covered only under the live Redis gate

### Little / none

- App wiring: `main.go`, `app.go`, `apiServer.go`
- Almost all HTTP handlers end-to-end (`authenticate`, `logout`, blueprints, market, corporations, jobs/groups/watchlist/document-locks/…, SSO exchange handlers)
- `staticdata/`, `migration/`, `migrationendpoints/`, `helper/sso/` (JWKS/JWT)

## Topic-only detail

- Depth labels → [contents.md](./contents.md) § Depth labels.
- Prefer package-scoped runs under `api/helper/auth` when iterating the browser auth flow; prefer `services/shared/plannersession` (and its `request` / `maintenance` subpackages) when iterating session state — see [shared.md](./shared.md).
- Live Mongo and live Redis tests skip unless their gate is set; they do not run in default CI unit jobs.
- The rotate suite's response body is asserted from both ends: [testing/frontend/auth.md](../frontend/auth.md) pins that the SPA acts on `code: session_revoked`, this one pins that the API produces it. Change one side alone and the other fails.
- Production API ready = SDE cache warm **and** Mongo Ping (`services/api/app.go`). Package `api/tests` keeps the SDE-only mux so warm/not-warm behaviour stays deterministic without a live Mongo.
- Handler wiring behaviour → [deps.md](../../backend/api/deps.md); Mongo package → [mongo.md](../../backend/shared/mongo.md).
