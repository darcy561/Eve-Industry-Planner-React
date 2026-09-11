# Effect-driven state synchronisation — plan

**Rules:** Read and following [`../documentation-rules.md`](../documentation-rules.md) and
[`../technical-rules.md`](../technical-rules.md) (migration-plans), plus the root masters they defer
to, and — for the surfaces this plan names — [`../../frontend/technical-rules.md`](../../frontend/technical-rules.md).
Phase 1 (project folder and docs) before any further product work.
No Go surfaces are in scope, so `go fix -diff` does not apply.
Live SoT will not be edited until this project is complete and promotion is approved.

## Goal

Decide whether the components that keep a copy of something in state, synchronised by an effect,
should each be corrected where they stand or whether the area wants a different shape — and have the
evidence to say which.

The question is not whether the individual findings can be fixed. Three already have been, and each
took a characterisation test written first because none of the files had one. The question is whether
working through the rest one file at a time is the right use of the effort, or whether the count is
telling us something about how state is held in this part of the SPA.

## Starting position

The SPA's lint bar includes `react-hooks`, which carries the React Compiler's rules. Those rules
flagged 21 places where state is set inside an effect. Three have been resolved; **18 remain, across
13 files, none of which has a test**.

The findings are not one problem — they are several shapes sharing a lint rule. Every one is listed,
grouped and given a verdict in [measurements/inventory.md](./measurements/inventory.md); Phase 2 below
carries what that reading found.

**Process note.** The three resolved findings were done before this project existed, as part of
clearing the lint backlog. They are recorded in [overlay.md](./overlay.md) because they changed what a
reader sees, and this project exists to decide what happens to the rest. Phase 1 gates the *remaining*
work, not what preceded it.

## Phases

### Phase 1 — this folder (done when merged)

Project folder, `contents.md`, this plan, the overlay carrying what has already changed, the finding
inventory, and a row on the section task map. No product work.

### Phase 2 — read the eighteen — **done**

Every finding read at its call site and given a verdict in
[measurements/inventory.md](./measurements/inventory.md). No code changed.

**Twelve of eighteen are corrections in their own file.** The other six are not eighteen problems but
two mechanisms plus one misplaced fetch:

- **A signal sent by bumping a counter**, in three places: the job tree dialogue and the group job
  tree both bump a session counter so the tree below re-runs a fit, and the tree itself unpacks that
  composed key back into an id. The state carries no value — it is a message — so removing it is a
  question about how that message is sent, not about the effect.
- **The price entry rows**, in two places: unconfirmed entries are *seeded* rather than derived, and
  then edited by the reader, so they cannot simply be computed while rendering. The second of the two
  clears them on a trigger counter — the same signal mechanism again.
- **One fetch**, in `itemWatchContainer.jsx`, whose loading flag exists because the fetch is hand-run
  in an effect. The frontend rules already say that belongs in React Query.

Reading also turned up one finding that genuinely misbehaves, though not in the way the rule is
about: `CharacterSelection.jsx` re-selects every character whenever the character array is rebuilt
and the current selection is empty, so a reader who deselected everyone has the lot re-selected under
them.

### Phase 3 — decide

The answer to the question this project was opened to ask:

**No broad refactor.** Two thirds of the findings are corrections where they stand, each in its own
file, and the pattern for the commonest of them already has three worked examples.

**One mechanism is worth designing once.** The counter-bump signal appears in three places across two
features and is the only thing here that recurs. It should be decided as a piece — what it means for
a parent to tell a view below it to re-run something — rather than three times over.

**One finding is a defect** and should be fixed on its own merit rather than as lint work.

Done when the counter-bump mechanism has an agreed shape, or a recorded decision to leave it and
scope the rule for those three with the reasoning attached.

### Phase 4 — do the agreed work

Only after Phase 3. Each file gets a characterisation test before it is changed, because none of them
has one and the previous round showed why that order matters: a test written after the change passed
against a predicate that could not tell the two states apart.

The twelve *correct in place* findings do not wait on the Phase 3 decision — they are independent of
the counter-bump question and can be taken file by file whenever there is appetite.

Done when the agreed work has landed and the overlay describes what a reader sees differently.

## Done when

- Every one of the remaining findings is either resolved or carries a recorded, reasoned exception.
- The refactor question has an answer with evidence behind it, not an impression.
- The overlay describes the behaviour a reader sees today across every file this project touched.
- Promotion is approved, the overlay is folded into live frontend documentation, and this folder is
  deleted.

## Out of scope

- Turning the React Compiler on. It is not enabled, and this work is a prerequisite for that question
  rather than an attempt to answer it.
- The Edit Job reducer's deliberate in-place mutation of `state.activeJob`.
- The props shape of the Planning stage panels and what re-renders on a dispatch.
