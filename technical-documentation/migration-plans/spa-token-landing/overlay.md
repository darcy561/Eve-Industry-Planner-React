# Overlay — the reconciled shapes

Both branches promoted their own work into live documentation, so most of what this project produces
is agreement between documents that already exist rather than new behaviour. This file records the
shapes that neither side's live document states today, and fills in as stages land.

Where this file and live documentation disagree, this file wins for the surfaces it names. Everywhere
else, live documentation is the truth.

## The coded refusal, in its new home — **landed**

Two facts are each true on one branch and neither is true anywhere together.

`spa-token-acquisition` established that a session refresh which the client cannot retry out of — a
refresh token that is not in Redis, cloud ESI material that is missing or refused — answers with the
same coded JSON body the reauth path already used. Before that, those answers were plain text with no
`code`, and the SPA could not distinguish them from a transient failure: it kept the dead credential
and retried on every subsequent private request without ever reaching a login. It also lifted the
three client-facing codes into constants, because the same strings were being repeated across the
handler, the middleware and the log classification.

`feature/shared-planners` established that this code does not live in `services/api` at all. The
session kernel, the request-side reading and the failure classification moved to
`services/shared/plannersession`, so that `core`, `worker` and `websocket` reach sessions through a
shared package rather than importing a service — a boundary `testing/serviceboundaries` now guards.

A third fact arrived between the plan being written and the merge being taken: auth-hardening Stage A
made `sessionreq.WriteCodedError` in `services/shared/plannersession/request/response.go` the single
writer of a planner auth refusal, deleting `middleware/auth.go`'s `writeAuthError`,
`refresh.go`'s `writeRefreshAuthError` and the websocket upgrade's plain-text `http.Error`. The
incoming branch's own coded-body helper would have been a fourth copy of the same struct, which is the
drift that stage was opened to remove.

Reconciled, the codes are constants in `services/shared/plannersession/request/failure.go` — where the
`SessionError` type and `ExtractSession` already classify failures — and every refusal is written
through `WriteCodedError`. `services/api/v1endpoints/auth_client_log.go` keeps
`respondSessionRefreshTerminalAuthError`, which pairs the failure log with the refusal the way its
siblings do, but it now calls the shared writer rather than a local one.
`services/api/helper/auth` keeps nothing of the change: the file it was originally written in was
deleted when the kernel moved, and a finished cutover leaves no forwarding wrapper behind.

The consequence the SPA depends on: **every 401 from the session endpoints carries a `code`**, and the
absence of one is not a category the client has to handle.

## What the documentation tree looks like afterwards — **landed**

`frontend/auth/spa.md` is the incoming rewrite, organised around subjects rather than a file
inventory, and it is the SPA auth SoT. `backend/api/auth/overview.md` and `sessions.md` keep the
shared-planners backend shape and gain the incoming side's coded status rows.

`overview.md` loses its file index. It listed both halves of the tree, so it duplicated `sessions.md`
§ Files for the backend and `frontend/auth/spa.md` for the SPA, and its frontend half named four
modules this merge deletes. The backend list survives in `sessions.md`, which is where server-side
detail belongs.

Three inbound links to `backend/api/auth/roadmap.md` were left behind when that file was deleted for
[auth-hardening](../auth-hardening/contents.md) — two in `overview.md`, one in `sessions.md`. The
merge makes the deletion final on both lineages, so they are removed rather than repointed: the
backlog they promised is auth-hardening's, and a live topic doc does not link a migration project.

`testing/frontend/auth.md` arrives as the first depth topic under `testing/frontend/`, replacing the
placeholder. That is one of the destinations [auth-hardening](../auth-hardening/overlay.md) planned to
promote its SPA coverage rows into, so the two need reading together rather than in sequence.

## Stage records

### Stage A — land it on `Development`

**Open, and re-decided.** The fast-forward was confirmed — `Development`'s tip `21b5af25` is the
branch's own base, so nothing needs reconciling there. It is not being pushed directly: eleven commits
of code reach `Development` through a pull request, as code changes do here, and only documentation
goes straight onto the branch. The branch is kept until that lands.

Landing it on `Development` first was, in the event, not what happened either. The reconciliation was
taken on `feature/shared-planners` directly, because that is where the SPA token behaviour was wanted
while shared-planners work continues. The cost the plan predicted for that order — paying the
conflicts again in a different shape when `shared-planners` reaches `Development` — is now bounded by
the merge commit recording the resolution, so the second meeting is a fast-forward of an already
merged history rather than a fresh reconciliation.

### Stage B — reconcile the session code

**Landed.** 19 files conflicted rather than the 15 measured: `frontend/auth/spa.md` and
`frontend/lifecycles/roadmap.md` were described in `current-state.md` but not counted, and
`middleware/auth.go` and `refresh.go` stopped auto-merging once auth-hardening Stage A landed on them.

Resolutions that carried a decision:

- **The coded refusal** — as recorded above: the shared writer, one set of constants, no fourth copy.
  `extract.go`'s three remaining string literals were folded onto the constants, since leaving
  literals beside the constants that name them is the drift the incoming commit set out to end.
- **`live_session_rotation_test.go`** — the incoming end-to-end rotate suite was ported to the moved
  package rather than dropped. It covers the stuck-session defect directly: rotating twice with the
  same token must answer `session_revoked`, which nothing on this lineage asserted.
- **`App.jsx`** — the incoming deletion of `useRefreshESITokens()`, keeping the maintenance-mode lines
  HEAD added beside it.
- **`signout.jsx`** — the shared-planners structure wins. It had already become a `beforeLoad`
  navigation guard, which the incoming side still had as a mounted component; the incoming side's one
  substantive addition, `esiCredentials.reset()`, was kept. `logoutServerSession` went with
  `serverTokens.js`, so the guard now calls `logoutPlannerSession`.
- **`vite.config.js`** — resolved to this branch's version whole, leaving the file unchanged by the
  merge. The plan called for keeping all four settings, on the reading that `clearMocks: true` had
  been dropped as collateral of the `vmThreads` change. It had not: `4db5f180` removed it on purpose
  because Vitest 5 makes `true` the default, and the commit says so. Restoring it would have
  reintroduced a line that restates a default — which is worse than noise, because the next reader
  cannot tell whether it is load-bearing. The lesson generalises to the rest of this merge: find the
  commit that removed a line before treating its absence as loss.

Verified: both Go modules build and vet clean, `services` tests pass, `testing/serviceboundaries`
passes, and the SPA suite is 1013 tests across 139 files, all passing. `go fix -diff` on the three
packages touched (`shared/plannersession/request`, `api/middleware`, `api/v1endpoints`) reports the
same suggestions it reported before the merge, in `authenticate.go` and `refresh.go` composite
literals that this work does not touch — so the merge adds no modernisation debt, and none was taken.

### Stage C — reconcile the documentation

**Landed.** The three `testing/services/*.md` files are unions, as expected. `frontend/contents.md`
and `migration-plans/contents.md` were resolved row by row against what actually exists in the merged
tree: the incoming side's `observability-consolidation` row was not taken, because that project
promoted and its folder is gone here, while its `maintenance-mode` row was, because the merge brings
that folder in.

`spa-token-acquisition/` is deleted along with its row. The incoming branch promoted it and deleted it
there; this lineage had re-added the plan and never implemented it. Nothing outside the folder cited
it.

### Stage D — re-verify what the merge invalidates

Not started.
