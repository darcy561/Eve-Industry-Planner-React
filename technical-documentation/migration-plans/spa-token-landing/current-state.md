# Current state — two finished branches that have never met

Measured on 2026-09-09 by trial-merging `spa-token-acquisition` into each target in a throwaway
worktree. The numbers below are what git actually reported, not an estimate.

## Where the work is

| Branch | Tip | Carries the SPA token work |
|--------|-----|----------------------------|
| `spa-token-acquisition` (local and `origin/`, identical) | `eb7e6d29` Promote the SPA authentication documentation | yes — 11 commits |
| `Development` (local) | `21b5af25` Add the SPA token acquisition plan | no |
| `origin/Development` | `1dfaf0a3` Add the maintenance mode plan | no |
| `Public` / `origin/Public` | — | no |
| `feature/shared-planners` (local and `origin/`, identical) | `4a2772b3` Promote the planner session move | no |

The branch is pushed, so nothing is at risk. `Development` is one commit ahead of `origin/Development`.

The eleven commits run from `81b6d9ea` "Answer an unrecoverable session refresh with a code" through
the credential provider, the fetcher conversion, the clock deletion and the prefetch module, ending at
the promote. The promote deleted the `spa-token-acquisition` project folder, deleted
`frontend/lifecycles/roadmap.md`, removed both rows from their `contents.md` files and rewrote
`frontend/auth/spa.md` — all correct, and all invisible from any other branch.

## The conflict surface

Merging into `Development` is **clean** — `Development`'s tip is the branch's own base, so there is
nothing to reconcile.

Merging into `feature/shared-planners` conflicts in **15 files** — 7 code, 8 documentation. That is
where the whole cost sits, because both branches have been promoting into the same documentation tree
and editing the same auth code from opposite directions.

### Code

| File | Kind | Authority |
|------|------|-----------|
| `services/api/helper/auth/auth_helpers.go` | modify/delete | **shared-planners.** The file was deleted when sessions moved to `services/shared/plannersession`. The spa-token change to it must be re-applied at the new home, not restored here — see below. |
| `services/shared/plannersession/request/failure.go` | content, against `auth_session_log.go` | **Both.** shared-planners owns the file's location and type names; spa-token owns the substance being added. |
| `frontend/src/App.jsx` | content | **spa-token.** It removes the `useRefreshESITokens()` call that shared-planners still has. |
| `frontend/src/routes/signout.jsx` | content | **spa-token**, checked against shared-planners' realtime changes. |
| `frontend/src/tests/utils.js` | content | **Both** — shared test helpers grew on each side. |
| `frontend/vite.config.js` | content | **Both**, and the union matters. Each side independently made the same `tests/` → `src/tests/` colocation change, so those hunks agree. What differs: shared-planners has `import.meta.dirname` in place of `__dirname` and adds `pool: "vmThreads"` / `maxWorkers: 4`, and in doing so **drops `clearMocks: true`**, which spa-token still carries. Resolving by taking either side whole loses something; keep all four. |
| `frontend/src/Components/Archived Jobs/ArchivedJobsList.integration.test.jsx` | content | **shared-planners.** spa-token's edit is only the import-path depth fix from `ad1eb8ed`, which shared-planners already carries alongside an added test — so taking its side whole loses nothing. |

`services/api/middleware/auth.go`, `services/api/v1endpoints/refresh.go`,
`frontend/src/Functions/Endpoints/Private/applyPrivateHeaders.js` and
`services/worker/tasks/maintenance/cloud_esi_maintain.go` all auto-merged. They are the files most
worth reading afterwards anyway: a clean textual merge of two independent edits to the same handler is
exactly where a semantic break hides.

### Documentation

| File | Authority |
|------|-----------|
| `backend/api/auth/overview.md` | **shared-planners**, then re-apply anything spa-token added about the SPA's side |
| `backend/api/auth/roadmap.md` | **Neither — the file is gone.** See below. |
| `backend/api/auth/sessions.md` | **shared-planners** |
| `frontend/contents.md` | **Both** — each side removed a different row |
| `migration-plans/contents.md` | **Both** — each side added and removed different rows |
| `testing/services/api.md`, `shared.md`, `worker.md` (three files) | **Both** — each side added the suites it wrote |

### The auth roadmap is a special case

`spa-token-acquisition` *edits* `backend/api/auth/roadmap.md`. On `feature/shared-planners` that file
has been **deleted**, and its still-relevant content rebuilt as
[auth-hardening](../auth-hardening/contents.md). The merge therefore raises it as a conflict — and
after the deletion is committed it becomes a modify/delete.

**The deletion wins.** The branch's edits to it describe a lineage that no longer exists here: they
cite `migration-plans/authz-hmac/` (now `entity-id-encryption`), `UpdateAccountSessionGrants`,
`auth_helpers.go` and `session_cleanup.go`, none of which survive the planner session move. Taking
that side would reintroduce a stale planning document into live SoT, which is the defect
auth-hardening was opened to remove.

What must not be lost is the *substance* of those edits, which is accurate about the SPA: the
`esiCredentials` provider replacing `tokenActions` as the ESI access-token owner, and
`plannerSessionActions.js` replacing `useRefreshESITokens.js` as the session upkeep host. That belongs
in `frontend/auth/spa.md` — which the branch already rewrote — not in a roadmap.

## The coded refusal has moved house

The most interesting conflict is the smallest. Commit `81b6d9ea` made an unrecoverable session refresh
answer with the same coded JSON body the reauth path already used, so the SPA can tell "start a full
EVE SSO login" from "try again later", and lifted the three client-facing codes into constants rather
than string literals repeated across the handler, the middleware and the log classification.

It made that change in `services/api/helper/auth/auth_session_log.go`. On `feature/shared-planners`
that code lives in `services/shared/plannersession/request/failure.go`, the type is `SessionError`
rather than `AuthSessionError`, and the entry point is `ExtractSession` rather than
`ExtractAccountSession` — because the session kernel moved out of `api` so that `core`, `worker` and
`websocket` could reach it without importing a service.

So this is not a side to pick. The behaviour is wanted and the location is wanted, and they come from
different branches: the constants and the coded refusal are re-applied to `failure.go` under its
current names. Per the repository's rules on finishing cutovers, no compatibility shim is left behind
in `api/helper/auth`.

This also lands on [auth-hardening](../auth-hardening/plan.md) Stage A. That stage was scoped against a
`refresh.go` that answers `Invalid token` as plain text with no code; `81b6d9ea` already fixes the REST
half. Stage A shrinks to the WebSocket upgrade and the cookie-clearing question.

## Two promoted documentation trees

Eight of the fifteen conflicting files are documentation, and none of them is a disagreement about
fact. Each side promoted a real project into the same files and neither saw the other's rows. The
`testing/services/*.md` conflicts are the clearest case: both branches added the suites they wrote, so
the resolution is the union, not a choice.

The two `contents.md` files need care rather than union. Each side both added and removed rows, and a
row pointing at a folder that no longer exists is a defect the rules name explicitly.
