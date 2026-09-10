# ESI collections — tests

Live SoT for test depth across the SPA's normalised asset and blueprint collections: the row
builders, the index hooks and their shared cache, the login collection table and scheduler, the
shared location-name resolution, and the consumers that read the collections instead of building
their own structure. Behaviour →
[frontend/esi-collections/contents.md](../../frontend/esi-collections/contents.md) for the task map
into the five topics; each row below links the specific one it tests. Module entrypoints →
[contents.md](./contents.md).

## Entrypoints

| Check | Where | Notes |
|-------|--------|--------|
| Whole suite | From `frontend/`: `npm test -- --run` | Vitest; no browser, no stack |
| Asset tree | `npx vitest run src/Functions/Assets` | Builder, resolution, and the consumer assemblies |
| Blueprint tree | `npx vitest run src/Functions/Blueprints` | Row builder, consolidation, library filter |
| Prefetch | `npx vitest run src/Functions/EveESI/prefetch` | Collection table and scheduler |
| Coverage | `npm run coverage` | `vitest run --coverage` |

Fixture rows for both collections live in `frontend/src/tests/assetFixtures.js` and
`frontend/src/tests/blueprintFixtures.js`, so a builder test and a consumer-assembly test read the
same rows — where a shared meaning change between two consumers would otherwise pass unnoticed.

## Coverage map

**Depth:** Strong on the builders, the index hooks and cache, the scheduler and location-name
resolution, and the pure consumer-side assemblies. Thin on the components that render the two
libraries — the tree, the cards, the scope and filter chrome — which carry targeted tests for
specific behaviours rather than exhaustive coverage of the reshaped page.

### Tested

| Area | Topic | What the tests cover |
|------|-------|----------------------|
| `Functions/Assets/buildAssetNodes.js` | [assets.md](../../frontend/esi-collections/assets.md) | Nested containers, corporation offices and hangar divisions, Deliveries and asset safety, a holder outside the set, a fitted module whose ship is in space, a structure classified by id range, a self-holding row, a cyclic chain with a well-formed row beneath it, order independence, an empty list |
| `Functions/Blueprints/buildBlueprintRows.js` | [blueprints.md](../../frontend/esi-collections/blueprints.md) | The search-index join and a blueprint missing from it, a missing index entirely, originals against copies against a market stack, both owner types, type grouping and its order, and that repeated corporation rows stay visible rather than being collapsed |
| `Hooks/EveEsi/useAssetIndex.js`, `useBlueprintIndex.js` | [row-collections.md](../../frontend/esi-collections/row-collections.md) | Each scope's subscription, a corporation fetched once however many members it has, a corporation asset union across members, two consumers receiving the same collection object, and loading and error states |
| `Functions/Shared/collectionCache.js` | [row-collections.md](../../frontend/esi-collections/row-collections.md) | A hit on unchanged sources, a rebuild when any source, the source count, or the extra key changes |
| `Hooks/EveEsi/Character/useGetAllCharacterBlueprints.test.jsx` | [row-collections.md](../../frontend/esi-collections/row-collections.md) | The hook and its cache-reading counterpart return the same shape |
| `Functions/EveESI/prefetch/scheduler.js` | [prefetch.md](../../frontend/esi-collections/prefetch.md) | The table's contents pinned by name, per-character, per-corporation and per-division expansion, on-demand collections planning nothing, phase order within and across callers, the concurrency cap for one caller and for two, one fetch claimed once across callers, a caller arriving after an earlier drain finished, deferral when a rate-limit bucket is spent, the query gate closing the prefetch, and a failure reported without abandoning the rest |
| `Functions/EveESI/World/resolveLocationNames.js`, `Hooks/EveEsi/useLocationNames.js` | [location-names.md](../../frontend/esi-collections/location-names.md) | The walk stopping once every location is named, retrying past a refusal, settling on a refusal only when every character has failed, asking a later character only about what is still unnamed, writing the store exactly once, asking only for what the store lacks, not asking at all when the store already holds everything, reporting a failure, and two consumers asking once |
| `Functions/Assets/assetsAtLocation.js`, `assetsOfType.js`, `assetTree.js`, `flattenAssetTree.js` | [assets.md](../../frontend/esi-collections/assets.md) | Assets placed directly, one and two containers deep, another location excluded, an empty location, a missing collection, a hangar division including a crate's contents, the containers on a path to a match kept with everything inside the match, and row keys stable across a rebuild |
| `Functions/Blueprints/consolidateBlueprints.js`, `blueprintLocations.js`, `blueprintsAtLocation.js`, `blueprintHolderLabel.js`, `filterLibraryBlueprints.js` | [blueprints.md](../../frontend/esi-collections/blueprints.md) | Interchangeable rows stacked into one card, a blueprint with an active job standing alone, a stack's slot count, a blueprint resolved through the asset collection and one the loaded assets do not place, each of the six library filters, and a reaction formula belonging to neither the original nor the copy view |
| `Functions/Shared/findBlueprintType.js`, `Functions/Helper/getAvailableBlueprints.js`, `Functions/Job Build/setupHelpers.js` | [blueprints.md](../../frontend/esi-collections/blueprints.md) | Originals against copies against reaction formulas, a blueprint the account does not hold, the owned and producible sets, the best-researched original, and a stack of originals offering every slot it holds rather than one |
| `Components/Edit Job/.../manufacturingLayout.jsx`, `reactionLayout.jsx` | [blueprints.md](../../frontend/esi-collections/blueprints.md) | The values each panel renders, a stack counted as the blueprints it holds, and that neither writes to the rows it renders |
| `Hooks/EveEsi/useAssetTree.js`, `useAssetLocations.js` | [assets.md](../../frontend/esi-collections/assets.md) | Assembling a view from the collections and the shared name query, and the location lists offered for a dropdown |
| `Hooks/EveEsi/useBlueprintLocations.js` | [blueprints.md](../../frontend/esi-collections/blueprints.md) | Resolving a blueprint's place through the asset collection and naming it |

