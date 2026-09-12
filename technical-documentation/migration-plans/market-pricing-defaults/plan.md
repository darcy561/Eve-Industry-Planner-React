# Market pricing defaults — plan

**Status:** Stage A in progress — steps 1-5 landed; steps 6-7 open. Stage B not started.
**Code in scope:** [`frontend/src/`](../../../frontend/src/) — `Hooks/Planner/`, `Functions/MarketData/`,
`Styled Components/Select/`, `Zustand/applicationSettings/`, `Classes/shoppingList.js` and the panels
and dialogues listed in § Stage A; [`services/shared/models/`](../../../services/shared/models/),
[`services/shared/documentschema/`](../../../services/shared/documentschema/),
[`services/shared/schemamaint/`](../../../services/shared/schemamaint/);
[`services/worker/tasks/sde/update/`](../../../services/worker/tasks/sde/update/) for Stage B only.
**Live SoT (until promote):** [frontend/](../../frontend/contents.md), [backend/](../../backend/contents.md)

**Rules:** Read and following [`../documentation-rules.md`](../documentation-rules.md)
and [`../technical-rules.md`](../technical-rules.md) (migration-plans).
Phase 1 (project folders/docs) before any product work.
For Go surfaces in scope only: `go fix -diff` before planned work; again on edited packages (not unrelated code).
Live SoT will not be edited until this project is complete and promotion is approved.

**`go fix` in scope at Phase 1:** clean. `go fix -diff ./shared/models/... ./shared/documentschema/...
./shared/schemamaint/...` reports nothing. Stage B's worker packages are not yet in scope and want
their own scan when that stage opens.

## Why this project exists

`applicationSettings.defaultMarketLocation` and `defaultOrderType` are one pair of fields answering
two questions that have different answers: **where materials are priced when buying, and where output
is priced when selling.** A player who buys in Jita and lists in Amarr cannot say so. The single field
predates both the per-item price overrides and the four pricing bases, and it is the reason the two
sides were crossed on the Planning stage — a sale's tax was calculated against one location while its
price came from another.

The selling half is already half-built. A job's sale location is its own stored choice, resolved
through `saleLocationID` to a `priceHubID`, and every consumer prices against that. What is missing is
only the account-level default underneath it, for a job that has not named one.

## Two axes, both called buy and sell

**This is the trap to clear before a single field is named.** "Buy" and "sell" mean two different
things here, and the existing field uses one of them:

- **Which side of the job.** Materials are *bought*; output is *sold*. This is the axis the split
  introduces.
- **Which side of the order book.** `listingType` publishes `buy`, `sell`, `buyP95` and `sellP05` —
  the best bid, the best ask, and each trimmed of outliers. `defaultOrderType: "sell"` means *price
  from sell orders*, not *this is my selling default*.

The two axes disagree on purpose. Buying materials is normally priced from the **sell** side, because
that is the ask you actually pay; selling output is normally priced from the **buy** side if you are
dumping into bids, or the sell side if you are listing. So a correctly configured account will hold
`buying.basis = "sell"`, which reads as a contradiction and is not one.

Name the axes apart and never let one field carry both. The job side is **buying** / **selling**; the
book side keeps the existing `listingType` vocabulary and is called a **basis**, not an order type.

## The ladder

Resolving a market id is one ladder, and only its ends are built:

```
1. the item's own override on the job          getEffectiveMaterialPriceHub
2. the surface's own choice (panel, dialogue)  useEffectiveMarketHubFromLayout, dialogue state
3. the nearest market group carrying a default  Stage B
4. the account's default, for the side asked    Stage A
5. DEFAULT_MARKET_OPTION                       global-config-app
```

A nearer rung outranks a further one, on both sides of the job. Rung 1 already holds that rule —
`getEffectiveMaterialPriceHub` returns `override?.marketDisplay ?? panelDefault`, resolving hub and
basis independently so a row can name a hub without naming a basis — and the split must not break it:
a player who sets one material to a hub and then changes the panel's must not lose the row they had
already answered.

