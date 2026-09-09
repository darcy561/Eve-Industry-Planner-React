# SPA token landing

## Owns

Landing the completed `spa-token-acquisition` branch on the lineage the rest of the project has moved
to. Both branches finished their work and promoted their documentation independently, so the code and
the docs each have two current versions that have never met.

- What the branch contains, where the two lineages disagree, and the resolution each disagreement
  needs — [plan.md](./plan.md).
- The measured conflict surface from a trial merge, file by file, with which side is authoritative and
  why — [current-state.md](./current-state.md).
- What the reconciled surfaces look like once the merge lands — [overlay.md](./overlay.md).

## Does not own

- The design of SPA token acquisition. That work is finished and its behaviour is documented on the
  branch it landed on; this project moves it, it does not revisit it.
- The planner session move into `services/shared/plannersession` → already promoted on
  `feature/shared-planners` and live in [backend/api/auth/sessions.md](../../backend/api/auth/sessions.md).
- Outstanding auth work → [auth-hardening/contents.md](../auth-hardening/contents.md). That project's
  Stage A overlaps one commit landing here and must be re-scoped afterwards, but the two are separate.
- Shared planners, owner keys and membership → [shared-planners/contents.md](../shared-planners/contents.md).
- Which branch merges to `Development` when, as a release decision. This project owns the
  reconciliation, not the release.

## Task map

| I need to… | Read |
|------------|------|
| Understand why two finished branches need reconciling at all | [plan.md](./plan.md) § Why this project exists |
| See exactly which files conflict, and which side wins | [current-state.md](./current-state.md) § The conflict surface |
| Understand why the session-code conflict is not a textual pick | [current-state.md](./current-state.md) § The coded refusal has moved house |
| Know what happens to the documentation tree, where both sides promoted | [current-state.md](./current-state.md) § Two promoted documentation trees |
| Choose the merge order | [plan.md](./plan.md) § Two orders, and which to take |
| Pick up the work | [plan.md](./plan.md) § Stages |
| Know what to re-verify once it lands | [plan.md](./plan.md) § Stage D |
| See what the reconciled surfaces should look like | [overlay.md](./overlay.md) |
