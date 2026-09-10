# ESI collections — behaviour overlay

**Rules:** Read and following [`../documentation-rules.md`](../documentation-rules.md)
and [`../technical-rules.md`](../technical-rules.md) (migration-plans).

While this project is active, this file is the overlay on top of live SoT: where it describes a
surface, it wins for that in-flight work. Where it is silent, live documentation remains the truth.

Each stage fills its section as it lands — what changed, and how that part works afterwards. Empty
sections mean the stage has not landed.

## Current behaviour (before this project)

### Assets

Asset rows arrive from ESI as a flat list and are cached per character hash (`characterAssets`) and
per corporation member (`corporationAssets`). Nothing derives a shared structure from them. Each of
the seven consumers listed in [plan.md](./plan.md) § Who reads assets today builds its own maps with
its own traversal, resolves location and container names itself, and writes the results into the
`worldData` store from inside its own effect.

A row's location and its hangar or asset-safety compartment are not stored; both are recovered by
walking parents at the point of use, by three separate implementations that disagree at the edges.

A corporation's assets are fetched once per tracked member because ESI returns only what each
character's roles permit, then merged and deduplicated by `item_id`. That fan-out is correct and
this project keeps it.

### Blueprints

Blueprint rows are fetched per character for both the character and the corporation endpoint, and
stamped at the fetch boundary with `CharacterHash`, `is_corporation`, and `character_id` or
`corporation_id`. Because the corporation query is keyed by character hash, a corporation with
several tracked directors fetches its whole list once per director and the aggregate concatenates
them without deduplication.

The aggregate hook and its cache-reading counterpart return different shapes for the same value, and
the eight consumers are split across both. Product type and job type are not stored on a row; each
consumer joins against the cached search index at the point of use.

### Login and call path

Login prefetches through two entry points: the session-apply step triggers the main character, and
the account sync then triggers every linked character. For each character, eight character queries
and six corporation queries are fired together, with characters processed three at a time. Every
prefetched query is forced enabled, overriding the logged-in and server-status gate the query
definitions carry.

Corporation collections are fetched once per character rather than once per corporation, so an
account with several characters in one corporation fetches that corporation's data several times.
Assets are prefetched by neither path and are fetched when a consumer mounts.

### Documentation

There is no live topic doc for either surface. `frontend/` currently owns auth, document lock and
lifecycle roadmaps only — see [`../../frontend/contents.md`](../../frontend/contents.md).

## Stage A — the shapes and their builders

_Landed._

### The asset nodes

`Functions/Assets/buildAssetNodes.js` turns raw ESI asset rows into one normalised node per item.
It is pure and synchronous — no ESI call, no store read — so a consumer that only counts quantities
never waits on a name round trip. It returns both the node list, in input order, and a
`Map` from `item_id` to node, because walking a chain upwards needs the lookup and having each
consumer rebuild it is the duplication the project exists to remove.

A node carries `itemId`, `typeId`, `quantity` and `flag` from the row, `parentId` and `childIds` for
the chain, and four fields resolved once at build time:

| Field | Resolved as |
|-------|-------------|
| `locationId` | the station, structure, system or asset-safety sentinel the chain ends at |
| `locationKind` | what that id refers to, from its range |
| `rootFlag` | the compartment it sits in at that location |
| `depth` | distance from that location |

The resolution rules:

- **A holder outside the set is a location.** Resolution stops there. This is routine rather than
  an error: a corporation member sees only the offices their roles reach, and the asset endpoint
  returns a ship's fitting but not the ship itself while it is in space.
- **`locationKind` comes from the id range**, per ESI's asset `location_id` reference — asset safety
  is the sentinel `2004`, systems are 30000000–32000000, abyssal systems 32000000–33000000, stations
  60000000–64000000, and anything else is a structure or a customs office. A row's `location_type`
  cannot answer this on its own: a player structure arrives as `"item"`, the same value a container
  carries, so separating them means walking the chain to find where it ends. The range answers it
  from the id. `resolveLocationKind` in `Functions/Assets/assetLocationConstants.js` owns it.
- **An office folder is a wrapper, not a compartment.** ESI links a corporation's `CorpSAGx` hangar
  divisions to their station or structure through an `OfficeFolder` row, so the compartment of an
  item in division 3 is `CorpSAG3` rather than the `OfficeFolder` above it. Everything below a
  division inherits that division.