## The side is chosen at the call site

A surface says which side it wants; nothing infers it from context. The resolver takes the side as an
argument, so moving a surface from the selling default to the buying one is changing one token rather
than migrating a setting.

That matters because three surfaces have no obvious side. `ItemWatch` is a watchlist, the Price Entry
dialogue seeds a figure the player is about to overwrite, and the market-link helpers want whichever
market the figure beside them came from. Rather than guessing once and burying the guess, each names
its side where it asks, and a wrong choice is visible and cheap to change.

## The job's override splits too

Rung 2 carries the same conflation rung 4 did. `layout.localMarketDisplay` / `localOrderDisplay` is a
single pair on the job, and `useEffectiveMarketHubFromLayout` feeds it to both Materials & Sourcing
and — through `useJobSellingContext` — the selling context. Parameterising the hook by side does not
fix that on its own: both sides would still fall through to one job-level override, so a player whose
account can buy in Jita and sell in Amarr could not say the same thing about a single job. That reads
as a regression the moment anyone tries it.

So the job's override takes the same shape as the account's: a side each, each naming a market and a
basis.

**An empty value is not a choice.** That one rule holds at every rung — an account side the upgrader
has not filled, a job side the player has not set, a material override naming a market but not a
basis. It is why `PricingSide` marks both fields `omitempty`, and why the resolver tests a field for
emptiness rather than for presence.

**The job's is nil-able where the account's is not.** An account always has defaults; a job usually
has no override at all, so `JobLayout.LocalPricing` is a pointer and nil omits it from the document
entirely rather than writing an empty pair onto every job.

**Nothing seeds a job server-side.** `Upgrader.Job` only clamps the schema version, and it runs in the
offline `schemamaint` drain rather than on read, so a job is handed to a caller exactly as stored.
Seeding an existing job's single override into both sides therefore belongs in the SPA's `Job`
constructor, beside the `marketLocation → localMarketDisplay` alias already there. That is the
established home for a job's defaults and legacy shapes, and it is the opposite of where the account's
seed went — worth stating, because the two look like the same problem.

## Stage A — Retire the single account default

**Frontend and stored shape. Backend stores only.**

Separate defaults for the buying and selling sides, each naming a market and a basis, replacing
`defaultMarketLocation` / `defaultOrderType`.

### What reads them today

| Surface | How it reads the default |
|---------|--------------------------|
| `Hooks/Planner/useEffectiveMarketHubFromLayout.js` | job override ?? account default ?? global |
| `Hooks/Planner/useStripRedundantJobMarketHubOverrides.js` | clears a job override equal to the default |
| `Styled Components/Select/{marketLocation,marketListing}.jsx` | the `…ApplicationSettings` variants |
| `Classes/shoppingList.js` | direct, in `calculateTotalValue` |
| `Components/Dashboard/Components/ItemWatch/{ItemRow,ItemRowExpanded,itemWatchContainer}.jsx` | direct |
| `Components/Dialogues/Price Entry/Hooks/usePriceEntryReducer.js` | seeds the dialogue's own hub and basis |
| `Components/Groups/Side Menu/Panels/OutputData/OutputCard.jsx` | direct |
| `Components/Reprocessing/Hooks/useReprocessingReducer.js` | seeds the reducer's own `marketLocation` |
| `Styled Components/{IconButton,Typography}/market{Data,History}.jsx` | direct, to build a market link |
| `Components/Settings/…/jobSettingsFrame.jsx`, `First Login/…/FirstLoginPlannerSetupStep.jsx` | the controls that set it |
| `Zustand/applicationSettings/preferences.js` | `updateDefaultMarket` / `updateDefaultOrders`, the setters behind those controls |
| `Styled Components/Select/applicationSettingsMarketUtils.js` | the shared helper both `…ApplicationSettings` selects align through |

Most of these read the field directly and have no override rung at all, so the change is wide but
shallow. `useEffectiveMarketHubFromLayout` is the exception in the other direction: it currently
serves both Materials & Sourcing and, through `useJobSellingContext`, the selling context, so it is
one hook answering for both sides and has to be split or parameterised rather than repointed.

