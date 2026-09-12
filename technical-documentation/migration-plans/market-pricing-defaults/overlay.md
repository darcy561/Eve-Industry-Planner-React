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
side and the item on the other, which the single default could not express. It takes the selling
**market** only — the column states what listing the item would fetch, so the sell price is the figure
it wants whatever basis the account prices on.

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

### A4 — Setting the defaults

Job Settings and the first-login setup both offer a market and a basis for each side, built from
`PRICING_SIDES` in `Functions/MarketData/pricingSide.js` so the two screens cannot drift apart.

The controls are labelled **Materials** and **Output** rather than buying and selling. A basis is
itself called buy or sell, so "buying market" sitting beside a basis of "Sell Orders" reads as a
contradiction when that is the normal, correct case — naming the thing being priced avoids putting the
two axes in the same phrase.

`updatePricingDefault(side, key, value)` replaced `updateDefaultMarket` and `updateDefaultOrders`;
nothing writes the single pair now.

Both screens are covered control by control — all four of market and basis on each side — rather than
by one write path standing in for the rest. A control wired to the right side but the wrong field
renders and saves exactly like a correct one, so only naming each corner catches it.

## Stage B — Market group defaults

### B1 — Publishing an item's market group

`FullItem` gained `market_group_id`, taken from `EVEType.MarketSectionID`. **Read that carefully:**
`EVEType.MarketGroupID` is the SDE's *inventory* group, which is what `CategoryID` is looked up by. The
two are crossed on the struct, both are small integers and both resolve to a real group, so a swap
would look right everywhere — a test asserts them apart on one type for that reason.

A new `marketGroups.json` names each group and says what contains it, published like the other static
data: an entry in `staticDataFileDefs`, a handler, a route, and its own metric. `ParentID` is 0 at a
root, which is the only signal a walk gets to stop; a group whose parent is missing from the source is
kept as a root rather than pointed at nothing, because a name is still worth having.

`CACHED_DATA_FILES` in the SPA answers to `staticDataFileDefs`, and a key that matches nothing the
server serves throws on first use. It carried `INVENTION_DATA`, which matched no server key and was
reached for by nothing; it is `INVENTION_MODIFIERS` now, beside the new `MARKET_GROUPS`.

The two lists are a contract across two languages with nothing between them, which is how that key
survived. `TestSPAAndServerAgreeOnTheStaticDataKeys` in `shared/core/sde` reads the SPA's list from the
repo and fails if either side names something the other does not, so the next drift is caught at the
point it is written rather than the first time something reaches for it.

### B2 — The walk

`resolveGroupDefault({marketGroupID, marketGroups, groupDefaults})` climbs from an item's own market
group towards a root, and answers market and basis separately: each stops at the first ancestor naming
it, so a nearer group narrows what it names and leaves the rest to whatever answers next. An empty
value is not a choice here either, so a group naming `""` is climbed past rather than treated as an
answer.

Group defaults are stored per side, inside `PricingSide.Groups` keyed by market group id — a group
cannot answer the side it was not set on. A job's own override is `JobPricing`, which has no group
table at all: groups are an account rung beneath the job, so a job carrying one would answer a question
it does not own. `PricingChoice` is the market-and-basis pair both are built from.

Neither the upgrader's seed nor the SPA's merge may replace a whole side to fill part of it: a side can
carry groups before it names a market, and what is persisted is the merged copy.

**The walk is capped.** EVE's tree is a few levels deep, so anything longer has met a cycle the
published file should not contain; a cap is what keeps that from hanging a page that runs this once
per material on every row. Removing it does not fail a test — it hangs the suite, which is the
behaviour the cycle case is there to pin.

The tree it walks is measured at [measurements/market-group-tree.md](./measurements/market-group-tree.md):
2,039 groups, 19 roots, five hops at the deepest. Nothing in the real data states a zero parent or
names a parent it does not carry, so those two guards are defensive rather than load-bearing — and the
cap sits far above the real depth on purpose, so a legitimate deepening of EVE's tree is not silently
truncated.

Still to wire: the per-material resolution consulting this rung, the SPA reading the published tree,
and the settings surface for choosing a group.
