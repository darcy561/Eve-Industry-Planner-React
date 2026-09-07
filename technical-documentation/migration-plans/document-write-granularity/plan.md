# Document write granularity — plan

Read and followed for this plan: [`../documentation-rules.md`](../documentation-rules.md) and
[`../technical-rules.md`](../technical-rules.md), plus the root masters they defer to, and — for the
surfaces this plan names — [`../../frontend/technical-rules.md`](../../frontend/technical-rules.md)
and [`../../backend/technical-rules.md`](../../backend/technical-rules.md).

Live SoT will not be edited until this project is complete and promotion is approved.

## Goal

A change to a document is written, carried and applied as **what changed**, so that two people editing
different parts of one document both keep their edit, and a client can rebuild a document from an
ordered stream of changes rather than from a sequence of whole-document replacements.

## Starting position

`BulkUpsertJobs` writes `"$set": job` — the entire document, every field, on every save. Every other
document write of this kind does the same. That has always been the shape, and on a single-user
account it is invisible: one writer replacing their own document with their own newer copy loses
nothing.

It stops being invisible under two conditions, which arrive together:

**Two writers.** Two members editing different fields of one job both send the whole document, so the
second write overwrites the first's field even though neither touched what the other changed. This is
last-write-wins decided at the writer, and no delivery guarantee corrects it — ordering the two writes
correctly still loses one.

**Delivery that can reorder.** Because each message carries the whole document, a message that
overtakes another loses *everything* in the one it passed rather than a single field. The blast radius
of a reorder is the document.

## What this project inherits

This project exists because [shared-planners](../shared-planners/plan.md) § Stage G found the write
shape while fixing realtime consistency. The items below are **that project's decisions, not this
one's**, and they may still move. Anything here that depends on them is written as an assumption to
re-verify rather than as settled fact — when Stage G changes, this plan is updated in the same pass.

| Inherited | Where it is decided | What this project assumes |
|-----------|---------------------|---------------------------|
| Per-owner delivery ordering | Stage G § Ordering is a construction, not a token | That ordering is solved before deltas land; a delta stream is worth less than nothing if applied out of order |
| The position token on the wire | Stage G | That a client can say where it is, so a gap in a delta stream is detectable rather than silent |
| The owner-scoped baseline | Stage G | That a client can fetch a document set and a position together, which is what a delta stream is applied *onto* |
| `session_resume` answering from position | Stage G | That a reconnecting client is told what it missed, rather than asserting it missed nothing |

The dependency runs one way. Shared planners does not wait on this project: its obligation is to stop
losing writes *silently*, which the position token achieves on its own. This project decides whether
the loss can be avoided rather than merely seen.

## The delta is already there

The change stream requests `updateDescription` and `FullDocumentBeforeChange`, and parses
`updatedFields` and `removedFields`. Both are used for one thing: suppressing a schema-maintenance
update so it does not reach a browser as a change.

So the capture exists and the delta is discarded. It would also be useless as things stand — a
`$set: job` marks every field as updated, so `updatedFields` is the whole document under another name.
The delta only becomes meaningful once the write that produced it is field-scoped, which is why the
write shape is the first stage rather than the transport.

`previousDocument` already reaches the SPA on the wire, so a before-image is available where the
collection supports it.

## What a conflicting write is answered with

Three options, and the choice decides how much of this project is needed. They are listed cheapest
first; the cheapest is a real answer, not a fallback.

**A conditional write.** Keep whole-document writes and refuse one whose base version is not current,
answering the client with the current document. Nothing is lost silently, and the client decides what
to do. This needs a version on the document and a compare on the write — no dirty tracking, no delta
transport, no client apply path. The document lock already exists to make the conflict rare, so the
refusal is an edge case rather than a routine outcome.

**Field-scoped writes, whole-document delivery.** The write sets only the paths that changed, so two
members editing different fields both keep their edit. Delivery still carries the whole document, so
the client keeps replacing. This is the smallest change that fixes the *product* problem, and it makes
`updatedFields` meaningful for the first time.

**Field-scoped writes and delta delivery.** As above, and delivery carries the changed paths so a
client applies rather than replaces. This is what makes a client able to rebuild a document from an
ordered stream, and it is the only option that reduces payload size as a side effect.

The third is the destination the goal describes. The first is worth taking on its own if the second
and third turn out to be expensive, because it converts silent loss into a visible refusal — which is
the property that actually matters.

## Stages

Named after Phase 1, and deliberately ordered so each is worth landing alone.

### Phase 1 — Project folder and docs

This folder, its `contents.md`, this plan, the overlay scaffold, and the row in the section
[`contents.md`](../contents.md). No code.

### Stage A — A version on the document, and a write that checks it

The conditional write above. Establishes that a write can be refused, and gives every later stage a
version to reason about.

### Stage B — Field-scoped writes

Dirty tracking through the SPA persist path, and an API that sets only the paths it was given. This is
where the work is: the persist debounce and the outbound coalescer both assume a whole document today.

### Stage C — Delta delivery and client apply

`updatedFields` / `removedFields` on the wire, and a client that applies onto the document it holds.
Depends on the ordering token from shared-planners Stage G being in place, per § What this project
inherits.

## Wire compatibility

| Surface | Change |
|---------|--------|
| Job write endpoint | **migrate-required** at Stage B — a body of changed paths is not a body of a whole document. Additive if the endpoint accepts both while the client is converted |
| Document version field | additive at Stage A — absent means unversioned, and an unversioned write is accepted as it is today |
| Realtime document payload | additive at Stage C — a message carrying changed fields beside the full document lets a client choose; removing the full document is the breaking half and is separable |
| Stored documents | no migration. A field-scoped write produces the same document a whole-document write does |

## Done when

- Two people editing different fields of one document both keep their edit.
- A write that cannot be applied safely is refused and answered, never silently overwritten.
- A client can apply an ordered stream of changes onto a document it holds and arrive at the same
  document a fresh read would give it.
- No write path sets fields it was not asked to change.

## Open questions

- **Which documents.** Jobs are the case that motivates this. Whether groups, settings and the
  archive follow, or stay whole-document because they have one writer, is not answered here.
- **Where the version lives.** `_meta` already carries `lastModified` and the owner block; whether the
  version is a counter beside them or the position token from shared-planners Stage G is a decision
  Stage A takes.
- **What the client does with a refusal.** Retry against the current document, surface a conflict, or
  merge — a product decision this plan records rather than settles.

## Stage status

| Stage | Status |
|-------|--------|
| Phase 1 — project docs | Complete |
| A — a version and a conditional write | Not started |
| B — field-scoped writes | Not started |
| C — delta delivery and client apply | Not started. Depends on shared-planners Stage G |