### Three files throw rather than degrade

`shoppingList.calculateTotalValue`, `ItemWatch/ItemRow.jsx` and `ItemWatch/ItemRowExpanded.jsx` index
`findMarketData(typeID)[hub][basis]` with no guard on either step. The guarded form is the exception —
`OutputCard.jsx` is the one checked example that degrades to `0`. An id the per-hub shape does not
carry is a `TypeError` rather than a figure of nothing, and the split is the moment that becomes
reachable, so fix them with the stage whichever way the defaults land.

`ItemRow.jsx` alone holds **13** of them: three in `buildCosts`, and ten more in render reading
`calculatedCosts.mainItemPrice[defaultMarket]`. Those ten then take `.sell` directly rather than the
account's basis, so the row already prices the watched item from the ask whatever the setting says —
which is a small piece of evidence for what side that surface is on.

`worldData.findMarketData` builds its empty default by reducing `MARKET_OPTIONS`, which is what makes
an unrecognised id miss in the first place. It is the one function every price read bottoms out in and
the natural home for whatever the answer turns out to be.

### Wire compatibility

**Additive, no schema bump.** `DefaultMarketLocation` and `DefaultOrderType` are plain `string` fields
on `ApplicationSettings` in `services/shared/models/accountDocuments.go`, defaulted to `"jita"` and
`"sell"`, with no enum behind them. The new fields go in alongside.

`ApplicationSettings` does carry a `SchemaVersion` with `ApplicationSettingsSchemaCurrent`, and
`Upgrader.ApplicationSettings` runs on **every read** rather than only in the offline drain, which
makes it the place to seed the new defaults from an existing account's single value.

**Seeding is not optional, and it cannot be deferred behind the field it fills.** Go serialises a
non-pointer struct field whether or not Mongo held it, so an account stored before the split reaches
the SPA as `"defaultPricing":{"buying":{"market":"","basis":""},…}` — empty strings, not a missing
key. A client that reads that as an answer overwrites the account's real default and writes the empty
strings back on the next save. The upgrader fills it before anything downstream sees it, and the SPA
merge treats a side with no market as unfilled rather than as a choice of nowhere.

**The seed is gated on the empty market, not on the schema version.** An unversioned document is
stamped with the current version at the top of the same function, so a `SchemaVersion < n` test would
never fire for exactly the legacy rows that need filling.

**The stored backfill rides the shared-planners release rather than a schema step.**
`account_settings` is already being stamped in that project's release window, so writing
`DefaultPricing` once per account belongs in its `prepareRelease` run beside the owner stamp — see
[shared-planners/plan.md](../shared-planners/plan.md) § Schema versioning. The read-time seed is what
carries the field until then, and retires once that step has run and its gate has passed. Either way
no `*SchemaCurrent` constant moves: this is a backfill, not a migration.

Nothing in `services/` computes anything from these two fields; the backend only stores them.
`esicore.DefaultMarketLocations` is an unrelated constant naming which hubs to refresh, and is not
touched.

The SPA already carries a merge of exactly this kind, from the older `localMarketDisplay` /
`localOrderDisplay` to today's fields, in `Zustand/applicationSettings/core.js`. The same shape serves
again, and the old pair stops being written and ages out with the documents.

### The work

