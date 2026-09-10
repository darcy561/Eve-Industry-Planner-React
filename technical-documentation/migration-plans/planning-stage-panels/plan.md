# Planning stage panels — plan

**Rules:** Read and following [`../documentation-rules.md`](../documentation-rules.md) and
[`../technical-rules.md`](../technical-rules.md) (migration-plans), plus the root masters they defer
to, and — for the surfaces this plan names — [`../../frontend/technical-rules.md`](../../frontend/technical-rules.md)
and [`../../backend/technical-rules.md`](../../backend/technical-rules.md).
Phase 1 (project folder and docs) before any product work.
For the Go surfaces in scope only: `go fix -diff` before Stage A, and again on the packages edited.
Live SoT will not be edited until this project is complete and promotion is approved.

## Goal

The Edit Job Planning stage answers three questions clearly — **what does this take**, **what does it
cost**, **what does it return** — with one panel per question, figures priced at the granularity the
server already provides, and the cost of selling counted rather than omitted.

## Starting position

`MaterialCostPanel` is one `ContentPanel` doing four unrelated jobs across roughly 1,300 lines and 24
files:

| Job | Where it lives now | What is wrong |
|-----|-------------------|---------------|
| Product revenue | `currentMaterialHeader.jsx` | The only revenue figure on the stage, inside a panel titled “Costs”, formatted as a material row |
| Material cost | `itemRow.jsx`, `materialTotals.jsx` | Re-renders the material list already drawn by `ResourcePanel` immediately above it |
| Buy vs build | `Child Job Pop Over/` (9 files) | Four ungrouped figures per row; the comparison and every action behind a small info icon |
| Pricing configuration | `materialSourcesPopover.jsx` | Three override levels in a centre-screen popover reached from a kebab menu |

Two further problems are not about layout:

**Selling costs are absent.** The broker fee paid to list an item and the sales tax paid on the sale
are calculated on the Selling stage (`calcBrokersFee`) and ignored on Planning, so every profit figure
the stage shows is optimistic. On the worked example that is 23.4M on 624M of revenue — 3.75%, which is
comparable to the buy-vs-build savings the panel exists to surface. The broker fee is also only
derivable at an NPC station, where it falls out of the character's skill and standings; at a citadel it
is the structure owner's rate and the player has to supply it. Today there is one such rate for every
citadel, and no sales tax rate anywhere.

**The comparison arrives after the decision.** A material's build cost is unknowable until its own
material requirements exist, so the child-build columns are populated only for rows the player has
already committed to. `buildSingleChildJobPreview` already constructs exactly the speculative job that
would answer the question, on popover open, and discards it when the popover closes.

## Target shape

Three panels replace one. Each carries its own pricing control in its header; there is no bar above
the stage.

| Panel | Answers | Absorbs |
|-------|---------|---------|
| **Materials & Sourcing** | What does this take, and should each material be bought or built | Raw Resources; the child-job popover becomes an inline drawer |
| **Cost Breakdown** | What is the cost made of, and how does it compare to previous builds | Extras; the build-vs-buy pricing model toggle |
| **Returns** | What does the build return, by each route out | The duplicated totals columns |

Panel count on the stage is unchanged at eight: Raw Resources and Extras retire, Cost Breakdown and
Returns are new, and Skills is rebuilt.

**The stage does not grade the plan.** Returns presents figures and the relationships between them —
net return, both exit routes, headroom above break-even, the range of previous builds — and states no
verdict. Whether a margin is worth the time depends on the player's capital, their week and the item's
turnover, none of which the app holds. This is a constraint on every stage below, not a Stage F
detail.

## Ordering

The figure work runs first, and for a specific reason rather than convention: **the panels depend on
figures that do not exist yet.** Cost Breakdown cannot draw a sales-tax row until a rate resolves, and
Returns cannot state a net return until the fee estimate does. Doing the panels first would mean
building them twice.

Stage A supplies those figures without storing anything: a sale location resolves through one accessor
returning placeholders, so the panels can be built and tested now and the stored rows arrive later
underneath them.

```
Stage A  sale locations and their rates                 frontend, no stored shape
Stage B  fee + tax estimation shared with Selling       frontend logic, no UI
Stage C  Accounting in the skill catalogue              data
   ────────────────────────────────────────────────  UI work starts here
Stage D  pricing basis surfaced in panel headers
Stage E  Materials & Sourcing absorbs Raw Resources
Stage F  Cost Breakdown and Returns replace the totals
Stage G  speculative child jobs                          behavioural
Stage H  jobs with parent jobs                           behavioural
Stage I  Skills as a model
Stage J  mobile layouts
```

Stages A–C are independent of each other and can land in any order or together. D–F are strictly
ordered. G and H are the two behavioural changes and are the highest-risk work; both are gated on F so
they change a panel that has already settled. I depends on B for its figures. J is last because it
restyles panels that must exist first.

## What this project inherits