- **Children are ordered once**, by type then item id, so no render pass sorts.
- **Cycles terminate.** A malformed chain is cut at the row that closes it — not at whichever row
  happened to be visited first — so rows hanging beneath a cycle keep their holder and the result
  does not depend on row order.

A row is kept once per `item_id`: a corporation's set is the union of its members' views, so the
same row arrives once per member that can see it.

Closes A4 and A5 by construction: no traversal recurses per consumer, so neither the missed-descent
nor the repeated-walk defect has anywhere to live.

### The blueprint rows

`Functions/Blueprints/buildBlueprintRows.js` takes the raw rows and the cached search index and
returns the row list in input order, a `Map` from `item_id` to row, and a `Map` from `type_id` to
the rows of that type — the grouping the library, the Edit Job panels and the job-setup helpers all
build separately today.

A row carries `itemId`, `typeId`, `me`, `te`, `runs` and the raw `quantity`, plus:

| Field | Resolved as |
|-------|-------------|
| `isCopy` | `quantity === -2`, decided once instead of at each call site |
| `originalCount` | originals the row represents; `0` for a copy |
| `ownerType` / `ownerId` | `"character"` with the CharacterHash, or `"corporation"` with the corporation id |
| `productTypeId` / `jobType` | the search-index join, by blueprint type id |

ESI's `quantity` is the source for two of those: `-1` is an original, `-2` a copy, and **a positive
value is a stack of originals**. Each original in a stack can carry its own job, so `originalCount`
is `quantity` when positive and `1` otherwise — a count of rows undercounts the slots available,
which is defect B9.

Manufacturing blueprints and reaction formulas reach a stack by different routes, and the difference
decides how often B9 bites. A manufacturing original becomes unstackable once it carries research or
job history, so a positive quantity on one really does mean untouched from the market. A reaction
formula has no such state — the SDE gives every formula a `reaction` activity and nothing else, no
`copying`, no `research_material`, no `research_time` — so formulas restack after every use. For
them `me` and `te` are always zero, `isCopy` is never true, and a stacked quantity is the everyday
condition rather than an edge case.

`locationId` and `flag` stay raw. ESI documents a blueprint's `location_id` as a station, a ship, or
a container's `item_id`, so turning it into a place needs the asset collection; that cross-read
happens where the two are displayed together rather than at build time.

Rows of the same type are ordered once — originals before copies, then by material and time
efficiency — which retires the comparator that ordered by stringified quantity and happened to put
originals first (defect B7).

The builder deliberately does **not** collapse repeated `item_id`s, where the asset builder does. A
corporation's blueprint list is a single access point returning the same rows to every authorised
character, so a repeat means the collection was fetched once per character rather than once per
corporation. Deduplicating here would leave those fetches in place and unobserved; Stage B's re-key
is the fix.

## Stage B — the query surface

_Landed._

### The index hooks

`Hooks/EveEsi/useAssetIndex.js` and `Hooks/EveEsi/useBlueprintIndex.js` each take a scope and return
one normalised collection for it, alongside `isLoading`, `isError` and `error`.

| Hook | Scopes |
|------|--------|
| `useAssetIndex` | `character`, `characters`, `corporation` |
| `useBlueprintIndex` | `character`, `characters`, `corporation`, `all` |

A scope subscribes only to the queries it needs, so asking for one character does not open every
character's query.

### Sharing the derived collection

`Functions/Shared/collectionCache.js` holds each built collection in a `WeakMap` keyed on the source
row arrays. React Query keeps a query's `data` referentially stable until a refetch replaces it, so
the same sources mean the same derived value, and an entry is collected when its query data is
replaced. Two components asking for the same scope receive the *same* collection object, which a
`useMemo` cannot deliver because it is per component instance.

The derivation happens in the hook body rather than inside `useQueries`' `combine`. React Query
structurally shares whatever `combine` returns, and a plain object holding the collection is walked
and rebuilt — handing each consumer a copy. Only the raw source arrays and the state flags come back
through `combine`; those survive structural sharing untouched, so the cache still hits.

### Corporation blueprints are keyed by corporation

`corporationBlueprintsQuery` now takes a corporation id rather than a character hash. ESI returns a
corporation's whole blueprint list to any member holding the role, so one query serves every member,
and a corporation with several tracked directors makes one call rather than one per director.

