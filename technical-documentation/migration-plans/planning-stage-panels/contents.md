# Planning stage panels

## Owns

The Edit Job **Planning** stage: what its panels ask, what they answer, and the figures they need to
answer it.

- The **split of the market panel**: `MaterialCostPanel` currently carries product revenue, material
  cost, the buy-vs-build comparison and the pricing configuration, and what replaces it.
- The **material list rendered once** rather than in Raw Resources and again in the cost rows, and the
  per-row buy-vs-build comparison that replaces four ungrouped figures.
- **Selling costs at plan time**: the broker fee paid to list an item and the sales tax paid on the
  sale, estimated on the Planning stage rather than first appearing on Selling, deriving what can be
  derived and taking the rest from the player.
- **Sale locations and their rates**: an NPC station's broker fee derived from the character's skill
  and standings, a citadel's supplied by the player because its owner sets it, and the sales tax rate
  derived from Accounting at both. Only the citadel list is stored; the base rates and coefficients are
  SPA constants.
- The **pricing basis** a figure is quoted on — which of the four server-served price modes
  (`buy`, `sell`, `buyP95`, `sellP05`) a row used, and how a player is shown what each does.
- **Speculative child jobs**: costing a buildable material's build before the player commits to it,
  so the comparison exists before the decision rather than after.
- What a job with **parent jobs** shows, given its output is committed and never listed.
- The **Skills panel** as a model of what a build costs rather than a pass/fail gate, including the
  market skills that drive the fee and tax figures.
- The **archive figures** used as context beside an estimate, and where they render.

## Does not own

- **How market prices are produced.** The worker's region order-book reduction, the percentile
  constants, the Redis entry and `/api/v1/market-prices` are live SoT under
  [backend/](../../backend/contents.md). This project consumes the four figures already served and
  adds no market querying of any kind.
- **The Market Data dialogue.** It stays a per-item, user-initiated ESI read. No figure on the
  Planning stage is derived from it, and this project does not automate it.
- **The Price Entry dialogue's own behaviour** — how a purchase price is captured and distributed
  across jobs. This project only surfaces *that a material has one* on the material row.
- **The Selling stage.** The sale-line matching stays as it is, and the Selling stage remains
  authoritative for what was actually charged. This project splits the rate out of `calcBrokersFee` so
  both stages share one formula, and leaves `defaultCitadelBrokersFee` in place for the real-order
  path.
- **Install cost calculation.** `getJobInstallCostForPlanning` and the system-index inputs are
  unchanged; this project only re-files the figure it returns.
- **The planner settings split.** Which settings are account-scoped and which are planner-scoped is
  [shared-planners](../shared-planners/contents.md)' decision. This project adds saved citadels and a
  tax base rate to both documents and follows the split as it stands — see [plan.md](./plan.md) § What this project
  inherits.
- **Document write granularity.** Settings and job writes keep whatever shape
  [document-write-granularity](../document-write-granularity/contents.md) leaves them in.
- Live SPA and backend behaviour, promoted only when this project closes.

## Task map

| I need to… | Read |
|------------|------|
| Understand what is wrong with the panel today | [plan.md](./plan.md) § Starting position |
| See the three panels and what each answers | [plan.md](./plan.md) § Target shape |
| Know why the backend work comes first | [plan.md](./plan.md) § Ordering |
| Find the sale location shape and its migration | [plan.md](./plan.md) § Stage A |
| Understand why a station and a citadel are priced differently | [plan.md](./plan.md) § Stage A, § Two location kinds, two mechanisms |
| See how a rate resolves at each location kind | [plan.md](./plan.md) § Stage A, § The resolution order |
| Know what is stored and what is an SPA constant | [plan.md](./plan.md) § Stage A, § What is stored, and where |
| Find where the rate block and citadel form render | [plan.md](./plan.md) § Stage F |
| See what the fee estimate reuses from Selling | [plan.md](./plan.md) § Stage B |
| Check what is additive and what breaks | [plan.md](./plan.md) § Wire compatibility |
| Understand the pricing basis and its four modes | [plan.md](./plan.md) § Stage D |
| See the speculative child job change and its cost | [plan.md](./plan.md) § Stage G |
| Know what a job with parents shows | [plan.md](./plan.md) § Stage H |
| See the stages and their order | [plan.md](./plan.md) § Stages |
| Check what has landed | [plan.md](./plan.md) § Stage status |
| See the visual design the stages build to | [plan.md](./plan.md) § Design reference |
| See how a part works while the project is in flight | [overlay.md](./overlay.md) |