| Inherited | Where it is decided | What this project assumes |
|-----------|---------------------|---------------------------|
| The account / planner settings split | [shared-planners](../shared-planners/plan.md) | That `planner.Settings` is where a setting a job's costing depends on belongs, and that `CustomStructures` is already on both documents and cloned into a new planner. Saved citadels join that family, so they inherit the placement rather than needing one decided |
| Settings write shape | [document-write-granularity](../document-write-granularity/plan.md) | Nothing. This project writes no settings; the shape it settles applies to the custom-structure work that stores saved citadels |
| Server price figures | live SoT, [backend/](../../backend/contents.md) | That `buy`, `sell`, `buyP95` and `sellP05` are served per hub and stay served. This project reads them and adds no querying |

## Stage A — Sale locations and their rates

**Frontend only. No stored shape, no schema, no backend.**

### Two location kinds, two mechanisms

A broker fee is not one calculation with a fallback. It is two different mechanisms, and
`calcBrokersFee` already implements both — the branch on `STATIONID_RANGE` is the distinction, not an
optimisation.

**An NPC station's rate is derived.** The player supplies nothing. The station's `race_id` and `owner`
come from `getStationData`, and the rate falls out of the character's skill and their standings with
those two entities:

```
3% − 0.3 × Broker Relations − 0.03 × faction standing − 0.02 × corporation standing
```

Both standings are read per character, and the faction one requires knowing which faction owns the
station. This is why a station cannot be treated as "a location with a rate": the rate is a function of
who is selling, and it differs between two characters standing in the same station.

**A citadel's rate is set by its owner.** The owner chooses a percentage and receives all of it; the SCC
takes a further flat 0.5%, which no skill reduces. Standings do not enter into it — there is no faction
and no NPC corporation to hold standing with — and **Broker Relations does not reduce it either**, which
is why `calcBrokersFee` applies the supplied `citadelBrokersFee` verbatim rather than running it through
the skill term.

**The stored rate already includes the SCC's 0.5%, and nothing adds it.** A player supplies the figure
the market window shows them, and that figure is the total charged. Adding the surcharge to a stored
rate would double-count it on every citadel sale. The consequence worth carrying into the
add-a-citadel form: 0.5% is the floor a citadel rate can take, since it is what remains when an owner
charges nothing.

Sales tax is a third case again: it is derived from Accounting alone, at every location, station and
citadel both. It has no station or structure component, which is why it belongs on the character rather
than the location.

| | Broker fee | Sales tax |
|---|---|---|
| **NPC station** | Derived: base, less Broker Relations, less faction and corp standings | Derived: base, less Accounting |
| **Citadel** | The rate the player supplies, which is the total they are quoted | Derived: base, less Accounting |

### The gap

`MARKET_OPTIONS` holds the four NPC hubs we carry price data for, and every one of them takes the
derived path. Everywhere else is a citadel, and the app has exactly one number for all of them:
`defaultCitadelBrokersFee`. Three problems for planning:

- It is **one rate for every citadel**. A player selling from two structures with different fees
  cannot express that.
- It has **no tax counterpart** — though for the reason above, tax does not need a per-location field.
  What it needs is an Accounting-derived rate, which does not exist anywhere today.
- It is **not reachable from Planning**, which has no concept of a sale location beyond the four hubs.

Tracking every citadel's rates is not possible and is not proposed. A citadel's fee is a fact about
someone else's structure; the only way the app can hold it is for the player to tell it.

### What is stored, and where

The rule the tree already follows: **game constants live in the SPA; the player's choices live in the
document.** `CustomStructure` stores `structureType`, `rigType` and `systemType` as ids and resolves
their multipliers from `structureOptions` in `defaultValues.jsx`. Nothing about a structure's bonuses
is persisted, because they are facts about the game, not about the player.

Broker fee and sales tax split the same way:

| | Where it lives | Why |
|---|---|---|
| Base broker rate (3%), skill and standing coefficients (0.3 / 0.03 / 0.02) | **SPA constant** | Facts about the game. They are currently magic numbers inline in `calcBrokersFee`; this stage lifts them into `defaultValues.jsx` beside `structureOptions` as one source of truth |
| Base sales tax rate and its Accounting coefficient | **SPA constant** | Same. A rate every player is subject to is not per-account data |
| A station's `race_id` and `owner` | **Neither — fetched** | Already read through `getStationData` and cached by React Query |
| The character's skills and standings | **Neither — fetched** | Already read through the cached ESI hooks |
| **A citadel the player sells from: which structure it is, its fee, and the hub it prices against** | **Document** | The fee is the one figure the app can neither derive nor look up — a fact about someone else's structure that only the player knows. The structure id identifies which citadel it is. The hub is a `MARKET_OPTIONS` id, stored because the app has no prices of its own for a structure and something has to say which apply |

So the backend surface is **one list**, not a rate table. Nothing that can be computed from a constant
or fetched from ESI is persisted, which also means a game change to a base rate ships as an SPA change
rather than a migration over every account.

### Building against a placeholder

