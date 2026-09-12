# Market pricing defaults — overlay

What changed and how each part works **after** the change. Live docs remain the truth wherever this
file has no entry. Fill a section as its slice lands; do not pre-write behaviour that has not shipped.

Promote target on go-ahead: [frontend/](../../frontend/contents.md) and
[backend/](../../backend/contents.md).

## Stage A — The account's defaults

### A1 — The stored fields

`ApplicationSettings.DefaultPricing` holds a `PricingSide` for each of `Buying` and `Selling`, each
naming a `Market` and a `Basis`. A basis is a listing type, so a side that buys carries `Basis:
"sell"` — the ask is what buying costs. A new account starts both sides on Jita sell orders.

The SPA mirrors the shape at `applicationSettings.defaultPricing` and persists it. Where the server
sends no pair, `mergePricingDefaults` seeds **both** sides from the single `defaultMarketLocation` /
`defaultOrderType`: an account that has only ever named one market has said nothing about which side
of a job it meant, so neither side may claim it over the other. A side the server sends partially
keeps what it sent and seeds the other.

`Upgrader.ApplicationSettings` seeds an unfilled side from the account's single `DefaultMarketLocation`
/ `DefaultOrderType`, falling back to Jita sell orders when it has neither. It runs on every read, so
nothing downstream sees an unfilled side. The seed is gated on an empty `Market` rather than on the
schema version, because an unversioned document is stamped with the current version earlier in the
same function and a version test would never fire for the rows that need filling.

Still open: the once-per-account backfill, which rides the shared-planners release window rather than
a schema step, and what stops writing the single pair.

### A2 — Asking for a side

_Not started._ Record here: the resolver's shape, how a call site names its side, and which side each
surface settled on.

### A3 — Pricing an id the shape does not carry

_Not started._ Record here: what `findMarketData` answers for an unrecognised id, and what the call
sites that used to throw do instead.

## Stage B — Market group defaults

### B1 — Publishing an item's market group

_Not started._ Record here: what `FullItem` carries, and how the group tree reaches the SPA.

### B2 — The walk

_Not started._ Record here: how the nearest ancestor carrying a default is found, what caches it, and
what happens at two depths of one branch.
