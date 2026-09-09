# Document defaults — overlay

What changed and how each part works **after** the change. Live docs remain the truth wherever this
file has no entry. Fill a section as its slice lands; do not pre-write behaviour that has not shipped.

Promote target on go-ahead: [backend/](../../backend/contents.md) and
[frontend/](../../frontend/contents.md).

## Track A — The server decides a document's shape

### A1 — The upgrader on the read path

_Not started._ Record here: which read paths call it, and what a caller now sees that it did not.

### A2 — Defaults and aliases in the upgrader

_Not started._ Record here: the defaults the server now owns, the schema step they landed as, and what
the SPA constructor kept.

### A3 — What an unset field means

_Not started._ Record here, per field: the default it carries or the tag that keeps it absent.

## Track B — The extras category id space

### B1 — Slug ids

_Not started._ Record here: the id map as run, and where the slug is stated on each side.

### B2 — Convergence

_Not started._ Record here: the schema version it landed as, the release order, and what the parity
sweep reported afterwards.