The stored list is not built here, so nothing downstream may read the settings document directly. Every
consumer goes through `Functions/MarketOrders/saleLocations.js`, which answers two questions and hides
where the answer came from:

| Function | Answers |
|----------|---------|
| `getSaleStructures` / `getDefaultSaleStructure` | Which citadels can be sold from, and which is used when a job names none |
| `resolveSaleLocation` | For a hub id or a saved row's id, one normalised location: its name, the station whose prices apply, and its broker fee — `null` at a hub, where the rate is derived from the seller instead |

Today `getSaleStructures` returns one fixed placeholder carrying the full stored shape. When the lane
lands, that function reads it instead and **nothing else changes**: the placeholder is not exported, so
nothing outside this file — panel, test or fee calculation — can name it. The module's own tests read
their subject back through the accessors for the same reason, so they hold unchanged too.

Normalising both kinds into one `SaleLocation` is what makes that true. A caller pricing a sale never
branches on hub-versus-structure — it reads `brokerFee` and prices against `priceHubStationID` — so the
branch exists in one place rather than in every consumer, and a structure's split of *prices from one
location, fee from another* is resolved before a caller sees it.

**Done when the lane lands:** `getSaleStructures` reads the stored lane, the placeholder constant is
deleted, and no other file is edited.

### The resolution order

One function answers "what rates apply for this character selling here", and both stages use it:

| Sale location | Broker fee | Sales tax |
|---------------|-----------|-----------|
| One of the four preset hubs | Derived from Broker Relations and standings, as `calcBrokersFee` does today | Base less Accounting |
| A saved citadel | Its stored rate, verbatim | Base less Accounting |
| Signed out | Base 3%, no skill or standing reduction | Base rate, no reduction |

The 100 ISK floor `calcBrokersFee` already applies stays in all cases.

**Standings are per character, not per location.** The derived path already reads them through
`getCachedCharacterStandings` keyed by `CharacterHash`, so a job's estimate uses the standings of the
character on its selected setup. Changing the selected character changes the fee, which is correct and
worth surfacing in Stage I rather than hiding.

### The work

- Lift the broker fee rates out of `calcBrokersFee` into `defaultValues.jsx`, beside `structureOptions`,
  as `brokerFeeRates` — base, the Broker Relations, faction and corporation coefficients, and the ISK
  floor — plus `marketSkillIDs` for the skill type ids the fee depends on. They are game constants and
  were magic numbers; this is the one source of truth both stages read.
- Give every consumer one accessor over the sale locations, returning placeholders until the stored
  list exists — § Building against a placeholder.

- Add `salesTaxRates` beside them — base and the Accounting coefficient — with Accounting's type id in
  `marketSkillIDs`. Nothing calculates sales tax today, so these are new rather than lifted.

**Three further charges are real and out of this project's scope**, recorded so they are not
rediscovered as defects. A broker fee is charged on **buy** orders too, so buying materials through
orders costs more than the price paid — this project models the cost of *selling*, not of purchasing.
**Relisting** an order costs a discounted broker fee, reduced further by Advanced Broker Relations; the
Planning stage estimates a first listing, and a relist is a Selling-stage event. And the round-trip
break-even a trader quotes — two broker fees plus tax — is not a builder's: a build pays one listing fee
and one tax, so Stage F must not borrow the trading figure.

**Sales tax reduces multiplicatively, and the broker fee does not.** Accounting takes a fraction of the
base per level — `base × (1 − 0.11 × level)` — where the broker fee subtracts each coefficient from its
base. The two sit next to each other and read alike, so applying the broker fee's form to tax is the
easy mistake: it gives 6.95% at Accounting V instead of 3.375%. Stage B implements them as two
formulas, not one with different inputs.

**No document, schema or backend change.** Storing saved citadels moves to the custom-structure work;
this stage neither adds a field nor bumps a schema version, so there is nothing to migrate and no
collection to back up before writing. § Handed to the custom-structure work carries the shape and the
migration it will need.

The rate *block* — a station's full working, a citadel's single line, and the picker that chooses
between saved locations on a job — is settled in the design reference and built in Stage F with the
panels that consume the figures.

**Done when:** a caller can resolve a sale location and its rates through one accessor without knowing
whether the row is stored or a placeholder; two placeholder citadels differing in fee, hub and default
prove a consumer reads the chosen row rather than assuming one; the broker fee rates resolve from the
SPA constant with no request and no literal of them survives in `calcBrokersFee`.

## Handed to the custom-structure work

Storing saved citadels, and the surface for editing them, is **not this project's work** — it goes with
the wider custom-structure work being taken separately. This project reads them through the placeholder
accessor above and never touches the settings document.

What follows is what this project worked out before handing it over. It is written down so it does not
have to be worked out twice, and it is a proposal for that work rather than a decision it is bound by.

### The shape it should take

A citadel is not a fifth kind of thing beside the structures the app already stores — it is another
lane of `CustomStructures`, which is already a per-planner list of named, player-defined locations
each carrying its own rate.

