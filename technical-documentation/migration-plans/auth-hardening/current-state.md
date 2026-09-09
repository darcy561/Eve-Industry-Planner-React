# Current state — what the auth stack actually has today

This is the audit that produced [plan.md](./plan.md). The planner auth stack carried a roadmap under
`backend/api/auth/roadmap.md` from before migration projects existed, and it was never updated after
that. Every claim it made was checked against the code as it stands. The result splits three ways:
work that has since shipped, work that is genuinely still open, and work that another project took
over.

The evidence is recorded here rather than summarised, so that a later reader can tell whether a
verdict still holds without repeating the sweep.

**Taken against `feature/shared-planners`.** The finished `spa-token-acquisition` branch has not
landed on this lineage, and it rewrites much of `Functions/Auth/` and gives the REST session endpoints
a coded refusal. Several verdicts below change when it merges — which items, and what to re-check, is
[spa-token-landing/plan.md](../spa-token-landing/plan.md) § Stage D.

## What has shipped

These were open items on the retired roadmap. Each is now covered by code and, where the item was a
test gap, by tests that exist and run.

| Old id | Item | Evidence |
|--------|------|----------|
| #40, #41 | SSO exchange and refresh handler tests | `services/api/v1endpoints/sso/refresh_route_test.go` — ten tests covering both routes: a token the app can use, a code traded for a token, bodies the handler cannot use, a refused token reported as the server answering, silence reported as an outage, and both routes still serving while the limiter gate is closed. `sso/helpers_test.go` covers the `isSSOGrantClientError` mapping the roadmap asked for. |
| #15 | Refresh state machine tests | `services/api/v1endpoints/session_lifecycle_test.go` — unknown token, revoked token, reauth required once the window elapses, still refused afterwards, token left stored when the rotate does not complete, malformed body, non-POST. |
| #43 | Login handler tests | Same file — a token signed by another issuer, an expired token, a malformed request, a non-POST request. `live_session_lifecycle_test.go` covers minting a session the browser can use, reporting first login exactly once, and logout ending only that session. One narrow piece is still unproven; see § What is still open. |
| #44 | Logout handler tests | `session_lifecycle_test.go` — revokes the session, clears its cookies, leaves other sessions alone on an unknown token, rejects a malformed request and a non-POST request. |
| #46 | `Store.Touch` failure semantics | `services/api/middleware/auth.go` classifies through `dependency.IsUnavailable` and answers `503` rather than folding a dependency outage into `session_missing`. Documented in [sessions.md](../../backend/api/auth/sessions.md) § 11. |
| #8 | The SPA parses the auth code out of a response | `parsePlannerAuthCodeFromText` in `frontend/src/Functions/Auth/sessionClient.js`, attached to the thrown error as `err.code`. |
| #9 | Explicit `reauth_required` / `session_missing` handling | `frontend/src/Functions/Auth/plannerSessionRedirect.js` parses the code from a JSON body and classifies which codes are terminal; `plannerSessionRedirect.test.js` pins both. |
| #10 | A private fetch that returns a terminal auth code resets auth | `handleTerminalPlannerAuthResponse` in `frontend/src/Functions/Endpoints/Private/applyPrivateHeaders.js` redirects to a full EVE login. |
| #16 | Frontend auth tests | Five files: `Functions/Auth/plannerSessionRedirect.test.js`, `hasResumablePlannerSession.test.js`, `plannerAuthCookies.test.js`, `Components/Auth/additionalAccountImport.test.js`, `oauthUrlParams.test.js`. |
| #51 | Additional account import window | `tryCompleteAdditionalAccountImportWindow` has regression coverage in `Components/Auth/additionalAccountImport.test.js`. |
| #48 | Session resume does not depend on the planner session id | `services/websocket/server/ws_session_resume.go` resumes on `previousClientID`, and `integration_scopes_resume_test.go` exercises it. |

