# Plan — auth hardening

**Rules:** Read and following [`../documentation-rules.md`](../documentation-rules.md)
and [`../technical-rules.md`](../technical-rules.md) (migration-plans).
Phase 1 (project folders/docs) before any product work.
For Go surfaces in scope only: `go fix -diff` before planned work; again on edited packages (not unrelated code).
Live SoT will not be edited until this project is complete and promotion is approved.

## Why this project exists

The planner authentication stack shipped its hard parts and then stopped being tracked. What tracked
it was a roadmap living in `backend/api/auth/roadmap.md`, written before this repository used
migration projects, and never updated afterwards. By the time it was audited, roughly half its open
items had quietly shipped, three had been taken over by other projects, and its description of how
session grants work no longer matched the code. A backlog nobody trusts is worse than no backlog: it
made the auth stack look unfinished in places it is not, and finished in places it is not.

This project is the replacement. It carries the work that genuinely remains, grouped so that each
group is one investigation rather than a list of loose tickets, and it carries the audit that decided
what remains — [current-state.md](./current-state.md).

The old numeric ids are kept alongside each item. They appear in commit messages and in one live
document, and dropping them would break the only thread back to why an item exists.

## What this project is not

It is not a rewrite of authentication. Every stage below is a gap in an otherwise working system, and
several may close with a decision to do nothing — that is a legitimate outcome and should be recorded
as one rather than left open.

It is also not the place for anything another project owns. Refresh-token encryption in Mongo and the
entity ref model belong to [entity-id-encryption](../entity-id-encryption/plan.md); what a session's
grants mean and how membership revocation works belong to
[shared-planners](../shared-planners/plan.md). SPA token acquisition is finished work and its
behaviour is live SoT — [frontend/auth/spa.md](../../frontend/auth/spa.md). Where a stage touches
those, it says what it consumes.

## Stages

The stages are ordered by what unblocks what, not by size. A, C and D are independent of each other
and can run in any order. B waits on shared-planners. E is small but touches the two files everything
else in `v1endpoints` touches, so it is worth landing before A's middleware work if both are in
flight. F is a set of decisions, not a set of changes, and should be taken deliberately rather than
drifting.

---

### Stage A — one shape for a rejected session

**Carries:** #12, #13, #47, #55.

The API and the WebSocket share one identity check — `shared/plannersession/request` — and then
disagree about how to report its failure. REST answers `{"code","message"}` with a machine-readable
code the SPA already parses and acts on. The WebSocket upgrade answers a bare string through
`http.Error`, so the browser learns that the upgrade failed but not why, and the SPA's terminal-code
redirect cannot fire on it. Separately, when REST rejects with `reauth_required` it leaves the
session cookies in place, so the browser keeps presenting material that is guaranteed to be refused
until something else clears it.

**What this stage has to answer**

- Does the WebSocket upgrade rejection become the same JSON envelope as REST, or is the right answer
  a close frame after a successful upgrade? The handshake failing before the socket exists is what
  makes this a real question rather than a formatting choice.
- Which rejection codes should clear cookies, and which should not. `reauth_required` is the obvious
  one. `session_revoked` looks identical from the browser's side. `session_missing` may be a
  transient state during a rotate and clearing on it could turn a recoverable moment into a forced
  login.
- What the SPA does differently once the WebSocket tells it the code — and whether that duplicates
  what the private-fetch path already does.
- Whether the route guard's view of "logged in" and an API 401 are meant to agree (#55). They
  deliberately do not today; the split needs stating before anyone changes it by accident.

**Done when** the two surfaces answer with the same shape, cookie clearing has a stated rule per
code, and `websocket/server` has upgrade tests for a revoked session, an elapsed reauth window and a
failing `Touch` — not just the missing-session case it has now.

---

### Stage B — revoking more than one session

**Carries:** #21, #30, #54.

Logout revokes the session that presented itself. There is no way to revoke every session an account
holds, which is what a support request after a compromised machine actually needs, and there is no
way for a user to see what sessions exist. `sessions.md` § 14 names the gap directly.

This stage **waits on** [shared-planners](../shared-planners/plan.md) Stage E, whose one outstanding
item is the membership revocation path, described there as waiting on "the session-record work that
owns the grants ceiling". Those two are the same work seen from opposite ends: revoking a membership
has to reach every session that membership granted, and revoking every session an account holds has
to reach the same records. Building an account-wide revoke here before that lands would produce a
second sweep over the same keys.

**What this stage has to answer**