```go
// SaleStructure is a citadel a player lists orders from, chosen from the
// structures their characters hold assets in. Its broker fee is set by the
// structure's owner and can be neither derived nor fetched, so the player
// supplies it. PriceHub names which of MARKET_OPTIONS its figures are priced
// against, since the app holds no prices for a structure of its own.
type SaleStructure struct {
    ID          string  `bson:"id" json:"id"`
    StructureID int64   `bson:"structureID" json:"structureID"`
    Name        string  `bson:"name" json:"name"`
    BrokerFee   float64 `bson:"brokerFee" json:"brokerFee"`
    PriceHub    string  `bson:"priceHub" json:"priceHub"`
    Default     bool    `bson:"default" json:"default"`
}

type CustomStructures struct {
    Manufacturing []CustomStructure       `bson:"manufacturing" json:"manufacturing"`
    Reaction      []CustomStructure       `bson:"reaction" json:"reaction"`
    Reprocessing  []ReprocessingStructure `bson:"reprocessing" json:"reprocessing"`
    Invention     []InventionStructure    `bson:"invention" json:"invention"`
    Sale          []SaleStructure         `bson:"sale" json:"sale"`
}
```

**A lane rather than a new field, because the lane machinery already exists.** `CustomStructures` is
on both the account and the planner document and is cloned into a new planner by `SettingsFromAccount`;
the SPA store rebuilds each lane from a class by name; the settings page already frames the family. The
Invention lane was added this same way at schema v0→v1, so the upgrader step has a worked precedent to
copy rather than a pattern to invent.

**The custom-structure work itself is not this project's to do.** Building the lane's editing surface —
the settings frame, the add-a-citadel form, the store rebuild — belongs with the wider custom-structure
work being taken separately. This project builds against a placeholder instead, and the full lane slides
in at the end. § Building against a placeholder says how that stays a change to one file.

**The lane belongs to the planner**, which the family it joins has already decided.
[shared-planners](../shared-planners/plan.md) § Settings split between the planner and the account puts
`CustomStructures` and `DefaultCitadelBrokersFee` both on the planner side, under the rule that a
setting deciding how work is done in a planner belongs to it. The account's copy is the seed a new
planner is built from, not a thing resolved against. So a shared planner offers every member the same
citadels, while the parts of a fee that come from a person — Broker Relations, standings, Accounting —
stay per character and are read through the setup's selected character. Locations are shared; skills
are personal.

**`StructureID` is the in-game structure**, chosen from the locations the player's characters hold
assets in. It is captured now so that a later project can query the structure's own market for the
types priced against it; **nothing in this project queries it.** Storing the id is the whole of the
capability being added here.

It is stored raw, as `int64`. Location ids are already stored in the clear across the tree —
`DefaultStationIDForAssets` and `CustomStructure.SystemID` are both `int64` — and the deterministic
entity-ref machinery covers owner identity (corporation, character, alliance) rather than places.

**No character is stored on the row.** Which characters can reach a structure is a question only the
project that queries its market has to answer, and a `CharacterHash` on a planner-owned row would put a
personal value on a shared one — the defect the settings split exists to prevent.

The lane carries no `SkillsApply` flag and no standings: **a citadel fee is not reduced by Broker
Relations**, so there is nothing to opt in or out of. An earlier draft of this stage had such a flag; it
was wrong, and it would have produced fees the Selling stage disagrees with. It also carries no
`JobType`, which every other lane has: selling is not one of the `jobTypes`, and `customStructureMap`
keys lanes by job type, so the field would hold a meaningless number in every row.

`PriceHub` is a `MARKET_OPTIONS` id, not a copy of anything from it. The app holds no prices for a
structure, so a job selling from one still prices against a hub, and asking once per citadel beats
asking on every job. It also makes the assembly explicit rather than hidden: **prices from one
location, fee from another**, which the rate block states wherever a figure is shown.

A preset hub is not stored — it stays an entry in `MARKET_OPTIONS` and takes the derived path.

### Backing up before the upgrader writes

The upgrade-on-read path rewrites `application_settings` and the planner settings collection, so both
must be copied before the first write, with the copies restorable and a round-trip test — back up,
mutate, revert, compare.

Most of that exists. `services/core/commands` holds a copy / revert / drop framework behind
`eip cli prepareRelease`, `revertRelease` and `dropReleaseBackups`, with a round-trip test, and
`application_settings` is already in its collection list. Two gaps: the planner settings collection is
not, and the list is derived from what a release's *cutover steps* touch — while an upgrade-on-read
change writes through a different path entirely. Extend that framework rather than building a second
backup beside it.

### Choosing the structure

The picker reads the list the app already builds. `getAssetLocationList` walks every character's
assets, resolves nested containers to their parent location, dedupes to unique location ids, resolves
names through `getWorldData` retrying per character because access differs between them, drops what
stays unresolvable, and sorts by name. `jobSettingsFrame` already renders that list as a location
picker for `defaultStationIDForAssets`.

