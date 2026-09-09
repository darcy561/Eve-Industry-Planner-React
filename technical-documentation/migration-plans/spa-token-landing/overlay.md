# Overlay — the reconciled shapes

Both branches promoted their own work into live documentation, so most of what this project produces
is agreement between documents that already exist rather than new behaviour. This file records the
shapes that neither side's live document states today, and fills in as stages land.

Where this file and live documentation disagree, this file wins for the surfaces it names. Everywhere
else, live documentation is the truth.

## The coded refusal, in its new home — **planned**

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

Reconciled, the constants and the coded refusal live in
`services/shared/plannersession/request/failure.go`, alongside the `SessionError` type and
`ExtractSession` that already classify the other three failures. `services/api/helper/auth` keeps
nothing: the file the change was originally written in was deleted when the kernel moved, and per the
repository's rules a finished cutover leaves no forwarding wrapper behind.

The consequence worth documenting once it lands is the one the SPA depends on: **every 401 from the
session endpoints carries a `code`**, and the absence of one is not a category the client has to
handle. Today that is true of the reauth path only.

## What the documentation tree looks like afterwards — **planned**

Fills in at Stage C. The expected shape is that `frontend/auth/spa.md` — rewritten on the incoming
side around subjects rather than a file inventory — becomes the SPA auth SoT unchanged, while
`backend/api/auth/overview.md` and `sessions.md` keep the shared-planners backend shape and gain
whatever the incoming side said about the SPA's half of a flow.

`testing/frontend/auth.md` arrives as the first depth topic under `testing/frontend/`, replacing the
placeholder. That is one of the destinations [auth-hardening](../auth-hardening/overlay.md) planned to
promote its SPA coverage rows into, so the two need reading together rather than in sequence.

## Stage records

### Stage A — land it on `Development`

Not started.

### Stage B — reconcile the session code

Not started.

### Stage C — reconcile the documentation

Not started.

### Stage D — re-verify what the merge invalidates

Not started.