The consequence for the retired roadmap's test coverage matrix is that every row it marked as a gap
was filled except the WebSocket upgrade's session cases and end-to-end coverage. The corrected
picture is in [overlay.md](./overlay.md) § Auth test coverage.

## What is still open

Each of these was checked directly, not inferred from the roadmap's own status column.

| Old id | Item | Evidence that it is still open |
|--------|------|-------------------------------|
| #13 | Middleware does not clear cookies on `reauth_required` | `services/api/middleware/auth.go` writes the error body and returns; nothing touches the response's cookies on any of the three terminal codes. |
| #12 | The WebSocket upgrade rejects in plain text | `wsUpgradeRejectClient` and `wsUpgradeRejectServer` in `services/websocket/server/logging.go` both end in `http.Error`, so the body is a bare string while every REST auth rejection is `{"code","message"}`. |
| #47 | WebSocket upgrade auth is barely tested | `integration_connect_test.go` covers a missing session and a refusal while draining. Nothing exercises an upgrade carrying a revoked session, an elapsed reauth window, or a `Touch` that fails. |
| #11 | The reauth deadline is not surfaced anywhere in the SPA | `reauth_required_at` is stored by `frontend/src/Functions/Auth/tabSessionStorage.js` and read by nothing that renders. |
| #54 | Signout orchestration is untested | `frontend/src/routes/signout.jsx` has no test file; the disconnect → logout → cache clear ordering is unpinned. |
| #14 | Rejection and contention are not measured | Session lifecycle metrics exist and are good — `api.auth_sessions.started_total`, `continued_total`, `ended_total`, `stored_total`, `store_errors_total` and the `api.session_refresh.*` family in `services/shared/telemetry/apimetrics/instruments.go`. What is missing is a counter for rejections keyed by code, a counter for the optimistic-locking retries in `shared/plannersession`, and counts from the maintenance sweep. |
| #56 | Auth failure logs are not uniformly shaped | The middleware and the WebSocket upgrade both attach structured detail, and `refresh.go` attaches caveats; whether every auth handler failure carries `session_id`, `account_id` and the flow has not been checked handler by handler. |
| #22 | No Redis outage runbook | The code half is done — the `503` split landed with #46 — but there is no operator document saying what a `503` on an auth route means or what to do about it. |
| #45 | The half-success path leaves minted material behind | In `refresh.go` and in `authenticate.go` the Redis writes complete before `ResolveUserDocumentsForLogin` is called, and neither revokes what it minted when that read fails. Bootstrap recovers on the SPA's retry through session-id recovery; login does not, and it has already counted the session. Decided at [plan.md](./plan.md) § Stage E, not yet written. |
| #43 (residual) | Cloud login stripping the ESI refresh secret from the response body is unproven | The policy is stated in the retired roadmap and nothing asserts it. |
| #49 | Cloud ESI credential errors have no user-facing copy | `refresh.go` maps the whole `user.ErrMongoStoredEsi*` family to status codes; none of it reaches the user as an explanation. |
| #50 | Linked-character hydration on cloud bootstrap is untested | The bootstrap response carries `LinkedCharacters`; nothing asserts the per-character tokens survive into the store. |
| #42 | CCP outage behaviour is undocumented | The limiter gate is exercised by `sso/refresh_route_test.go`, but how deferral is meant to line up with the SPA's Tranquility gate is written down nowhere. |
| #55 | The split between the route guard and an API 401 is undocumented | `frontend/src/utils/authGuard.js` and the private-fetch path decide independently; the split is deliberate and unstated. |
| #19 | Planner refresh tokens are plaintext in Redis | [sessions.md](../../backend/api/auth/sessions.md) § 8 states it as current behaviour: Redis is the trust boundary. Never revisited. |
| #32 | No CSRF defence | `grep -rni csrf services/ frontend/src` returns nothing. |
| #30, #31 | Logout everywhere, device list, configurable reauth window | Nothing exists. |
| #21 | Account-wide revocation | No `RevokeAllSessions`-shaped method on the store. `sessions.md` § 14 names it as absent. |