1. ~~Name the two axes apart (§ Two axes, both called buy and sell) and add the fields.~~ Done.
2. ~~Seed them in `Upgrader.ApplicationSettings` from the existing single value.~~ Done — landed with step 1, because step 1 alone is a data-loss bug.
3. ~~Split the job's own override the same way, give the resolver a side argument, and move the job's
   hub and basis controls onto it (§ The job's override splits too).~~ Done — the controls had to move
   in the same step, because a read path on the new field and a write path on the old one freezes the
   override at whatever was picked first.
4. ~~Point each surface in the table at a side, explicitly.~~ Done.
5. ~~Guard the unguarded price reads in the three files above.~~ Done, with the rest of step 4.
6. Settings and first-login controls offer both pairs.
7. Stop writing the old fields, once the shared-planners release has backfilled the stored ones.

**Done when** every surface in the table names a side, no code reads `defaultMarketLocation` or
`defaultOrderType`, and a player can buy against one market and sell against another without touching
a job.

## Stage B — Defaults by market group

**Worker, API and frontend.** Opens only once Stage A has landed: this rung sits beneath the account
default and above nothing, so it has no meaning until there is a side to fall through to.

### The SPA holds no market group data at all

`FullItem` — the only per-type record the SPA reads — is `type_id`, `name` and `category_id`, and a
`Material` carries `typeID`, `name`, `jobType` and `volume`. There is no axis to key a default on.

The worker already has the data and drops it on the way out:

- `marketGroups.jsonl` is downloaded and parsed into `marketGroupsData`.
- A type's real market group is `EVEType.MarketSectionID`. **Read that name carefully:**
  `EVEType.MarketGroupID` holds the SDE's *inventory* `groupID`, which is what a category is looked up
  by. The two are crossed on the struct, and the comment on `GenerateFullItemListOutput` exists
  because it has already caught someone.
- `findParentGroupFromMarketGroup` already walks a group's parent chain, for reprocessing.
- `GenerateFullItemListOutput` writes neither field into `FullItem`.

### Category is the wrong granularity

Keying defaults on `category_id` needs no backend change at all, and is the wrong feature. Category 4
is "Material", which lumps minerals, moon goo, fuel blocks and salvage together — precisely the things
a player would want priced differently from one another. Shipping it would teach a grouping players
would then want to escape.

### The tree is where the design is

EVE's market groups are a deep tree, and a default set on "Minerals" must cover Tritanium. So rung 3
is not a lookup but a walk: *the nearest ancestor market group carrying a default*. The walk runs per
material row, on every row of every job, so it wants a cache.

**Additive on both sides.** `FullItem` gains `MarketSectionID` — the item list is read as a map, so a
new field breaks no consumer, though the published list needs regenerating — and the market group tree
is published alongside it so the setting can offer "Minerals" rather than an id.

## Non-goals

- Changing what a pricing basis means, or adding a fifth.
- Making `MARKET_OPTIONS` hold anything but the four NPC hubs. Widening what a market id may be is the
  custom-structure work; this project must not assume the list stays four, but does not extend it.
- A per-planner or per-group default. These are account settings, as they are today.

## Open decisions

- **What a basis default means on the selling side.** Listing an order and dumping into bids are
  different exits with different bases, and Returns already shows both. Whether the selling default
  names one basis or names the exit route is undecided.
- **Two depths of the same branch.** When a player has set a default on "Minerals" and another on a
  group beneath it, whether the nearer simply wins or whether a deeper default may only narrow the
  basis and not the market. Stage B.
- **Whether the market-link helpers need a default at all**, or should always take the market the
  figure beside them was priced from.

## Stage status

| Stage | State |
|-------|-------|
| Phase 1 — project folder and docs | Done |
| Stage A — retire the single account default | In progress — steps 1-5 of 7 |
| Stage B — defaults by market group | Not started, blocked on Stage A |

## Start here

Stage A step 6 — the Settings and first-login controls, which still set the single
`defaultMarketLocation` / `defaultOrderType` and are the last things writing them. Every reading
surface now names a side.

Two things are deliberately still on the old fields until step 7 retires them:
`Zustand/applicationSettings` still carries and persists the single pair, and the `Job` constructor
still reads `layout.localMarketDisplay` / `localOrderDisplay` to seed a job stored before the split.
Nothing else reads either. Read § Two axes, both called buy and sell first — it is the one thing that
will make a reviewer reject the field names if it is skipped.

The design in this plan was worked out while building the Planning stage panels, which is where the
crossed buying and selling sides first showed. That project records what it handed over at
[planning-stage-panels/plan.md](../planning-stage-panels/plan.md) § Handed to the market pricing
defaults work; this plan is the authority from here.