**Structures reach that list through the extended branch, not the direct one.** Only `station` and
`solar_system` are accepted directly; an asset sitting in a citadel comes back as `item`, and
`retrieveAssetLocation` finds no asset row whose `item_id` matches a structure id, so it returns the
asset itself and the structure's `location_id` is what lands in the list. This is worth stating because
reading the direct filter alone suggests structures are dropped, and they are not.

What the list does not do is separate a station from a structure — both are ids in it, told apart only
by range. `resolveLocationKind` in `assetLocationConstants.js` already answers that, and the form calls
it rather than carrying a second copy of the ranges; it also covers what a bare `STATIONID_RANGE`
comparison does not — solar systems, abyssal space, and the asset-safety sentinel.

**The kind alone is not the filter, though.** A structure kind covers customs offices as well as
citadels: they share an id range, and ESI documents customs offices as not resolvable, so nothing
separates them from the id. What separates them is the name — `getAssetLocationList` tries each
character in turn and drops what stays unresolvable through `isNoAccessLocation`, which is exactly the
step that leaves a citadel the player can actually reach. So the form filters on kind **and** keeps the
name resolution; a candidate set taken from the kind alone would offer unnamable customs offices as
sale locations.

One category is excluded and should stay excluded: the `parentLocation.location_type !== "other"` guard
drops asset safety, which is what ESI reports as `other`. That is right for a sale location — nothing is
listed for sale from asset safety — but it is a behaviour decision living in a comparison rather than
anywhere stated, and it is the line to look at if a later surface needs everywhere an account holds
assets rather than everywhere it can sell from.

The player picks a structure, names its fee, and picks the hub it prices against.

**This surface is moving.** [esi-collections](../esi-collections/plan.md) is reshaping the asset
functions: its Stage D replaces the resolve-and-write step with one shared name query and reshapes
`getAssetLocationList` around a node collection, and its Stage E deletes `retrieveAssetLocation` once
its callers move. `getAssetLocationList` itself is expected to survive. Build the form against it, and
expect the internals under it to change.

This is why the stage is not purely backend: **the row cannot be created without the picker**, so the
picker ships with the field. The rate *block* that displays the working stays in Stage F with the
panels that consume it.

A sale structure's name comes from one member's ESI access, so a shared planner shows other members a
structure they may not be able to reach. That is intended — they need to know where the planner sells —
but it sits beside `ShareCitadelNames`, the existing opt-in for contributing citadel names, and should
not land without being noticed.

## Stage B — Fee and tax estimation

**Frontend logic. No UI.**

`calcBrokersFee` takes an order-shaped object and returns ISK. Planning needs the same rates against a
planned sale rather than a real order, and against a location that may be one the player defined.

- **Split the rate from the ISK, for the tax as much as the fee.** Extract rate resolution into its own
  function so both stages share one formula rather than the planner growing a second copy.
  `calcBrokersFee` then becomes that function plus a multiplication and the existing floor.

  **The tax is built in that same split shape**, even though nothing calculates it today and there is
  therefore nothing to extract. It would be quicker to write a single Planning-only helper that returns
  a tax figure, and that is the thing to avoid: the Selling stage will need the same rate against a real
  sale, and a helper shaped for one caller has to be taken apart before the second can use it. A rate
  function and an amount function from the start costs nothing now and means Selling adds tax by calling
  what already exists.
- The rate function takes a **sale location** rather than a `location_id`, and branches the way
  `calcBrokersFee` already does: a preset hub derives from `stationID` — `MARKET_OPTIONS` carries one
  per hub — and a saved citadel returns its stored rate verbatim.
- Character inputs stay as they are: skills and standings from the cached ESI reads the Skills panel
  already makes, keyed by `selectedSetup.selectedCharacter`. **Standings are only read on the station
  path**, because a citadel has no faction or NPC corporation to hold standing with.
- Sales tax is derived from Accounting against the stored base rate, at **both** kinds of location. It
  is a character figure, not a location one.

**Fees are sell-side only.** Broker fee and sales tax are what a player pays to **list** an item.
Nothing here estimates a fee for acquiring materials; buy-side fees are out of scope.

**Two exit routes, both at the current price.** Listing a sell order returns the hub sell price less
fee and tax; selling into buy orders returns the hub buy price less tax only. Both are quoted at what
the market is now — the app does not model undercutting, order-book position, or how long a listing
sits.

**A citadel has no price data.** The four hubs are the only places prices are held, so a saved citadel
supplies a *fee rate*, not prices. A job priced at Jita and sold from a player's own structure uses
Jita's prices and the structure's fee, and the panel says so rather than implying the price came from
the structure. This is the one place where a figure is assembled from two locations, and it has to read
that way.

**Signed out:** base rates with no skill or standing reduction, and preset hubs only. The figure is
conservative rather than absent, and no authenticated read is required to produce it.

**Done when:** one rate function per charge serves both stages, each paired with an amount function;
the station path derives from skill and standings and the citadel path does not; tax derives from
Accounting at both kinds of location; the estimate is derivable for a signed-out user; `calcBrokersFee`
is those functions rather than a second copy of the formula; tests cover the station path, the citadel
path, and the signed-out fallback, and agree with the existing `calcBrokersFee` tests.