Its `queryFn` walks the corporation's members in order and stops at the first that is not refused.
For this to work `getCorpBlueprints` reports a 403 as `forbidden: true` alongside its empty rows
instead of returning a bare empty result — a refusal and a corporation that genuinely owns no
blueprints are otherwise the same value, and the walk has to tell them apart. The ESI rate-limit
bucket is per character, so the first member's bucket is the one this query's budget is drawn from.

`useGetAllCorporationBlueprints` iterates the account's corporations rather than its characters. Its
return shape, `{ [corporationId]: rows[] }`, is deliberately unchanged, so its consumers did not move
with the re-key.

The login prefetch resolves a character's corporation for that one row of its table. Every member of
a corporation therefore resolves to the same query key, and React Query collapses their prefetches
into a single fetch. The full scope-kind table is Stage C; this is the minimum that makes the re-key
correct in the meantime.

### One shape per collection

`useGetAllCharacterBlueprints`'s hook assigned the query wrapper `{ data, characterHash }` where its
cache reader assigned the rows array, so a consumer moved between the two saw nothing and reported no
error. Both now yield rows, and the two readers that were built against the wrapper — the Edit Job
manufacturing and reaction panels — moved in the same change.

`useGetCharacterAssets` called `useQuery` after an early return for a missing character hash, so the
hook count changed when a hash arrived late. The query is now always created and disabled instead.

`Hooks/EveEsi/Corporation/useGetCorporationBlueprints.js` had no caller for either export and is
deleted.

Closes A1, B1, B2 and B8.

## Stage C — the collection table and the login call path

_Landed._

### The collection table

`Functions/EveESI/prefetch/collections.js` carries one row per ESI collection the app holds —
sixteen of them — naming the collection, how often it is fetched, when, which ESI rate-limit bucket
it spends from, and its query factory. Nothing else enumerates the collections.

| Scope | Meaning |
|-------|---------|
| `character` | fetched once per linked character |
| `corporation` | fetched once per corporation; ESI returns the whole list to any member holding the role |

| Phase | Meaning |
|-------|---------|
| `first-paint` | the planner and the recipe search cannot render without it |
| `deferred` | read only on the accounting surfaces, so it may trail |
| `on-demand` | never prefetched; fetched when a consumer mounts |

Assets carry `on-demand` rather than being left out of the table. They are the largest collection
and only three surfaces read them, so prefetching them would spend the greatest share of the login
budget on data most sessions never open. The row is where that decision is recorded; its absence
from a prefetch list was previously indistinguishable from an oversight.

The `group` a collection spends from is imported from the query module that spends it, which
declares it once and uses it in its own fetch config. The table names the bucket by reference rather
than restating the string.

### The scheduler

`Functions/EveESI/prefetch/scheduler.js` expands the table into work: a `character` collection
yields one item per character, a `corporation` collection one item per distinct corporation, and an
`on-demand` collection none. For an account with five characters across two corporations, a
corporation-scoped collection is two fetches rather than five.

It walks the phases in order and holds at most eight collections in flight. The bound is
**collections**, not characters: capping characters meant three at a time each carrying the whole
table, so the ceiling grew with the account. It is not yet a bound on ESI requests — the corporation
journal and transactions queries fan out over seven wallet divisions inside a single query, so one
in-flight collection can be seven requests. Keying those two per division turns each division into
its own scheduled item, which is what will make the bound mean requests; that is part of the
outstanding re-key work. Before firing an item it consults that item's rate-limit
bucket, and defers an item whose bucket is spent to the back of the phase rather than firing it into
a refusal; when every remaining item is deferred the phase stops and those consumers fetch on mount.

Each query decides for itself whether it may run — a logged-out session or a Tranquility outage
disables it — and the scheduler honours that instead of forcing every query enabled, so a login
during an outage no longer fires the whole table at an offline server.

### The login path

There is one prefetch implementation and two triggers, each covering a set the other does not: the
session-apply step warms the main character, and the account sync warms the linked characters it has
just built. The account sync's list is built only from characters not already in the store, so it
never contains the main character — the two were never duplicating work, and that is now stated
where both are called rather than left to be inferred.

### The corporation re-keys

All six corporation collections are now keyed by the corporation rather than by whichever character
asked. Market orders, historic market orders and industry jobs take a corporation id; journal and
transactions take a corporation id **and** a wallet division, because ESI grants wallet access one
division at a time — a member may read division 1 and be refused division 3, so a division is
fetched once by whichever member can read it rather than all seven by every member.

