# Market pricing defaults — overlay

What changed and how each part works **after** the change. Live docs remain the truth wherever this
file has no entry. Fill a section as its slice lands; do not pre-write behaviour that has not shipped.

Promote target on go-ahead: [frontend/](../../frontend/contents.md) and
[backend/](../../backend/contents.md).

## Stage A — The account's defaults

### A1 — The stored fields

_Not started._ Record here: what replaced `defaultMarketLocation` / `defaultOrderType`, how an
existing account's single value was seeded into both, and what stopped being written.

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