## Stage C — Accounting in the skill catalogue

**Data.**

`bpSkills.json` carries Broker Relations (3446) but not Accounting (16622). Stage I needs both, and
Stage B needs Accounting to apply a skill reduction to the tax rate. One entry, in the file that is
already the catalogue.

The catalogue is what makes a skill id usable at all: `getSkills` builds its map by walking every entry
in `bpSkills.json` and looking each id up in the ESI response, so a skill absent from the catalogue is
not merely unlisted — it reads as untrained, and its reduction silently never applies. A test asserts
every id in `marketSkillIDs` resolves there, so the pair cannot drift apart.

**Done when:** Accounting resolves by type id through the same lookup as every other skill.

## Stage D — Pricing basis in the panel headers

The listing dropdown already offers `buy`, `sell`, `buyP95` and `sellP05`, and
`useMaterialPricingModel` already resolves them per material through three precedence levels. The
percentiles are computed by the worker, served by the API, labelled by `getListingModeLabel` — and
effectively invisible, because a row prints the resolved choice as 10px caption text with nothing to
say why one mode would beat another.

- The basis becomes a **picker built to sit in a panel header**, and this stage builds the picker
  rather than mounting it. The headers it belongs in — Materials & Sourcing owns the material basis,
  Returns owns the sale hub, Cost Breakdown owns the build-vs-buy model — are created in Stages E and
  F, which mount it through the `action` that `AppShellPanel` already takes.

  It is built before its mount points for the reason the backend work came first: a picker built into
  today's `MaterialCostPanel` would be built onto the old `ContentPanel` shell, in a panel Stages E
  and F delete. Like Stages A–C, this stage ships no visible UI on its own.
- The picker shows the four modes **with what each does to this job's total**, so the trimmed figures
  stop reading as jargon.
- A row whose material has a Price Entry purchase price says **Paid** rather than showing an estimate
  for something already bought, and one bought in part says both — what was paid, and what is left to
  buy.

  The per-row override already names the mode as well as the hub: `materialPriceOverrides` stores
  `marketDisplay` and `orderDisplay`, and the popover sets both. Nothing to widen — what the override
  lacks is a place to live other than a centre-screen popover, which Stage E gives it.

**No stored shape changes.** `layout.localMarketDisplay`, `layout.localOrderDisplay` and
`materialPriceOverrides` already hold exactly a hub id and one of the four listing ids. This stage is
presentation over data that exists.

The pricing basis is the first of two shared inputs; the second is the sale location, which Stage F
renders inside Returns. They are separate because one decides what materials cost and the other what
selling costs, and a job can price at one hub while selling from a structure beside another.

**Done when:** the picker renders the four modes with each one's effect on this job's total; a row's
override names a mode as well as a hub; a row whose material has a Price Entry purchase price reads
**Paid** rather than quoting an estimate; overrides resolve exactly as they do today. Mounting is
Stage E and F's — this stage is done when the picker and its figures are tested and ready to be
placed.

## Stage E — Materials & Sourcing

- Raw Resources retires. Its quantity, job-type dot and linked tick fold into the merged table's
  **Qty** column and the row's accent stripe; “Copy resources list” moves to the kebab and total volume
  to the footer.
- Child build unit cost and total collapse into a **Build** column and a **Δ** percentage — the figure
  the current panel makes a reader compute by eye.
- The child-job popover becomes an **expandable row** on an inset surface: multiple rows open at once,
  it survives scrolling, and the actions get room for labels.

**Done when:** the material list renders once on the stage; every row states its own comparison; the
drawer replaces the popover on desktop.

## Stage F — Cost Breakdown and Returns

The totals block currently renders the same five rows twice, once per pricing model, marking neither
as the one in effect.

**Cost Breakdown** draws the cost as proportions and subtotals **cost to build** separately from
**cost to sell**, because the fee and tax are only paid on listing — which is also what lets the sell
band disappear entirely in Stage H. Materials and child builds do not overlap:
`calculateMaterialCostFromChildJobs` substitutes a child's own unit cost for the market price rather
than adding to it, and recurses, so a linked material contributes nothing to the market-priced line.
Install cost on this panel is this job's slots only. Archive figures render here as a range bar placing
this build within previous builds, and a per-component **vs last build** column.

**Returns** leads with the net return and three normalisations of it — per unit, margin, return on
outlay — then both exit routes at equal weight, then break-even and the previous-build range as context
rows, then the ledger behind a disclosure. Colour marks sign only.

**The sale location and its rates render here**, as a block inside Returns. At a preset hub it shows
every subtraction — base, less Broker Relations, less each standing — because those come from the
player's own character and seeing them is what makes the figure trustworthy. At a citadel it is one
line and a sentence saying Broker Relations does not apply, since the absence of working is itself the
information. The block names the character it is quoting, and where the location is a citadel it also
names the hub its prices came from. The location picker and the add-a-citadel form are reached from
this block.