`Functions/EveESI/corporationAccess.js` holds the access model the six share: the members whose
tokens may be used, and the walk that tries them in order and stops at the first not refused. Each
corporation fetcher reports a 403 as `forbidden` rather than folding it into empty rows, because a
refusal and a corporation that genuinely holds nothing are otherwise the same answer and the walk
cannot tell whether to continue.

`Hooks/EveEsi/Corporation/corporationCollection.js` is the matching read side. All six aggregates
return `{ [corporationId]: rows[] }`, and for the two wallet collections a corporation's divisions
are concatenated into that one entry, so no consumer needs to know a division dimension exists.

**Fetch-layer filters that were display rules have gone.** Corporation industry jobs discarded
completed jobs installed by anyone but the requesting character, and both order collections
discarded orders issued by anyone else. Each was a preference about what one surface shows,
implemented where it also decided what was fetched — and once one member's call serves the whole
corporation, such a filter silently drops every other member's rows. The collections now carry the
whole corporation's work, and narrowing happens where it is displayed: `useActiveSlotTotals` filters
industry jobs to the character whose slots it is counting.

Whose work a surface shows is decided by the planner being viewed — a corporation planner shows the
whole corporation, a personal planner only that character. The industry job consumers are narrowed;
the selling surfaces are not yet, so a corporation's sale-linking list now offers every member's
orders.

Closes L1 through L6.

## Stage D — location names as one shared query

_Not landed._

## Stage E — consumer cutover

_Not landed._

## Stage F — the renderers

_Not landed._

## Stage G — page reshape

_Not landed; in-scope decision open._

## Draft for `frontend/esi-collections/spa.md`

The live topic this project promotes into does not exist yet, so its draft is assembled here as the
stages land. Live topic shape applies — short intro, the anchors, the wiring, topic-only detail, no
migration language — so that promotion is a move rather than a rewrite.

### Intro and anchors

_Not written._

### The row shapes and what they resolve

_Not written._

### Corporation access models

_Not written._

### The index hooks and their scopes

_Not written._

### The login collection table

_Not written._

### Assembling a view

_Not written._

## Draft for `testing/frontend/`

The frontend testing entry is a placeholder today. This project's coverage is summarised here as it
lands, in the depth labels that module uses, and promotes with the rest.

| Surface | Depth | Covered by |
|---------|-------|------------|
| Asset node builder | Tested | `Functions/Assets/buildAssetNodes.test.js` — nested containers, corporation offices and hangar divisions, Deliveries and asset safety, a holder outside the set, a fitted module whose ship is in space, a structure classified by range, a self-holding row, a cyclic chain with a well-formed row beneath it, order independence, an empty list |
| Asset and blueprint index hooks | Tested | `Hooks/EveEsi/useAssetIndex.test.jsx`, `Hooks/EveEsi/useBlueprintIndex.test.jsx` — each scope's subscription, a corporation fetched once however many members it has, a corporation asset union across members, two consumers receiving the same collection object, and loading and error states |
| Derived collection cache | Tested | `Functions/Shared/collectionCache.test.js` — a hit on unchanged sources, and a rebuild when any source, the source count, or the extra dependency changes |
| Character blueprint aggregate | Tested | `Hooks/EveEsi/Character/useGetAllCharacterBlueprints.test.jsx` — that the hook and the cache reader return the same shape |
| Collection table and prefetch scheduler | Tested | `Functions/EveESI/prefetch/scheduler.test.js` — the table's contents pinned by name, per-character and per-corporation expansion, on-demand collections planning nothing, phase order, the concurrency cap holding, deferral when a bucket is spent, the query gate closing the prefetch, and a failure being reported without abandoning the rest |
| Blueprint row builder | Tested | `Functions/Blueprints/buildBlueprintRows.test.js` — the search-index join and a blueprint missing from it, a missing index entirely, originals against copies against a market stack, both owner types, type grouping and its order, the owned and producible sets, and that repeated corporation rows stay visible |

Raw ESI rows live in `frontend/src/tests/assetFixtures.js` and
`frontend/src/tests/blueprintFixtures.js` so that later stages assemble their views from the same
rows — which is where a shared meaning change between two consumers would
otherwise pass unnoticed.
