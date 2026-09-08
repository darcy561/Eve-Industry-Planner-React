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

Backend and shared-model work runs first, and for a specific reason rather than convention: **the SPA
work depends on figures that do not exist yet.** Cost Breakdown cannot draw a sales-tax row until the
rates are stored settings, and Returns cannot state a net return until the fee estimate resolves. Doing
the panels first would mean building them twice — once against placeholder figures and again when the
real ones land.

```
Stage A  sale locations and their rates                 backend, Go, schema
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
| The account / planner settings split | [shared-planners](../shared-planners/plan.md) | That `planner.Settings` is where a setting a job's costing depends on belongs. Stage A adds a saved-citadel list to both documents, following `CustomStructures`, which is already on both |
| Settings write shape | [document-write-granularity](../document-write-granularity/plan.md) | Nothing. Stage A adds fields; whatever write shape that project settles applies to them unchanged |
| Server price figures | live SoT, [backend/](../../backend/contents.md) | That `buy`, `sell`, `buyP95` and `sellP05` are served per hub and stay served. This project reads them and adds no querying |

## Stage A — Sale locations and their rates

**Backend. Go. Schema change with a migration.**

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

**A citadel's rate is set by its owner.** It is a flat percentage the structure owner chose, and the
player either knows it or does not. Standings do not enter into it — there is no faction and no NPC
corporation to hold standing with. **Broker Relations does not reduce it either**, which is why
`calcBrokersFee` applies the supplied `citadelBrokersFee` verbatim rather than running it through the
skill term.

Sales tax is a third case again: it is derived from Accounting alone, at every location, station and
citadel both. It has no station or structure component, which is why it belongs on the character rather
than the location.

| | Broker fee | Sales tax |
|---|---|---|
| **NPC station** | Derived: base, less Broker Relations, less faction and corp standings | Derived: base, less Accounting |
| **Citadel** | The owner's rate, supplied by the player, verbatim | Derived: base, less Accounting |

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
| **A citadel the player sells from, its fee, and the hub it prices against** | **Document** | The fee is the one figure the app can neither derive nor look up — a fact about someone else's structure that only the player knows. The hub is a `MARKET_OPTIONS` id, stored because a structure has no market data and something has to say which prices apply |

So the backend surface is **one list**, not a rate table. Nothing that can be computed from a constant
or fetched from ESI is persisted, which also means a game change to a base rate ships as an SPA change
rather than a migration over every account.

### The shape

```go
// SaleCitadel is a structure a player lists orders from. Its broker fee is set by
// the structure's owner and can be neither derived nor fetched, so the player
// supplies it. PriceHub names which of MARKET_OPTIONS its figures are priced
// against, since a structure carries no market data of its own. Nothing else is
// stored: sales tax comes from the character's Accounting skill, and the base rates
// are SPA constants.
type SaleCitadel struct {
    ID            string  `bson:"id" json:"id"`
    Name          string  `bson:"name" json:"name"`
    BrokerFeeRate float64 `bson:"brokerFeeRate" json:"brokerFeeRate"`
    PriceHub      string  `bson:"priceHub" json:"priceHub"`
    Default       bool    `bson:"default" json:"default"`
}
```

This follows `CustomStructure`, which is already a user-defined named location carrying its own rate
and selectable per setup. It carries no `SkillsApply` flag and no standings: **a citadel fee is not
reduced by Broker Relations**, so there is nothing to opt in or out of. An earlier draft of this stage
had such a flag; it was wrong, and it would have produced fees the Selling stage disagrees with.

`PriceHub` is a `MARKET_OPTIONS` id, not a copy of anything from it. A citadel has no market data, so
a job selling from one still prices against a hub, and asking once per citadel beats asking on every
job. It also makes the assembly explicit rather than hidden: **prices from one location, fee from
another**, which the rate block states wherever a figure is shown.

A preset hub is not stored — it stays an entry in `MARKET_OPTIONS` and takes the derived path.

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

- Lift the base rates and coefficients out of `calcBrokersFee` into `defaultValues.jsx`, beside
  `structureOptions`. They are game constants and currently magic numbers; this is the one source of
  truth both stages read.
- Add `SaleCitadels []SaleCitadel` to `models.ApplicationSettings` and `planner.Settings`, following
  `CustomStructures`, which is already on both documents. **This is the only new stored field.**
- `DefaultCitadelBrokersFee` **stays as it is.** The Selling stage reads it for real orders and that
  path is out of scope. Seed a player's first saved citadel from it so an existing setting is not
  silently dropped, but do not migrate the field away.
- Bump `ApplicationSettingsSchemaCurrent` and `planner.SettingsSchemaCurrent`, and teach
  `documentschema.Upgrader` to seed the new fields on read. `LoadApplicationSettings` already upgrades
  on read and persists the upgrade back, so no separate migration pass is needed.
- Extend the doc-shape and schema-upgrade parity tests, which assert the persisted field set.
- Expose the field wherever the settings endpoint already exposes `customStructures`.

The interface these rates are read and edited through is settled in the design reference — the rate
block that shows a station's working and a citadel's single line, the location picker, and the
add-a-citadel form. It is built in Stage F, where the panels that consume the figures are built; this
stage supplies the data it reads.

**Back up before writing.** The upgrade-on-read path rewrites `application_settings` and the planner
settings collection. Both must be copied before the first write, and the copies restorable through an
`eip cli` command, with a round-trip test — back up, mutate, revert, compare.

**Done when:** a fresh account and a fresh planner carry the field at the current schema version; a
document at the previous version is upgraded on read, persisted back, and its first citadel seeded from
the existing fee; the base rates resolve from the SPA constant with no request; parity tests cover
both; the backup and its revert exist with a round-trip test.

## Stage B — Fee and tax estimation

**Frontend logic. No UI.**

`calcBrokersFee` takes an order-shaped object and returns ISK. Planning needs the same rates against a
planned sale rather than a real order, and against a location that may be one the player defined.

- **Split the rate from the ISK.** Extract rate resolution into its own function so both stages share
  one formula rather than the planner growing a second copy. `calcBrokersFee` then becomes that
  function plus a multiplication and the existing floor.
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

**Done when:** one rate function serves both stages; the station path derives from skill and standings
and the citadel path does not; tax derives from Accounting at both; the estimate is derivable for a
signed-out user; tests cover the station path, the citadel path, and the signed-out fallback, and agree
with the existing `calcBrokersFee` tests.

## Stage C — Accounting in the skill catalogue

**Data.**

`bpSkills.json` carries Broker Relations (3446) but not Accounting. Stage I needs both, and Stage B
needs Accounting to apply a skill reduction to the tax rate. One entry, in the file that is already the
catalogue.

**Done when:** Accounting resolves by type id through the same lookup as every other skill.

## Stage D — Pricing basis in the panel headers

The listing dropdown already offers `buy`, `sell`, `buyP95` and `sellP05`, and
`useMaterialPricingModel` already resolves them per material through three precedence levels. The
percentiles are computed by the worker, served by the API, labelled by `getListingModeLabel` — and
effectively invisible, because a row prints the resolved choice as 10px caption text with nothing to
say why one mode would beat another.

- The basis moves into the **panel header** it governs — Materials & Sourcing owns the material basis,
  Returns owns the sale hub, Cost Breakdown owns the build-vs-buy model. `AppShellPanel` already takes
  an `action` for exactly this.
- The picker shows the four modes **with what each does to this job's total**, so the trimmed figures
  stop reading as jargon.
- A per-row override widens to name the mode as well as the hub, and a row whose material has a Price
  Entry purchase price says **Paid** rather than showing an estimate for something already bought.

**No stored shape changes.** `layout.localMarketDisplay`, `layout.localOrderDisplay` and
`materialPriceOverrides` already hold exactly a hub id and one of the four listing ids. This stage is
presentation over data that exists.

The pricing basis is the first of two shared inputs; the second is the sale location, which Stage F
renders inside Returns. They are separate because one decides what materials cost and the other what
selling costs, and a job can price at one hub while selling from a structure beside another.

**Done when:** the basis is set from the header of each panel that uses it; the four modes are
selectable with their effect shown; overrides behave as they do today.

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
| `models.ApplicationSettings` | New `saleCitadels` list | **Additive.** Upgrade-on-read seeds it; an older client ignores an unknown field |
| `planner.Settings` | Same field | **Additive**, same mechanism |
| Base rates and coefficients | Moved into `defaultValues.jsx` | **No wire surface.** SPA constants; a game change ships as a release, not a migration |
| Settings schema versions | Both bumped | **Migrate-required** on read, handled by the existing upgrader; a document at the old version is upgraded and persisted back |
| `defaultCitadelBrokersFee` | Unchanged | **Compatible.** Kept for the Selling stage; a first saved citadel is seeded from it rather than migrating it away |
| `/api/v1/market-prices` | None | Unchanged. All four figures are already served |
| `layout.*` price overrides | None | Stage D is presentation over the existing shape |
| Job document | None | Speculative jobs live in `temporaryChildJobs`, which is not persisted |

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
| A — sale locations and their rates | backend, Go, schema | Not started |
| B — fee and tax estimation | frontend logic | Not started |
| C — Accounting in skill catalogue | data | Not started |
| D — pricing basis in panel headers | SPA | Not started |
| E — Materials & Sourcing | SPA | Not started |
| F — Cost Breakdown and Returns | SPA | Not started |
| G — speculative child jobs | SPA, behavioural | Not started |
| H — jobs with parent jobs | SPA, behavioural | Not started |
| I — Skills as a model | SPA | Not started |
| J — mobile layouts | SPA | Not started |

## Start here

Phase 1 is complete. Stage A is the next work, and is backend: it needs `go fix -diff` on
`services/shared/models`, `services/shared/models/planner` and `services/shared/mongo` before the
fields are added, and the collection backup in place before the upgrader writes anything.

## Open questions

These are named rather than decided, because each changes what gets built:

- **Does the pricing-model toggle set the model the rest of the app costs against, or only what Cost
  Breakdown displays?** Display-only is cheaper and safer; app-wide makes the toggle meaningful but
  touches every consumer of the job's cost.
- **How deep do speculative child jobs recurse?** One level is proposed; deeper is more accurate and
  unbounded.
- **Does a Price Entry purchase price override the basis automatically, or only when the row is told
  to?** Automatic is what a player probably expects; explicit is predictable.
- **Does a saved citadel belong to the account or the planner?** `CustomStructures` is on both
  documents, so the precedent says both — but a planner shared between members raises whose structure
  rates apply when two members sell from different places.
- **Where is a saved citadel edited from — Returns, or application settings?** The design reaches the
  picker and the form from the rate block inside Returns, which is where a player notices the rate is
  wrong. A settings page is the conventional home and `CustomStructures` already has one; both is
  probably right, and the question is which is built first.
- **Is the fee estimate quoted for the setup's selected character, or the account's main?** Standings
  are per character, so the two can differ materially at a station. The setup character is the
  consistent choice, but a player planning a build to be sold by an alt would want to say so.