**Archive figures are one query, three placements.** `useAccountTotalsQuery` already runs on this stage
for the current type id. The Build History panel keeps the cost-over-time chart and the output
destination split; the range bar, the comparison column and the previous-build context row read the
same result. Absent history — a first build, or a signed-out user — each simply states that and drops
the comparison.

**Done when:** one pricing model is in effect at a time and the panel says which; fee and tax appear in
their own band; the archive comparison renders where history exists and is absent without it.

## Stage G — Speculative child jobs

**Behavioural change, one of two.**

`buildSingleChildJobPreview` already builds a real speculative job on popover open, and “Mark For
Creation” commits an object that already exists in memory. This stage builds it for every buildable
row, so the Δ is populated before the player chooses.

- The five buttons and the branching in `buttonSelectionLogic.jsx` collapse into **one chip with two
  states plus an undo**. Build promotes the speculative job; Buy discards it.
- In a group, the speculative job is **seeded from the job it would link to** plus this parent's extra
  quantity, so confirming updates the existing job's runs and links it in one action rather than
  offering “create” and “link” as separate buttons.
- `temporaryChildJobs` is already the right home and already excluded from persistence; it holds one
  entry per buildable material rather than only the clicked one.

**Cost, and the mitigation.** A speculative build per buildable material means `buildJob` plus
blueprint and ESI hydration for each, where today there are none. It must not fire on page load: rows
render with Δ pending, and a control on the summary strip costs them on demand. This follows the
existing rule about not auto-fetching expensive data most visitors do not need. It adds no market
querying — a speculative job prices its materials from the same batched server figures as everything
else.

**Depth.** One level by default, with the drawer able to expand deeper on request, and the row stating
that its build price values sub-materials at market.

**Done when:** a buildable row can be compared without committing; promoting and discarding both work;
nothing is built on page load; a signed-out user's behaviour is unchanged from today.

## Stage H — Jobs with parent jobs

**Behavioural change, two of two.**

`activeJob.parentJobs` is populated and `actions.getCurrentParentJobs()` already merges pending edits;
Production Stats already walks the parents to total what they require.

- Revenue, margin, break-even, broker fee and sales tax are **removed** when the job has parents. The
  output is committed and never listed, so quoting a sale price invites a player to read a profit that
  does not exist.
- The headline becomes **cost contributed to the parent**, with the buy-at-market alternative beside
  it — the same two figures the parent's Δ column compares, from the child's side.
- Cost Breakdown keeps the build band and drops the sell band.
- **Partial commitment** is the honest edge case: a job producing more than its parents need has a
  sellable surplus, so show both, with the sale figures scoped to the surplus.

**Done when:** a job with parents shows no sale figures; a job with a surplus shows sale figures for
the surplus only; a standalone job is unaffected.

## Stage I — Skills as a model

- Three groups: **required to build**, **affects build cost**, **affects selling cost**. A skill may
  appear in more than one.
- **Broker Relations and Accounting** join the panel, because they are inputs to the fee and tax
  figures Cost Breakdown now shows. Where the sale location is a citadel, Broker Relations is shown as
  **not applied here** rather than hidden — it does not reduce a structure owner's rate, and a skill
  silently vanishing from a panel reads as a bug. Accounting applies at every location.
- **Standings** are worth naming beside the skills on the station path, since they move the fee the
  same way and are read for the same character. Changing the selected character changes the fee.
- A **what-if mode**: a level is tweaked and every dependent figure re-derives — fee, tax, net return,
  break-even. It answers whether a skill is worth training for what this player actually builds.

**No training times.** Time-to-level depends on attributes and implants, neither of which the app
reads. A short row states levels short; the what-if figures answer the worth question honestly.

**What-if state is local and never persisted.** It belongs in component state, not on the job document,
and must not leak into Cost Breakdown or Returns — otherwise a player returns later and reads a figure
that was never true.

**Signed out:** the *required* group renders from `activeJob.skills` with the levels column absent.
The panel is signed-in only today; this makes the requirement readable without an account.

**Done when:** the three groups render; what-if re-derives the dependent figures; nothing is persisted;
the signed-out path shows requirements.

## Stage J — Mobile layouts

The materials table is the only element that genuinely cannot survive a full-width stack; everything
else is already a vertical arrangement.

- Materials becomes **cards**: name and chip on one line, the four figures on the next.
- Both popovers become **bottom sheets**, which also fixes the current centre-anchored source popover
  being unusable at 360px.
- Figures shorten; labels never truncate. Full values stay available on tap.

**Done when:** every panel is usable at 360px; no label is clipped; the basis picker and the drawer
both open as sheets.

## Wire compatibility

