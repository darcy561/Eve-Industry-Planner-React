# Blueprint collection (`frontend/src/Functions/Blueprints`)

Live SoT for the blueprint row shape and what the fetch layer stamps onto it, the walk that reads a
corporation's blueprints as a single access point, and how the library, the Edit Job blueprint panels
and the job-setup helpers each read the collection instead of joining the search index or the cache
themselves. Package:
[`frontend/src/Functions/Blueprints`](../../../frontend/src/Functions/Blueprints).

The index hook, the shared derivation cache and the owner vocabulary this topic uses are one thing,
owned by [row-collections.md](./row-collections.md) — read that for `useBlueprintIndex` and its
scopes, not here. A blueprint's location comes from the asset collection —
[assets.md](./assets.md) — and location *names* are [location-names.md](./location-names.md)'s.

## The row shape

`buildBlueprintRows(rows, searchIndex)` resolves each row against the cached search index once, and
returns the row list in input order, a `Map` from `item_id` to row, and a `Map` from `type_id` to
that type's rows.

| Field | Holds |
|-------|-------|
| `itemId`, `typeId`, `me`, `te`, `runs`, `quantity` | as ESI gives them; `quantity` is `-1` for an original, `-2` for a copy, positive for a stack of originals |
| `isCopy` | `quantity === -2`, decided once |
| `originalCount` | originals this row represents — `quantity` when positive, `1` for an untouched original, `0` for a copy. A manufacturing original only stacks fresh from the market; a reaction formula carries no research or job state and restacks after every use, so a stacked formula is its ordinary condition rather than an edge case |
| `ownerType` / `ownerId` | `"character"` with a CharacterHash, or `"corporation"` with a corporation id — see [row-collections.md](./row-collections.md) § Owner vocabulary |
| `locationId`, `flag` | raw; ESI gives a blueprint's holder as a station, a ship, or a container's `item_id` — turning it into a place needs the asset collection, resolved where the two are shown together, not at build time |
| `productTypeId` / `jobType` | resolved from the search index, by blueprint `type_id`; `null` when the index carries no match |

Rows of the same type are ordered once — originals before copies, then by `me` then `te` — so a
consumer wanting the best-researched original or the library's default order reads `byTypeId` as it
is rather than sorting again.

The builder does **not** collapse repeated `item_id`s. A corporation's blueprint list is a single
access point (below): a repeat means the fetch happened more than once, which is what the corporation
re-key prevents rather than something the builder should hide.

A type the static item list does not name renders as `"Unknown Item - <type_id>"`, the same fallback
[assets.md](./assets.md) § The node shape states for an asset row.

## Corporation blueprints as a single access point

Any member holding the required role sees a corporation's whole blueprint list, so the query is keyed
by corporation id rather than by character: one call serves every tracked member rather than one per
director.

`Functions/EveESI/corporationAccess.js`'s `readAsAuthorisedMember(memberHashes, attempt)` is the walk
behind this and every other corporation-scoped collection: it tries each member in order and returns
the first one's rows that is not refused. A fetcher must report a refusal as `{ forbidden: true }`
alongside its empty rows rather than folding it into a plain empty result — a 403 and a corporation
that genuinely holds nothing are otherwise the same value, and the walk cannot tell whether to try the
next member. `corporationMembers(corporationId)` is the ordered list the walk tries, read from the
account's corporation roster.

The five non-blueprint corporation collections read through the same walk; how often and under which
phase each of them fetches is [prefetch.md](./prefetch.md)'s table, not restated here.

## Consolidation and stack counts

`consolidateBlueprints(blueprints, esiJobs)` gathers what the library shows as one card: rows of the
same type, held by the same owner, with the same research, the same runs remaining, and both original
or both copy are one interchangeable stack. A row with an active industry job never joins a stack — it
is unavailable until the job finishes, and the job's own figures belong to that row alone, so it
stands apart with a key derived from its `item_id` rather than from what it would otherwise stack
with. `stackCount(stack)` is how many usable blueprints a card stands for, summed from each row's
`originalCount` rather than from a count of rows.

## Library filters

`filterLibraryBlueprints(rows, filter, industryJobs)` narrows the library to one of `all`, `active`,
`manufacturing`, `reactions`, `bpo`, `bpc`. Every test but `active` is an equality check against
`jobType` or `isCopy`, a field the row already carries; `active` joins to the industry jobs whose
`status` is `"active"`, by `blueprint_id` against `itemId`.

## Helper reads

These read the blueprint collection — through `getCachedBlueprintIndex`
([row-collections.md](./row-collections.md)) rather than the search index or the query cache
directly:

| Helper | Reads |
|--------|-------|
| `findBlueprintType.js` | `byItemId.get(id)?.isCopy` |
| `Functions/Helper/getAvailableBlueprints.js` | a `Set` of the rows' `typeId` (owned) and of their `productTypeId` (producible) |
| `Functions/Job Build/setupHelpers.js` | the first row of a type's group for the best-researched original — the builder already ordered originals-first, most-researched-first — and the sum of a group's `originalCount` for how many job slots a stack offers |

## Where a blueprint sits

`blueprintLocations(blueprints, assets)` cross-reads the asset collection: for each blueprint row it
looks its `itemId` up as an asset node and takes that node's resolved `locationId`. A blueprint the
loaded assets do not cover is absent rather than guessed at. `blueprintsAtLocation(rows, locationIds,
locationId)` narrows a row list to what resolves to one place, and `blueprintHolderLabel(blueprint,
locationName)` joins the owner name and the resolved place into the label the library shows.
`Hooks/EveEsi/useBlueprintLocations.js` is the hook form, pairing this cross-read with
[location-names.md](./location-names.md); it asks for every scope's assets, because the library holds
its results back until every location has a chance to resolve rather than drawing labels in one scope
at a time.