### Thin

- The asset library's own components (`Components/Assets/assetLibraryView.jsx`, `Tree/assetTree.jsx`,
  `assetScopePicker.jsx` — [assets.md](../../frontend/esi-collections/assets.md)) and the blueprint
  library's (`BlueprintLibrary.jsx`, `blueprintGroup.jsx`, `blueprintGroupActions.jsx` —
  [blueprints.md](../../frontend/esi-collections/blueprints.md)) each carry rendering tests for
  specific scenarios — a character's
  assets, a corporation's offices, hiding assembled ships, an ancient relic, virtualisation mounting
  only what is near the viewport, a group's card states, a group's build and archive actions — rather
  than exhaustive coverage of the reshaped page: `BlueprintLibrary.jsx` has one test, and the combined
  scope picker, the search box that matches a container or a location, and the blueprint location
  filter are not driven together against a realistic account.
- The shared render chrome the reshape introduced (`Styled Components/Select/AppShellSelect.jsx`,
  `Chip/filterChipGroup.jsx`, `Avatar/OwnerAvatar.jsx`,
  `autocomplete/virtualisedListbox.jsx`, `autocomplete/virtualisedLocationSearch.jsx`) is tested in
  isolation for its own contract — value in, value out, what it shows with nothing to choose from —
  not for how the library pages compose it.

### Little / none

- Browser-level end to end: there is no Playwright or equivalent, so nothing drives a full page —
  picking a scope, opening a location, searching, narrowing by filter — through a real browser.

## Topic-only detail

- Depth labels → [contents.md](./contents.md) § Depth labels.
- A builder test and its matching consumer-assembly test read the same fixture rows, which is what
  would catch a shared meaning change between two consumers — for example a resolution rule the
  builder changes silently breaking an assembly that assumed the old one.