| Surface | Change | Compatibility |
|---------|--------|---------------|
| Stored document shapes | **None** | This project stores nothing new. Saved citadels move to the custom-structure work, which owns the lane, the schema bump and the migration — § Handed to the custom-structure work |
| Base rates and coefficients | Moved into `defaultValues.jsx` | **No wire surface.** SPA constants; a game change ships as a release, not a migration |
| `defaultCitadelBrokersFee` | Unchanged | **Compatible.** Kept for the Selling stage, and left alone here |
| `/api/v1/market-prices` | None | Unchanged. All four figures are already served |
| `layout.*` price overrides | None | Stage D is presentation over the existing shape |
| Job document — speculative children | None | Speculative jobs live in `temporaryChildJobs`, which is not persisted |

## Design reference

The visual design these stages build to — every panel on the app shell surface in both themes, the
stage in context, the mobile layouts, and the reasoning behind each — is the design proposal published
for this work: <https://claude.ai/code/artifact/9520969e-6359-4d76-8030-bdd7330f6c93>

It is a **design reference, not SoT**: where it and this plan disagree, the plan wins, and both are
superseded by live docs on promote. Sections worth reading before building the stage they cover:

| Section | Covers |
|---------|--------|
| §3–§6 | The four panels, each in light and dark on the app shell surface |
| §7a | The pricing basis picker and the four server price modes |
| §7b | The sale location: the station-vs-citadel rate block, the picker, the add-a-citadel form |
| §8, §9 | The two behavioural changes, drawn as before-and-after flows |
| §10 | Mobile layouts for every panel |

It also records two **rejected drafts** of the Returns panel — one that mixed a toggle, a ledger and
the exit routes, and one that led with a graded verdict word — both worth reading before rebuilding it,
so neither failure mode is repeated.

## Stage status

| Stage | Surface | Status |
|-------|---------|--------|
| Phase 1 — project folder and docs | docs | **Done** |
| A — sale locations and their rates | SPA | **Done.** Storing citadels is handed to the custom-structure work |
| B — fee and tax estimation | frontend logic | **Done** |
| C — Accounting in skill catalogue | data | **Done** |
| D — pricing basis in panel headers | SPA | **Done** — picker built; Stages E and F mount it |
| E — Materials & Sourcing | SPA | Not started |
| F — Cost Breakdown and Returns | SPA | Not started |
| G — speculative child jobs | SPA, behavioural | Not started |
| H — jobs with parent jobs | SPA, behavioural | Not started |
| I — Skills as a model | SPA | Not started |
| J — mobile layouts | SPA | Not started |

## Start here

Consumers read sale locations through `Functions/MarketOrders/saleLocations.js`, which returns two
placeholder citadels until the stored list exists — so Stages B, D and F can be built and tested now,
and the stored rows slide in as a change to that one file.

Stage A is complete. `brokerFeeRates`, `salesTaxRates` and `marketSkillIDs` are in `defaultValues.jsx`,
and `calcBrokersFee` reads the fee ones rather than holding literals.

Stages B and C are done too. `Functions/MarketOrders/sellingRates.js` holds a rate function and an
amount function for each charge, and `calcBrokersFee` is now those functions rather than a second copy
of the formula. Nothing calls the tax half yet — it is built so the Selling stage can, without the
Planning stage having shaped it for itself first.

Stage D is done: `Styled Components/Select/pricingBasis.jsx` is the picker, and
`Functions/MarketData/materialPricing.js` holds the figures behind it — what the job's materials cost
on each basis, and whether a row is an estimate or already paid. Nothing mounts them yet.

**Stage E is next**: Materials & Sourcing, which absorbs Raw Resources and is the first panel to mount
the picker.

**Storing saved citadels is no longer this project's.** The lane, its schema bump, its migration and its
editing surface all go with the custom-structure work being taken separately; § Handed to the
custom-structure work carries what this project worked out, including the collection backup that work
will need before its upgrader writes anything.

## Open questions

These are named rather than decided, because each changes what gets built:

- **Does the pricing-model toggle set the model the rest of the app costs against, or only what Cost
  Breakdown displays?** Display-only is cheaper and safer; app-wide makes the toggle meaningful but
  touches every consumer of the job's cost.
- **How deep do speculative child jobs recurse?** One level is proposed; deeper is more accurate and
  unbounded.
- **Does a Price Entry purchase price override the basis automatically, or only when the row is told
  to?** Automatic is what a player probably expects; explicit is predictable.
- **Can a job override the planner's default sale location, or is the lane's `Default` the whole
  selection?** Stage F draws a rate block on Returns but specifies no stored per-job choice, so today
  the answer is one citadel per planner. A per-job override means a new setup-time field — `JobSetup`
  is where the comparable `CustomStructureID` lives — and a job document change this project does not
  otherwise make.
- **Where is a saved citadel edited from — Returns, or application settings?** Settings is where the
  form is built, since it is where the rest of the `CustomStructures` family is managed and where the
  asset-location picker already exists. Whether the rate block inside Returns also reaches it — the
  place a player notices a rate is wrong — is the part still open.
- **Is the fee estimate quoted for the setup's selected character, or the account's main?** Standings
  are per character, so the two can differ materially at a station. The setup character is the
  consistent choice, but a player planning a build to be sold by an alt would want to say so.
