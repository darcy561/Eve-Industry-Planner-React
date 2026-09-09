# Overlay — behaviour this project holds until it promotes

Two kinds of content live here. The first is current behaviour that no live document states, which
the retired auth roadmap was the only home for; it is held here so that removing that roadmap loses
nothing, and it promotes as described in [plan.md](./plan.md) § Promote. The second is the
"what changed / how it works now" record for each stage, which fills in as stages land.

Where this file and live documentation disagree, this file wins for the surfaces it names. Everywhere
else, live documentation is the truth.

## Session window invariants

[overview.md](../../backend/api/auth/overview.md) § 1 documents the reauth deadline as
`started_at + RefreshTokenTTL`, and [sessions.md](../../backend/api/auth/sessions.md) § 11 documents
the `401 reauth_required` it produces. Neither states the rule that makes the deadline mean anything:
**a rotate or a bootstrap must not move it.**

The deadline is anchored at a full EVE SSO login, or at the first `session_id` minted on a new chain.
`ReauthDeadlineFromSessionStart` in `services/shared/plannersession/reauth.go` derives it from
`SessionStart` alone, and `refresh.go` writes `SessionStart` only in two cases — when it is minting a
session id because the chain has none, and when a legacy refresh row carries a zero value. A rotate
of an existing chain leaves it untouched, updates `SessionSeenAt`, and the middleware's `Store.Touch`
updates `LastSeenAt`. None of those three feed the deadline.

The rule matters because the opposite behaviour is the natural thing to write. A cookie resume looks
like a login from the handler's point of view, and refreshing the window on it would turn a hard
seven-day cap into an indefinite session that never asks for EVE SSO again — which is the property
the cap exists to prevent. Anyone editing `refresh.go` should be able to read that before deciding
where to set `SessionStart`.

Two supporting facts belong with it when this promotes:

- After the deadline, the only way back is `POST /auth/sessions` with a fresh EVE access token. A
  cookie-only bootstrap is refused, and refusing it is what `TestRefreshRequiresReauthOnceTheWindowElapses`
  and `TestRefreshStaysRefusedAfterReauthRequired` pin.
- A cloud account's ESI refresh secret does not reach the SPA for storage. It lives in Mongo, the
  browser holds `eip_app_refresh`, and the login response strips it. This is stated policy that
  nothing asserts — see [plan.md](./plan.md) Stage E.

## Auth test coverage

[testing/services/api.md](../../testing/services/api.md) currently describes `v1endpoints` as
carrying "type/JSON tests only — not full HTTP handler behaviour", and lists `authenticate`,
`refresh`, `logout` and the SSO exchange handlers among the untested. That was true when it was
written and is not true now. This is the corrected picture, in the coverage-map shape the testing
documentation rules prescribe.

**Tested**

- **Session kernel, reauth math, grants, TTLs and the key invariants** — `services/shared/plannersession`,
  including `TestOperationsLeaveTheKeysTheyOwe`, which asserts that a write touching several key
  families lands in all of them rather than only reading back what it just wrote.
- **Request-side session reading** — cookie, header and query precedence, and failure classification —
  `shared/plannersession/request`.
- **The maintenance sweep**, including its dry-run switch — `shared/plannersession/maintenance`.
- **Session HTTP handlers** — `api/v1endpoints/session_lifecycle_test.go` covers logout (revoke,
  cookie clearing, an unknown token leaving other sessions alone, malformed and non-POST requests),
  refresh (unknown token, revoked token, the reauth window elapsing and staying refused, a rotate that
  does not complete leaving the token stored, malformed and non-POST requests) and login (a token
  signed by another issuer, an expired token, malformed and non-POST requests).
- **The same handlers against real infrastructure** — `live_session_lifecycle_test.go`: a login mints
  a session the browser can use, first login is reported exactly once, and logout ends only the
  session that presented itself.
- **SSO exchange and refresh routes** — `api/v1endpoints/sso/refresh_route_test.go`: both routes'
  happy paths, bodies the handler cannot use, a refused token distinguished from an outage, the
  limiter gate being fed, and both routes still serving while it is closed.
- **Cross-service agreement on the stored session shape** — `testing/sessionhandover`.
- **The worker's grants task** — `worker/tasks/esi/update_account_session_grants_test.go`.
- **SPA auth error handling** — `Functions/Auth/plannerSessionRedirect.test.js` (parsing a code out of
  a body, and which codes are terminal), `hasResumablePlannerSession.test.js`,
  `plannerAuthCookies.test.js`, `Components/Auth/additionalAccountImport.test.js`,
  `oauthUrlParams.test.js`.

**Thin**

- **The API auth middleware.** `middleware/auth_test.go` holds one test, for the client failure detail
  it attaches. The cookie path and the mapping from each failure class to its status code are covered
  only indirectly, through the `shared/plannersession` tests underneath.
- **The WebSocket upgrade.** `integration_connect_test.go` covers a missing session and a refusal
  while draining. A revoked session, an elapsed reauth window and a failing `Touch` are not exercised
  on the upgrade path at all, despite each having its own branch in `HandleWS`.
- **The window-preservation invariant above.** The deadline elapsing is tested; a happy rotate
  *preserving* `SessionStart` is not, so the invariant would survive being broken.

**Little or none**

- **Signout orchestration** — `routes/signout.jsx` has no test; the disconnect, logout and cache-clear
  ordering is unpinned.
- **Cloud ESI credential failure paths** — the `user.ErrMongoStoredEsi*` mapping in `refresh.go`, and
  linked-character hydration on cloud bootstrap.
- **End to end.** No test drives a browser through login, rotate and signout against a running stack.

When this promotes, the API rows go to [testing/services/api.md](../../testing/services/api.md) and
the upgrade rows to [testing/services/websocket.md](../../testing/services/websocket.md); the SPA rows
go to the frontend testing entry when it is filled in.

## Stage records

Nothing has landed yet. Each stage adds its section here as it does, stating what changed and how the
surface behaves afterwards.

### Stage A — one shape for a rejected session

Not started.

### Stage B — revoking more than one session

Not started. Waits on [shared-planners](../shared-planners/plan.md) Stage E.

### Stage C — what an operator sees when auth fails

Not started.

### Stage D — what a user sees when a cloud credential dies

Not started.

### Stage E — bootstrap that half-succeeds

Not started.

### Stage F — the security decisions that were never taken

Not started. Decisions are recorded in [plan.md](./plan.md) Stage F as they are taken.