- What the store operation is: one method that revokes every session, index and refresh row for an
  account, and whether the membership path calls the same one.
- Whether a device list is a product feature or a support tool. A device list implies storing
  something identifying per session, which is a privacy decision, not just a schema one.
- Whether signout's ordering — disconnect the socket, call logout, clear the query cache — is load
  bearing, and pinning it with a test (#54) either way.

**Done when** an account's sessions can be revoked in one operation, the membership path uses it, and
the signout ordering is pinned.

---

### Stage C — what an operator sees when auth fails

**Carries:** #14, #22, #56, #11.

Session lifecycle metrics are good: starts, continuations, ends, stores and store errors, plus a
refresh duration histogram. What is missing is everything about failure. There is no counter for
rejections keyed by code, so an outbreak of `reauth_required` and an outbreak of `session_missing`
look the same from outside. There is no counter for the optimistic-locking retries in
`shared/plannersession`, which is the signal that would have shown the contention behind the incident
that motivated those CAS writes in the first place. The maintenance sweep reports nothing about what
it revoked.

Alongside that, the `503` split landed — a Redis outage is no longer misreported as a missing
session — but no operator document says what a `503` on an auth route means or what to do next.

**What this stage has to answer**

- Which counters are worth carrying, keyed how. `auth_session_reject{code}` is the obvious one; the
  cardinality is bounded by the three terminal codes plus the dependency case.
- Whether the WebSocket's existing `recordUpgradeError` reason codes and the API's rejection codes
  should be one vocabulary. They describe the same event on two surfaces.
- Whether every auth handler failure carries `session_id`, `account_id` and the flow it was in
  (#56) — this needs a pass handler by handler, not a spot check.
- Where the Redis outage runbook lives. It is operator guidance, so it promotes into live
  documentation rather than staying here.
- Whether the reauth deadline should be visible to the user at all (#11). It is already stored per
  tab and read by nothing; showing it in a settings or debug surface is cheap and makes a support
  conversation shorter, but it is a product call.

**Done when** a rejection can be counted by its cause, an auth failure log carries the identity it
concerns, and an operator hitting a `503` has somewhere to read.

---

### Stage D — what a user sees when a cloud credential dies

**Carries:** #49, #50, #42.

`refresh.go` maps the whole `user.ErrMongoStoredEsi*` family — not cloud, no row, user not found,
keyring, decrypt, persist, invalid grant — to status codes with care. None of that reaches the user
as an explanation. A cloud account whose stored ESI refresh token CCP has invalidated gets the same
blank failure as one whose keyring is misconfigured, and the two need opposite responses: one is
re-authorise, the other is tell the operator.

**What this stage has to answer**

- Which of those error classes are user-actionable, which are operator-actionable, and which are
  neither. The mapping already exists in the handler; this is deciding what each class *means*.
- How that reaches the SPA. The rotate and bootstrap responses have no field for it today, so this is
  a wire question — see § Wire compatibility.
- What happens to the other linked characters when one character's credential dies. Cloud bootstrap
  returns per-character tokens and nothing asserts they survive into the store (#50).
- How the API's deferral when CCP's token endpoint is failing lines up with the SPA's Tranquility
  gate (#42). Both exist; whether they agree has never been written down. The limiter gate's
  behaviour is already covered by `sso/refresh_route_test.go`, so this is documentation plus
  whatever that documentation exposes as a mismatch.

**Done when** a dead cloud credential produces a message the user can act on, the linked-character
path has a test, and the outage story is written in one place.

---

### Stage E — bootstrap that half-succeeds

**Carries:** #45, #43 residual, #52, #53.

Bootstrap writes Redis, verifies the session persisted, ensures the account planner, resolves owner
keys and sets grants, and only then reads the user's documents out of Mongo. If that last read fails,
the session material is already minted and verified. Nothing decides whether the cookies should still
go out. Both possible answers are defensible — the session is genuinely valid, so issuing it is
honest; but a client that gets cookies and no documents is in a state the SPA has no path out of —
and the point of this stage is that neither has been chosen.

The grants items arrive here with their premise changed. Grants are no longer a cached list of
corporation and alliance ids; [shared-planners](../shared-planners/plan.md) Stage C made them owner
keys read from membership rows, which is why the handler calls `mongo.OwnerKeysForAccount`. The
question that survives is unchanged in shape: both the resolve and the set are warn-only, so a
session can be issued carrying an empty or stale grant list, and the account silently sees nothing it
should have access to.

**What this stage has to answer**

- Whether the Mongo read moves before the Redis writes, or whether a rollback path is added, or
  whether issuing the session anyway is declared correct. Document the choice either way — the
  ordering is not obvious from reading the handler.
- Whether a failed grants resolve should fail the bootstrap rather than warn (#53). An empty grant
  list is indistinguishable from an account with no memberships, which is what makes warn-only
  dangerous here.
- What the worker's `update_account_session_grants` task is still for now that the handler resolves
  grants inline (#52), and what happens to it when JetStream is down.
- Asserting that a cloud login strips the ESI refresh secret from the response body. The policy is
  stated and unproven.

**Done when** the half-success path has a chosen behaviour and a test, and the grants failure mode is
either fatal or explicitly declared safe.

---

### Stage F — the security decisions that were never taken

**Carries:** #19, #32, #31.

Three items sat open for long enough that "open" stopped meaning anything. Each is a decision, and
each can legitimately close as declined — but it should close.

- **Planner refresh tokens are plaintext in Redis** (#19). [sessions.md](../../backend/api/auth/sessions.md)
  § 8 states this as deliberate: Redis is the trust boundary. The question is whether that still holds
  now that Mongo's refresh tokens are encrypted at rest, or whether the asymmetry is the anomaly.
- **No CSRF defence** (#32). The session cookie is `HttpOnly` and the SPA sends a per-tab
  `X-Session-ID` header that a cross-site form cannot set, which is a double-submit defence in
  everything but name. Whether it is one by design or by accident is the question, and whether the
  cookie-only path leaves a hole.
- **A reauth window fixed at seven days** (#31). Making it vary by scope is only worth anything if
  there is a scope that deserves a different number.

**Done when** each has an answer recorded in this file, and the ones that survive have a stage.

---

## Wire compatibility

Assessed for every stage that could touch a client-visible surface.

| Change | Class | Note |
|--------|-------|------|
| WebSocket upgrade rejection body becomes JSON (Stage A) | **Additive in practice** | The SPA's `parsePlannerAuthCodeFromText` already reads a code out of either a JSON body or a bare string, so a JSON body is understood by clients that predate the change. Anything else reading the upgrade body would see a changed string. |
| Clearing cookies on a rejection code (Stage A) | **Additive** | A `Set-Cookie` on a 401 that carried none before. |
| Account-wide revoke endpoint (Stage B) | **Additive** | A new route. |
| New counters and log fields (Stage C) | **Additive** | Telemetry only. |
| A credential-failure reason on the rotate and bootstrap responses (Stage D) | **Additive** | A new optional field; older clients ignore it. |
| Failing bootstrap where it currently warns (Stage E) | **Breaking** | A client that gets a session today would get an error. Needs the decision recorded before it is written. |
| Dropping `omitempty` from the bootstrap response's `user_document` and `application_settings` (the `go fix` suggestion in `session_types.go`) | **Breaking** | Both fields would always be emitted. Not to be applied as a modernisation — see [current-state.md](./current-state.md) § Go modernisation in the touch surface. |

Nothing in this project changes a Redis key layout, a cookie name, or a persisted document shape.

## Done when

- Every stage above has either landed or closed with a recorded decision.
- The behaviour facts held in [overlay.md](./overlay.md) have promoted into live documentation.
- Nothing in the live tree points at a retired auth roadmap.

## Promote

The retired roadmap was removed when this project was created, because a planning document in the
live tree is itself the defect this project was opened to clean up. What it carried that is worth
keeping is held in [overlay.md](./overlay.md) and promotes as follows.

1. § Session window invariants → [backend/api/auth/overview.md](../../backend/api/auth/overview.md),
   which already documents the reauth deadline but not the rule that a rotate must not slide it.
2. § Auth test coverage → [testing/services/api.md](../../testing/services/api.md) and
   [testing/services/websocket.md](../../testing/services/websocket.md), in the coverage-map shape the
   testing documentation rules prescribe.
3. The Redis outage runbook produced by Stage C → wherever backend operational guidance lands; it is
   operator-facing, so it does not stay in this folder.

Then delete this folder and its row in [`../contents.md`](../contents.md).

## Recommended pickup order

1. **Stage E** — smallest, and it settles the two handlers everything else edits.
2. **Stage A** — the largest single inconsistency, and the one a user can actually hit.
3. **Stage C** — makes the rest measurable, and the runbook is owed regardless.
4. **Stage D** — independent; can run alongside any of the above.
5. **Stage B** — once shared-planners Stage E lands.
6. **Stage F** — decisions, whenever there is appetite to take them.
