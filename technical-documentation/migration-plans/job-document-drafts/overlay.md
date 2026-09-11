# Job document drafts — behaviour overlay

How the job document and the edit page behave **while this project is in flight**. On overlap with live
SoT, this file wins for the surfaces below until the project promotes.

Nothing has landed. A job document still carries every field it carries today, and the edit page still
rebuilds a `Job` instance on every change, as [plan.md](./plan.md) § Starting position describes.

## Stage 1 — The removals

*Not landed.*

`rawData` is still stored on every job document, the four derived setup figures are still persisted
beside the fields they are derived from, and `materialPriceOverrides` still sits under `layout`.

Owed here: what a job document carries after the removals, where a caller that read `rawData` from the
document gets it instead, and when a derived setup figure is now computed.

## Stage 2 — The reshape, in the release window

*Not landed.*

Every row collection except `build.setup` is still an array addressed by index.

Owed here: the document's shape after the rewrite, which release mechanism performs it and where that
sits relative to the window, what it reports on a dry run, and which copy `revertRelease` puts back.

## Stage 3 — Base, log, scratch and draft in the editor

*Not landed.*

The edit page still holds one `Job` instance in a reducer, still marks the whole job modified on any
change, and still keeps a second copy of the job in a ref for discard.

Owed here: what the draft store holds, how a component subscribes to part of a job, what one undo step
is, what separates a change from a what-if and what each is allowed to reach, what the `Job` lens is
still used for, what happens to a reader's edits when another member's change arrives, and which surfaces
show uncommitted changes and which show what is committed. Also owed: what a member without the lock can
do, and what their draft is reviewed against when the lock frees.

## Stage 4 — Getters become functions

*Not landed.*

Derived figures are still getters on `Job`, and reading one still requires an instance.

Owed here: which figures have moved, what a converted panel reads instead, and what is still reached
through the lens.

## Stage 5 — `jobArray` goes plain and the lens is deleted

*Not landed.*

`jobArray` still holds `Job` instances, the inbound coalescer still reconstructs them on delivery, and
`toDocument()` is still the persistence contract.

Owed here: what the store holds, how a job reaches the save path, and confirmation that the lens is gone
rather than kept as a wrapper.
