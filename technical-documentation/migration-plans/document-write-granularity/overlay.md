# Document write granularity — behaviour overlay

How the write path behaves **while this project is in flight**. On overlap with live SoT, this file
wins for the surfaces below until the project promotes.

Nothing has landed. Every write is still a whole document, as [plan.md](./plan.md) § Starting position
describes.

## Stage A — A version on the document, and a write that checks it

*Not landed.*

Owed here: where the version lives, what a refused write answers with, and what an unversioned
document means to a write that expects one.

## Stage B — A refused write is an outcome the UI handles

*Not landed.*

Every refused write still reports as a success, the client's own gate still discards edits without
telling anyone, and the retry queue still replays whatever `jobArray` holds at flush time — as
[plan.md](./plan.md) § A refused write is not currently an outcome describes.

Owed here: what a caller learns from a write that was refused, what happens to the edits it carried,
and what the retry queue replays.

## Stage C — Field-scoped writes

*Not landed.*

Owed here: how the SPA tracks what changed through the persist debounce and the outbound coalescer,
and what the write endpoint accepts.

## Stage D — The lock stops being broad

*Not landed.*

The group lease still stands in for every job in it, a batch is still refused whole, and every write
path still consults the lock.

Owed here: what the group lock covers once it stops covering member jobs, what a write path does with
the lock after it stops gating, and which of the lock's Redis machinery survives.

## Stage E — Delta delivery and client apply

*Not landed.*

Owed here: what a delta message carries, how a client applies it onto the document it holds, and what
happens when a client detects a gap.
