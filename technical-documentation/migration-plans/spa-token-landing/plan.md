# Plan — SPA token landing

**Rules:** Read and following [`../documentation-rules.md`](../documentation-rules.md)
and [`../technical-rules.md`](../technical-rules.md) (migration-plans).
Phase 1 (project folders/docs) before any product work.
Go surfaces in scope are `services/shared/plannersession/request` and whatever the merge touches in
`services/api`; `go fix -diff` runs on those packages only, after the conflicts are resolved rather
than before, because the files do not exist in their merged form until then.
Live SoT will not be edited until this project is complete and promotion is approved.

## Why this project exists

`spa-token-acquisition` finished. It rebuilt SPA token acquisition around a credential provider,
deleted the React-mounted refresh clocks, fixed the stuck-session defect, promoted its documentation
into live SoT and deleted its own project folder — everything the migration rules ask for. It then sat
on its own branch, unmerged into `Development` or anywhere else.

Meanwhile `feature/shared-planners` moved the planner session kernel out of `services/api` into
`services/shared/plannersession`, promoted *its* documentation into the same files, and retired the
auth roadmap in favour of [auth-hardening](../auth-hardening/contents.md).

Two finished projects, two promoted documentation trees, one set of files. Neither branch is wrong and
neither is behind; they are divergent. Landing one on the other is real work with real decisions, and
it is invisible from either branch — which is how it went unnoticed long enough for the SPA token work
to be assumed merged. That is what this project tracks.

The measured conflict surface is in [current-state.md](./current-state.md).

## Two orders, and which to take

**Merge `spa-token-acquisition` into `Development` first.** It is clean — `Development`'s tip is the
branch's own base — so this costs nothing and immediately makes the work visible to every other
branch. The reconciliation then happens once, when `feature/shared-planners` merges, against a
`Development` that already contains it.

**Or merge it directly into `feature/shared-planners`.** This pays the 15 conflicting files now, on a branch
that is still moving, and pays them again in a different shape when `shared-planners` reaches
`Development`.

**Take the first.** The only argument for the second is wanting the SPA token behaviour available
while shared-planners work continues, and shared-planners does not depend on it. The one thing the
first order does *not* defer is the auth roadmap decision — that has to be settled whenever the two
meet, and it is settled below.

## Stages

### Stage A — land it on `Development`

**Open.** The merge is a fast-forward — `Development`'s tip is the branch's own base — but it is
eleven commits of code, and code reaches `Development` through a pull request here rather than a
direct push. Open one from `spa-token-acquisition` into `Development`.

Compare: <https://github.com/darcy561/eve-industry-planner/compare/Development...spa-token-acquisition>

Done when: `Development` contains `eb7e6d29`, `origin/Development` matches, and the branch is deleted
locally and on origin. Keep the branch until then — Stage B is already merged on
`feature/shared-planners`, so nothing depends on the ref, but it is the pull request's head.

### Stage B — reconcile the session code — **landed**

The three code conflicts that carry meaning, in order of difficulty.

**The coded refusal.** Re-apply `81b6d9ea`'s substance — the three client-facing code constants and the
coded JSON body for an unrecoverable refresh — to
`services/shared/plannersession/request/failure.go`, under that file's current names (`SessionError`,
`ExtractSession`). Do not restore `services/api/helper/auth/auth_helpers.go`; it was deleted
deliberately when the session kernel moved so that `core`, `worker` and `websocket` could reach
sessions without importing a service. No forwarding shim is left in `api/helper/auth`.

**`App.jsx`.** Take spa-token's side: it removes the `useRefreshESITokens()` call, and on this lineage
the hook still exists and is still called. The hook file and the clock actions in `tokenActions.js` go
with it, exactly as the branch deleted them.

**`signout.jsx` and the shared test fixtures.** Both sides edited these for unrelated reasons — realtime
work on one, colocated tests on the other. These are unions, read rather than picked. `vite.config.js`
is **not** one of them: this branch's version is already correct, and the settings the incoming side
appears to add have either landed here under another name or were deliberately removed — check what
removed a line before restoring it, and see [current-state.md](./current-state.md) § The conflict
surface.

Then read the four files that auto-merged: `middleware/auth.go`, `v1endpoints/refresh.go`,
`applyPrivateHeaders.js` and `cloud_esi_maintain.go`. A clean textual merge of two independent edits to
one handler is where a semantic break hides, and all four are on the auth path.

Done when: the merged tree builds, `services` tests pass, the SPA test suite passes, and `go fix -diff`
on the touched packages is empty.

### Stage C — reconcile the documentation — **landed**

Eight documentation files conflict, none of which is a disagreement about fact — each side promoted a
real project into the same files without seeing the other's rows.

- `testing/services/api.md`, `shared.md`, `worker.md` — union. Both sides added the suites they wrote.
- `backend/api/auth/overview.md` and `sessions.md` — shared-planners is authoritative on the backend
  shape; re-apply anything spa-token added about the SPA's side.
- `frontend/contents.md` and `migration-plans/contents.md` — each side both added and removed rows.
  Resolve row by row, then check that every row still points at something that exists.
- `backend/api/auth/roadmap.md` — **the deletion wins.** The branch's edits describe a lineage that no
  longer exists here. The substance worth keeping is about the SPA and belongs in
  `frontend/auth/spa.md`, which that branch already rewrote. Reasoning:
  [current-state.md](./current-state.md) § The auth roadmap is a special case.

Done when: no `contents.md` row points at a missing folder, and no document describes a file that the
merge deleted.

### Stage D — re-verify what the merge invalidates

The audit behind [auth-hardening](../auth-hardening/contents.md) was taken against
`feature/shared-planners` alone. The merge changes some of its inputs, and the affected verdicts must
be re-checked rather than assumed:

- **Stage A shrinks.** `81b6d9ea` already gives the REST half a coded body, so what remains is the
  WebSocket upgrade's plain-text rejection and the cookie-clearing question.
- **The frontend verdicts** — items #8, #9, #10, #11, #16, #54, #55 — were checked against a
  `Functions/Auth/` tree that the merge largely rewrites. `signout.jsx` in particular gains a test on
  the incoming side, which may close #54 outright.
- **`overlay.md` § Auth test coverage** may already be promoted: the branch adds
  `testing/frontend/auth.md` as the first depth topic under `testing/frontend/`, which is one of the
  places auth-hardening planned to promote into.

Done when: auth-hardening's `current-state.md` and `overlay.md` describe the merged tree, and any item
the merge closed is moved out of "still open".

## Wire compatibility

**Additive.** `81b6d9ea` adds a `code` field to a 401 that previously carried an uncoded plain-text
body. No status, route or success shape changes, and a client that ignores the field behaves exactly
as it does today. Nothing else in the merge alters a request or response shape, a Redis key, a cookie
name or a persisted document shape.

The one thing to watch is ordering rather than compatibility: the SPA on the incoming side expects the
coded body, so the API must not be rolled back beneath a deployed SPA that relies on it.

## Done when

- `Development` carries the SPA token work and the branch is gone. **Open** — Stage A.
- `feature/shared-planners` has reconciled with it, on the terms in Stage B and Stage C. **Done.**
- auth-hardening reflects the merged tree. **Open** — Stage D.

## Promote

There is little to promote — both sides already promoted their own work, and this project's job is to
stop them contradicting each other. What promotes is whatever [overlay.md](./overlay.md) records as a
reconciled shape that neither side's live document currently states, principally the coded refusal in
its new home.

Then delete this folder and its row in [`../contents.md`](../contents.md).
