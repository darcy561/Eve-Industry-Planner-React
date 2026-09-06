# Promotion draft — rows for existing live docs

**This file is not live SoT.** It holds the edits Stage J makes to live docs that already exist,
alongside the new topic in [promote-observability.md](./promote-observability.md).

## `stack/contents.md` — task map

Two rows, placed after the Traefik row so the edge and what watches it read together:

```markdown
| Observability addon (collector, stores, retention) | [observability.md](./observability.md) |
| Trace sampling / what reaches Tempo | [observability.md](./observability.md) § Trace sampling |
```

`Owns (SoT)` already covers this — the addon is part of the single-host topology the section owns —
so the boundary text does not change.

## `stack/config.md` — `.env` table

One row. `TRACES_SAMPLE_RATE` governs the whole trace path and appears in no live doc today:

```markdown
| `TRACES_SAMPLE_RATE` | `0` | Head sampling rate for the whole request path. Empty or unparseable → 0, which exports no spans. |
```

## `testing/services/core.md` — a stale claim

The depth line says metrics are largely untested. That is no longer true of the ESI bucket gauge,
which is now covered for what it emits as well as for what it returns, so the sentence needs to stop
implying the whole area is uncovered. The `Tested` table gains a row:

```markdown
| `metrics/esi` | Bucket rows from live state; the gauge callback emits no spans while collecting |
```

## What does not move

The measurement narrative in [overlay.md](./overlay.md) — what Tempo cost before and after the
collection fix, why the gauge callbacks were the fault, what a memory limiter would have done to
metrics and logs — is migration writing and stays with the project until the folder goes. Live docs
carry the settled behaviour, not the route to it.