## Superseded or owned elsewhere

| Old id | Where it went |
|--------|---------------|
| #57 | **Closed by work that shipped.** SPA token acquisition was rebuilt around a credential provider that resolves a token at the point of use, and the React-mounted maintenance clocks were deleted rather than relocated — so the lifecycle supervisor #57 proposed has nothing left to own. Current behaviour is [frontend/auth/spa.md](../../frontend/auth/spa.md). |
| #17, #18 | **[entity-id-encryption](../entity-id-encryption/plan.md).** That project reports the code half landed; what remains is one operator sweep against real databases and retiring the plaintext refresh-token fallback. Restating a status here would give it two homes. |
| #21 | **Premise changed, not moved — [shared-planners](../shared-planners/plan.md).** A session's grants stopped being a cached list of corporation and alliance ids: Stage B made them `models.SessionGrants` owner keys and Stage C repointed the fill at membership rows, which is why `refresh.go` now calls `mongo.OwnerKeysForAccount` rather than reading a claims cache. That project's Stage E owes the membership revocation path. What survives for this project is the session-side half — account-wide revocation, see [plan.md](./plan.md) Stage B. |
| #52 | **Closed, no change.** The worker's `update_account_session_grants` task is not a duplicate of the handler's inline resolve: it is the only caller of ESI affiliation and the only writer of membership rows, while the handler projects rows that already exist. Recorded at [plan.md](./plan.md) § Stage E. |
| #53 | **[shared-planners](../shared-planners/plan.md) § Stage I.** The grants list has one non-test reader — the websocket's connect-time ceiling — so whether a failed fill should refuse a session cannot be answered without deciding whether the stored list survives at all. |

## Facts the retired roadmap got wrong

These were stale statements in the document body rather than backlog items, and they are the reason
the file could not simply be pruned.

- The layer reference described session grants as "corp/alliance IDs on session". They are owner keys
  resolved from membership rows. The `custom_claims_corporations:` and `custom_claims_alliances:`
  Redis keys named in the system map do still exist, in `shared/plannersession/keys.go`.
- The metrics items pointed at `apimetrics` as an API-service package. It is
  `services/shared/telemetry/apimetrics` and has been shared since the service boundary work.
- The test coverage matrix was wrong in six of its rows, all in the same direction.
- The "Obsolete / external references" section existed to name a retired practice — the internal JWT
  and its JWKS — which is exactly what the documentation rules put out of live documentation.
- The incident appendix recorded a production failure from May 2026 whose entire value has been
  absorbed into the behaviour it produced: the reauth gate, the index cleanup, the CAS writes and the
  orphan sweep, all of which are current behaviour documented in `sessions.md`.

## Go modernisation in the touch surface

`go fix -diff` was run against only the packages this plan expects to touch — `api/middleware`,
`api/v1endpoints` and its `user` subpackage, `websocket/server`, `shared/plannersession/...` and
`shared/telemetry/apimetrics`. Three files carry suggestions, and they are not all free:

- `api/v1endpoints/authenticate.go` and `refresh.go` — composite literal tidying, folding a trailing
  field assignment into the literal. Cosmetic, safe, and worth taking with Stage E, which edits both
  files anyway.
- `api/v1endpoints/session_types.go` — the fixer wants `omitempty` removed from the `UserDocument`
  and `ApplicationSettings` fields of the bootstrap response. **This one changes the wire.** Dropping
  `omitempty` makes both fields always present in the JSON, where today an empty document is omitted
  entirely. It must not be applied as a modernisation; if it is taken at all it is a deliberate
  contract change and belongs with the wire-compatibility note in [plan.md](./plan.md).

Nothing else in the touch surface has `go fix` debt.
