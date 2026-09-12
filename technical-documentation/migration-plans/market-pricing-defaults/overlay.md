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

`resolvePricingSide({jobPricing, accountPricing, side})` in `Functions/MarketData/pricingSide.js` is
the whole ladder below a material's own override: the job's choice, then the account's, then the
global default. Market and basis resolve independently, so a job naming a market without a basis keeps
the account's basis rather than losing it, and an empty value is not a choice at any rung.
`useEffectiveMarketHubFromLayout(layout, side)` wraps it with the store read.

`PRICING_SIDE.BUYING` / `.SELLING` name the side of the **job**, never the side of the order book. The
argument is required, so a surface cannot fall through to a default side by omission.

A job's own override is `layout.localPricing` — `JobLayout.LocalPricing`, a nil-able
`*PricingDefaults`, so a job that has chosen nothing writes nothing. `JobLayout` decodes by hand in
both BSON and JSON, and a field added to the struct alone is dropped silently, so the new field is
assigned in both and both round trips are covered by tests.

Nothing seeds a job server-side: `Upgrader.Job` only clamps the version and runs in the offline drain.
The SPA's `Job` constructor seeds a job stored before the split, beside the `marketLocation` alias
already there — both sides from the one pair, for the same reason the account's seed does.

Which side each surface asked for: Materials & Sourcing, Purchasing's material cards and the
Purchasing data panel buy; `useJobSellingContext` sells.

`setJobPricingSide(jobPricing, side, key, value)` is how a control changes one field of one side. It
answers null once the last choice is cleared, so a job that has chosen nothing carries no override.
The hub and basis controls on both panels read and write through it, and
`useStripRedundantJobMarketHubOverrides` judges each side against its own account default rather than
clearing both at once.

**A read path on the new field and a write path on the old one freezes the override.** The reducer
rebuilds the job from the previous instance on every layout edit, so once a side had been seeded, a
control still writing the legacy field would be ignored from the second pick onward — the panel's hub
selector would go dead for the rest of the session. The controls therefore moved in the same step as
the resolver, and the sequential-edit case is covered rather than left to a single-construction test.

### A3 — Which side each surface asks for

Every surface names its own side where it asks, so moving one is a single token:

| Surface | Side | Why |
|---------|------|-----|
| Materials & Sourcing, Purchasing's cards and data panel, the per-row override | buying | materials are bought |
| Shopping list totals | buying | what is still to buy |
| Price entry dialogue | buying | seeds a figure about to be paid |
| A group's output card | selling | what the jobs produce is worth |
| Reprocessing | selling | values the minerals an input would yield |
| `useJobSellingContext` | selling | the sale being planned |
| Watchlist rows | **both** | materials are bought, the item itself is valued at what it fetches |
| Market and price-history links | the figure's own | `locationID`/`regionID` from the caller, and only where it has none does the side decide |

The watchlist is the case that shows why the two are separate: one row prices its materials on one
side and the item on the other, which the single default could not express.

**A link's side must match the figure it sits beside.** A group's output card and the Selling stage's
market costs panel both show a selling figure, so their market and price-history buttons take
`PRICING_SIDE.SELLING`; left on the default they would have opened the buying market next to a selling
price. Every other caller passes an explicit `locationID` or `regionID`, which outranks the side.

**An unrecognised id answers with nothing rather than throwing.** `findMarketData` builds its empty
default from the four hubs, so a market it does not carry misses. Thirteen reads in `ItemRow.jsx`,
three in `ItemRowExpanded.jsx` and one in `shoppingList.js` indexed that result twice with no guard
and raised a `TypeError`; they are guarded now. In `ItemRow` the item's own worth is derived once in
`buildCosts` rather than re-indexed at ten render sites.

`calculateMaterialCostFromChildJobs` took its hub and basis as arguments named for the account
defaults. Both callers already passed a resolved pair, so only the names moved — `marketSelect` and
`listingSelect`, matching what is handed in.

## Stage B — Market group defaults

### B1 — Publishing an item's market group

_Not started._ Record here: what `FullItem` carries, and how the group tree reaches the SPA.

### B2 — The walk

_Not started._ Record here: how the nearest ancestor carrying a default is found, what caches it, and
what happens at two depths of one branch.
