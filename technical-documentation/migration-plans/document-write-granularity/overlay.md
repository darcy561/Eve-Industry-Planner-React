# Document write granularity — behaviour overlay

How the write path behaves **while this project is in flight**. On overlap with live SoT, this file
wins for the surfaces below until the project promotes.

Nothing has landed. Every write is still a whole document, as [plan.md](./plan.md) § Starting position
describes.

## Stage A — A version on the document, and a write that checks it

*Not landed.*

Owed here: where the version lives, what a refused write answers with, and what an unversioned
document means to a write that expects one.

## Stage B — Field-scoped writes

*Not landed.*

Owed here: how the SPA tracks what changed through the persist debounce and the outbound coalescer,
and what the write endpoint accepts.

## Stage C — Delta delivery and client apply

*Not landed.*

Owed here: what a delta message carries, how a client applies it onto the document it holds, and what
happens when a client detects a gap.
