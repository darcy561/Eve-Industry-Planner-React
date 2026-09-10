# Asset collection (`frontend/src/Functions/Assets`)

Live SoT for the asset node shape, how a node's location and compartment are resolved, the
corporation asset union, and how the asset library, the assets dialogue and the shopping list each
assemble a view from the collection instead of walking the raw rows themselves. Package:
[`frontend/src/Functions/Assets`](../../../frontend/src/Functions/Assets).

The index hook, the shared derivation cache and the owner vocabulary this topic uses are one thing,
owned by [row-collections.md](./row-collections.md) — read that for `useAssetIndex` and its scopes,
not here. Location and container *names* are [location-names.md](./location-names.md)'s. Where a
blueprint sits, which reads this collection, is [blueprints.md](./blueprints.md)'s.

## The node shape

`buildAssetNodes(rows)` (`buildAssetNodes.js`) turns raw ESI asset rows into one node per item, pure
and synchronous. It returns the node list in input order and a `Map` from `item_id` to node.
`buildAssetCollection(sources, owners)` is the multi-owner form — several raw row arrays and a
parallel owner list — used to build the corporation union below without losing which member's fetch
a stack came from; `buildAssetNodes` is `buildAssetCollection` for the single-owner case.

| Field | Holds |
|-------|-------|
| `itemId`, `typeId`, `quantity`, `flag` | as ESI gives them; `flag` is the raw `location_flag` |
| `isSingleton` | assembled, or otherwise unable to stack |
| `owner` | `{ kind, id }` — see [row-collections.md](./row-collections.md) § Owner vocabulary; `null` for a single-owner build |
| `parentId` / `childIds` | the holding asset's `item_id`, or `null` when held directly by a location; children ordered once, by type then item id |
| `locationId` | resolved: the station, structure, system or asset-safety sentinel the chain ends at |
| `locationKind` | resolved: what that id refers to — see below |
| `rootFlag` | resolved: the compartment the node sits in at that location |
| `depth` | resolved: distance from that location |

## Resolution rules

- **A holder outside the set is a location.** Resolution stops there — routine rather than an error,
  since a corporation member sees only the offices their roles reach, and ESI returns a ship's fitted
  modules while it is in space without returning the ship itself.
- **`locationKind` comes from the id's range** (`assetLocationConstants.js`, `resolveLocationKind`):
  asset safety is the sentinel `2004`, `30000000`–`32000000` and `32000000`–`33000000` are New Eden
  and abyssal systems, `60000000`–`64000000` are stations, and anything else is a structure. A row's
  `location_type` cannot separate a structure from a container — both arrive as `"item"` — so the
  range answers it from the id instead.
- **A place flag stops resolution there rather than inheriting further.** `OfficeFolder`, `Hangar`,
  `Deliveries`, `CorpDeliveries`, `CorporationGoalDeliveries` and `AssetSafety` mark a node as sitting
  *at* a place rather than being held by whatever row its `location_id` names, which is what lets a
  corporation's own structure be its own location rather than the system beyond it.
- **An office folder is a wrapper, not a compartment.** A hangar division inherits its own flag
  (`CorpSAG3`) rather than the `OfficeFolder` above it; everything below the division inherits the
  division.
- **Cycles terminate.** A malformed chain is cut at the row that closes it, so rows hanging beneath a
  cycle keep their holder regardless of row order.
- **A row is kept once per `item_id`.** The corporation union below deduplicates the same row as it
  arrives from more than one member.

`assembledShipIds.js` and `assetPresentation.js` build on the node shape rather than extending it.
`assembledShipIds` finds assembled hulls from `isSingleton`, the SDE `category_id`, and — for a hull
the static item list carries no category for — whether the node holds children flagged as ship
fittings (`HiSlot`, `MedSlot`, `LoSlot`, `SubSystemSlot`, `SubSystemBay`, `DroneBay`, `FighterBay`,
`FighterTube`, `FrigateEscapeBay`, `Specialized`; deliberately not `RigSlot`, which an Upwell
structure also carries). `assetPresentation.js` resolves the image url — an ancient relic
(`category_id` 34) is served only as its `relic` variant — and the display name, falling back to
**`"Unknown Item - <type_id>"`** for a type the static item list does not name: the static list names
every *published* type, so an unpublished one — a SKIN component, a removed item, a test-server
oddity a player still holds — renders this way regardless of whether it has a resolvable category.
The same fallback applies to a blueprint's type; [blueprints.md](./blueprints.md) points back here
rather than restating it.

## The corporation asset union

Roles gate access to individual offices, hangars and divisions, so no single character's fetch sees
a corporation's whole asset set. The account's view is the **union** of what each tracked member can
see. `useAssetIndex`'s `corporation` scope fans a query out over every member and hands the merged
rows — one array per member, with its owner attached — to `buildAssetCollection`, which deduplicates
by `item_id` as it merges.

`Hooks/EveEsi/useGetSingleCorporationAssets.js` performs the same per-member fan-out and dedup
independently, for the shopping list's corporation hooks, which read the merged rows directly rather
than through the node collection.

## Assembling a view

| Need | Reads |
|------|-------|
| The rows at one location, grouped by type | `assetsAtLocation.js` |
| Everything under one location or compartment, for a library tree | `assetTree.js` (`assetRowsByLocation`, `orderLocations`), consumed by `Hooks/EveEsi/useAssetTree.js` |
| The flat, virtualisable row list a tree renders | `flattenAssetTree.js` — a row's `key` names what it is rather than where it sits, so an expansion `Set` owned by the page survives a refetch or a reorder |
| Where a type is held, and the containers on the path to it | `assetsOfType.js` — everything on a path to a matching stack is kept, and everything inside a match; an office folder is read through rather than shown |
| Named locations for a dropdown | `Hooks/EveEsi/useAssetLocations.js`, pairing `useAssetIndex` with [location-names.md](./location-names.md) |

`useAssetTree.js` pairs the node collection, the blueprint collection and the shared name query into
everything one asset view renders. Blueprints are always excluded from an asset view — they have
their own library, [blueprints.md](./blueprints.md) — except an ancient relic, which ESI returns from
the blueprints endpoint because it carries runs the way a copy does but is a material a player holds,
not a blueprint.

## Topic-only detail

- A module fitted to a ship that is itself in space names the ship as its location, and the ship's
  `item_id` falls in the structure id range, so it is asked for as a location and settles as
  unreadable. It costs one name lookup and is never displayed.
