# Market price delivery — overlay

What changed and how each part works **after** the change. Live docs remain the truth wherever this
file has no entry. Fill a section as its slice lands; do not pre-write behaviour that has not shipped.

Promote target on go-ahead: [frontend/](../../frontend/contents.md) and
[backend/](../../backend/contents.md).

## Stage A — The source registry

*Nothing landed yet.*

Sections to fill as the slice lands: the source-status route and what it serves; where the SPA holds
the registry and how a surface reads one source; what remains in `global-config-app.js` and why.

## Stage B — The price row and the narrowed query

*Nothing landed yet.*

Sections to fill: the query and response shape; how the handler reads Redis and what it does with a
source it does not hold; how the world-data store is keyed and the one accessor every price read goes
through; how a call site names the sources it wants.

## Stage C — Freshness from the source's clock

*Nothing landed yet.*

Sections to fill: what the browser records per source, and where that differs for a source fetched per
type; what decides a fetch; what became of the per-type age guess.

## Stage D — The price cache and its two tiers

*Nothing landed yet.*

Sections to fill: the cache entry and the loader beneath it; the accessor that reads and the two ways
of asking, and what became of `worldData.marketData` and `getMissingESIData`; the IndexedDB store, its
version and its eviction path.

## Stage E — Sources the browser fetches

*Nothing landed yet.*

Sections to fill: the shared per-character walk extracted from `nameLoader` and what both callers pass
it; the derivation in the SPA and what holds it in agreement with the Go one; the
per-type path for a custom NPC station; the token-authenticated whole-book walk that reaches a
private market through a citadel, and how a character without access is remembered; the ESI scope and
when it was added; how several stations in one region share a request; what paces each kind.

## Stage F — Custom market locations

*Nothing landed yet.*

Sections to fill: what a sale lane row carries once it can be a station as well as a structure; the
surface for adding one; what `PriceHub` means once a structure can be priced directly.

## Missing live SoT found on the way

*Nothing recorded yet.* Live documentation gaps discovered while working land here first and are
folded into the live topic docs on promote.
