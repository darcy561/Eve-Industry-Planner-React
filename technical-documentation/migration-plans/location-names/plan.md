# Location names — plan

**Rules:** Read and following [`../documentation-rules.md`](../documentation-rules.md)
and [`../technical-rules.md`](../technical-rules.md) (migration-plans).
Phase 1 (project folders/docs) before any product work.
No Go surfaces are in scope as written; if the community-name endpoint changes, `go fix -diff` runs
on that package only, before and after.
Live SoT will not be edited until this project is complete and promotion is approved.

## The goal

Resolving an EVE id to a name is one thing the app does from many places, and it currently answers
differently depending on which page asked, in what order, and whether anything failed on the way.
This project rebuilds that resolution around **one cache entry per id with an explicit outcome**, so
that a name resolved anywhere is available everywhere, a refusal is remembered, and a failure is
retried rather than remembered.

It stays in the SPA. ESI resolves ids in bulk — `POST /universe/names` takes 1–1000 unique ids in one
call — so the browser doing it is one request, not one per name; structure names need a character's
token (`esi-universe.read_structures.v1`) and answer differently per character, so that half could
not move regardless; and the community store behind `/api/v1/citadel-names/{id}` is already the
server's part of this segment.

## What a reader sees today

Three reports, all from normal use:

- Names resolve on one page, then the same locations are unnamed on another.
- A structure the account can dock at never gets its name, and shows as
  `No Access To Location - <id>` for the rest of the session.
- Reloading the tab fixes both.

## Defects, and the evidence for each

| # | Defect | Evidence |
|---|--------|----------|
| D1 | **A failed resolution is cached as a successful one, for the session.** `getWorldData` catches every error and returns `{}`, so React Query stores a successful empty answer under that id-set key. With `staleTime: Infinity` and `refetchOnMount: false`, the same set is never asked for again | Reproduced: resolve returns nothing, unmount, remount with the service healthy — the hook asks once, not twice |
| D2 | **A transient failure settles as permanent no-access.** `getCitadelData` answers its `catch` with a `NO_ACCESS` placeholder, so a 5xx, an expired token, a rate-limit refusal and a genuine 403 are one outcome. `resolveLocationNames` writes placeholders to `worldData`, and both the hook and `getWorldData` skip anything the store holds | `Functions/EveESI/World/getCitadelData.js` — the `catch` returns the placeholder; `resolveLocationNames.js` writes `resolved` whole |
| D3 | **A failed name batch writes a junk entry.** `getUniverseNames` returns an array on success and `{}` on failure; `getWorldData` flattens and indexes by `obj.id`, so a failed batch stores `universeIDs["undefined"]` | `getUniverseNames.js` catch vs return; `getWorldData.js` `.flat()` then `returnObject[obj.id]` |
| D4 | **Five call sites resolve against a single character.** Four pass `getMainCharacter()`; the shopping list passes the one character it looks up for the selected corporation. None walks the account, so a structure only an alt can see resolves as no-access — and D2 then stores that verdict where the walk would have found the name | `useMarketData.js`, `useMarketHistoryData.js`, `useMarketOrdersAndWorldData.js`, `useJobMatchesAndWorldData.js` pass the main character; `useShoppingListCorporationAssets.js` passes its corporation's character |
| D5 | **The cache key is the id set.** Two pages wanting overlapping sets are unrelated entries, so one poisoned set is invisible to the other — which is why the answer depends on which page asked | `useLocationNames.js` — `queryKey: [locationNamesQueryKey, missing.join(",")]` |
| D6 | **A module-level claim set stands in for cache identity.** `beingResolved` plus a `useSyncExternalStore` release channel exist to stop set-keyed queries duplicating each other's work — machinery a per-id cache does not need | `useLocationNames.js` |
| D7 | **Answers and cache state live in different places.** The value is in Zustand, the fetch state in React Query, and nothing reconciles them: React Query can hold a successful entry for a set the store has nothing for | D1 is this defect surfacing |
| D8 | **Two implementations of id-to-name.** `Hooks/React Query/World/entityNames.js` resolves ids through `getUniverseNames` for the standings surfaces, beside this one | Both call `getUniverseNames` |

D1, D2 and D4 are what a player actually sees. The rest are why the fixes would not stay fixed.

## The design

### One entry per id

A location's name is cached under its own id, not under the set some page happened to ask for.
Everything else follows: two pages wanting the same structure share one entry, a set that failed
does not exist as a thing that can be poisoned, and the claim set and its release channel are
deleted rather than reimplemented.

### The resolution ladder

```
id ─┬─ public (station / system / region)
    │     └── POST /universe/names          bulk, 1–1000 unique ids
    │
    └─ structure
          ├── each linked character, in turn        → named
          ├── community store  GET /api/v1/citadel-names/{id}   → named (community)
          └── every character refused               → no-access
```

A rung is descended only on a **refusal**. Anything else — a 5xx, a timeout, a token that could not
be acquired, a rate-limit refusal — leaves the ladder as a thrown error.

### The outcome vocabulary

| Outcome | Meaning | Cached | Retried |
|---------|---------|--------|---------|
| `named` | ESI named it for a character, or it is public | yes, for the session | no |
| `community` | no character could see it; the community store had it | yes | no |
| `unnamed` | ESI has no name for this id | yes | no |
| `no-access` | every linked character was refused, and the community store had nothing | yes | when a character is linked |
| *failure* | anything that is not an answer | **no** | yes, with backoff |

Distinguishing the last row from `no-access` is the whole of D1 and D2.

### Batching without set-keyed caching

Per-id entries must not become per-id requests. A loader collects the ids raised in one tick, splits
them by kind, issues one `/universe/names` call per 1000 public ids and one structure call per
structure, and settles each id's entry from the batch. The cache key stays an id; the wire stays
bulk.

### Where the answers live

React Query becomes the cache. `worldData.universeIDs` stays as long as something reads it directly,
and nine surfaces do — two against the map, seven through the store's own `findUniverseData` action.
The last stage decides whether they move or the store keeps a read-through copy fed by the cache.

## Who resolves names today

| Caller | Reads | Notes |
|--------|-------|-------|
| `Hooks/EveEsi/useLocationNames.js` | the walk, then `worldData` | The intended path; five hooks use it |
| `useAssetTree`, `useAssetLocations`, `useAssetsOfType`, `useBlueprintLocations` | `useLocationNames` | Already correct — they move only if the hook's signature changes, which it should not |
| `Hooks/EveEsi/World/useMarketData.js` | `getWorldData` directly | Main character only; own query key; writes nothing |
| `Hooks/EveEsi/World/useMarketHistoryData.js` | `getWorldData` directly | Main character only |
| `Components/Edit Job/Hooks/useMarketOrdersAndWorldData.js` | `getWorldData` directly | Main character only; writes `worldData` itself |
| `Components/Edit Job/Hooks/useJobMatchesAndWorldData.js` | `getWorldData` directly | Main character only; writes `worldData` itself |
| `Components/Dialogues/Shopping List/Hooks/useShoppingListCorporationAssets.js` | `getWorldData` directly | Passes the corporation's own character; writes `worldData` itself |
| `Hooks/React Query/World/entityNames.js` | `getUniverseNames` directly | The standings surfaces; the public branch by another name |
| `Styled Components/Select/corporationOffices.jsx` | `worldData.universeIDs`, and `isNoAccessLocation` | Reads the store, resolves nothing |
| `Components/Dialogues/Shopping List/assetLocationsSelection.jsx` | `worldData.universeIDs` | Reads the store, resolves nothing |
| `marketbar.jsx`, `priceHistory.jsx`, `dialogueFrame.jsx` (Market Data), and the Selling and Building tab panels — `availableOrdersTab`, `linkedMarketOrdersTab`, `availableJobs`, `linkedJobs` | `worldData.actions.findUniverseData` | Seven more store readers, reached through the action rather than the map. They resolve nothing, and they are what Stage E has to answer for |
| `Functions/Assets/assetTree.js`, `Hooks/EveEsi/useAssetLocations.js` | `isNoAccessLocation` | Read the *outcome*, not the name: a tree row is marked `unreadable` and a location list drops what nobody can see |

## Stages

### Stage A — the outcome vocabulary and the resolvers

Classify a refusal apart from a failure at the bottom, where the status code is. `getUniverseNames`
gains one return type. `getCitadelData` stops answering its own `catch` with a verdict: it returns a
named outcome, a refusal, or throws.

Two things this stage cannot leave alone, both because `getWorldData` is still live until Stage D:

- **`Promise.all` fails fast.** Once a structure lookup can throw, one 5xx rejects the whole batch
  and `getWorldData`'s own `catch` discards the public names that resolved alongside it — a batch
  that used to come back partial would come back empty. `getWorldData` moves to `Promise.allSettled`
  in this stage, before the throw semantics land.
- **The outcome vocabulary already half exists.** `Functions/Assets/assetLocationConstants.js`
  carries `LOCATION_RESOLUTION_STATUS` (`RESOLVED` / `COMMUNITY` / `NO_ACCESS`) and
  `isNoAccessLocation`, and they are read outside this segment: `assetTree.js` marks a row
  `unreadable`, `useAssetLocations.js` drops what nobody can see, `corporationOffices.jsx` labels an
  office. This stage decides whether the new vocabulary replaces that enum or is translated into it,
  and says what `unreadable` means once `unnamed` is a distinct outcome from `no-access` — a station
  ESI has no name for is not a place the account cannot see.

### Stage B — the per-id cache and the loader

`locationNameQuery(id)` and the batching loader beneath it. Tested against a fake ESI: one call for
a thousand public ids, one entry per id, a failure thrown rather than cached.

### Stage C — `useLocationNames` onto the per-id cache

The hook keeps its signature, so its five consumers are untouched. `beingResolved`, the release
channel and the set-keyed query go.

### Stage D — the direct callers

The five `getWorldData` call sites move onto the hook or the query, and each stops writing
`worldData` itself. `getWorldData` is deleted with its last caller. `entityNames.js` becomes the
public branch rather than a second one.

### Stage E — the store

Decide whether `worldData.universeIDs` keeps a read-through copy, or its readers move onto the hook
and the slice's universe half is deleted. Nine surfaces read it — two through the map and seven
through `findUniverseData` — so the read-through copy is the cheaper answer unless those surfaces
are moving for their own reasons.

## Wire compatibility

Nothing here changes a stored document or a request body. The one candidate is the community-name
lookup: it is one id per request today, ETag'd and CDN-cached. A batch form would be additive, and is
an open decision below rather than planned work.

## Testing

- **Stage A** — a refusal, a 5xx, an unacquirable token and an unknown id each classified, at the
  resolver rather than through the hook.
- **Stage B** — one request per thousand public ids; per-id entries settling from one batch; a
  failure rejecting; an id asked for twice while in flight fetched once.
- **Stage C** — the regression this project exists for: a resolution that answers with nothing is
  asked again on the next mount. Plus the existing `useLocationNames` suite, which must pass
  unchanged.
- **Stage D** — a structure only an alt can see is named on the market and Edit Job surfaces.
- **Stage E** — whichever the decision makes real.
- **Before Stage D closes** — one end-to-end pass over the whole ladder: a structure named from an
  alt's token, one named from the community store, one settling as no-access, and a failure retried,
  asserted at a rendered surface rather than at the resolver. Unit tests either side of a shared
  meaning cannot see it change.

## Open decisions

| Question | Options | Status |
|----------|---------|--------|
| Does the community rung gain a batch form? | Keep one id per request / add a batch endpoint | Open — per-id GETs are ETag'd and CDN-cached, which a batch POST would not be, so the per-id form may already be the cheaper one at the edge |
| Does `worldData.universeIDs` survive? | Read-through copy / delete it and move all nine readers | Open — Stage E |
| Are named results kept across a reload? | Nothing persists today / persist named and community outcomes | Open — this is why a reload re-resolves everything, and also why a reload is the workaround for D1 and D2 |
| Does an unknown id fail a whole `/universe/names` batch? | Verify against ESI | Open — the spec documents only 200 and a default error; if one bad id fails 1000, the loader needs a bisect or a filter |
| When is a `no-access` verdict asked about again? | On a character being linked / never within a session | Open — the outcome table says a refusal is worth re-asking once the account gains a character who might see it, and nothing invalidates the entry today. It needs a hook into character linking, which belongs with Stage D or E |
| ~~Where does `unnamed` live, and what does it mean for `unreadable`?~~ | — | Settled in Stage B — a cached outcome of its own, carrying no name, and deliberately not `NO_ACCESS`, so `unreadable` still means only that every character was refused |
| Who owns `entityNames.js`? | Fold into the public branch here / leave it and accept two | Open — it is new work from another session; settle before Stage D |

## Stage status

| Stage | Status |
|-------|--------|
| Phase 1 — project folder and docs | Done |
| A — outcome vocabulary and resolvers | Done |
| B — per-id cache and loader | Done |
| C — `useLocationNames` cutover | Done |
| D — the direct callers | Done, less its end-to-end pass — see Handoff |
| E — the store | Not started |

## Promote map

On go-ahead, this project's overlay promotes into the live topic it already has —
[`../../frontend/esi-collections/location-names.md`](../../frontend/esi-collections/location-names.md)
— which today describes the walk this project replaces. The testing entries fold into
[`../../testing/frontend/esi-collections.md`](../../testing/frontend/esi-collections.md). This folder
is then deleted and its row removed from [`../contents.md`](../contents.md).

## Handoff status

Stage A has landed: a failure is now a thrown `LocationResolutionError` rather than an answer, and
the community rung is reached only by a real refusal. D2 and D3 are closed. D1 is closed at the
resolver — a failed lookup no longer *looks* like an empty answer — but the set-keyed query is still
what decides whether it is asked again, so **Stage C** is where it stops being observable.

Stage C has landed. The hook is a per-id `useQueries`, and the set-keyed query, the claim set, the
release channel and `resolveLocationNames` are all deleted. D1, D5 and D6 are closed for every
surface that reads through the hook.

Stage D has landed. Every path resolves against the account's characters, `getWorldData` is deleted,
and the two shapes of caller — one that subscribes, one that fetches — share the per-id cache.

Two of its own gates are worth being honest about. The plan owes **one end-to-end pass over the whole
ladder asserted at a rendered surface** before this stage closes: what exists is
`useMarketData.test.jsx`, which reaches the real hook and the real loader with only the ESI edges
faked and proves the alt-named-structure case — the shape that matters — but at a hook rather than at
a rendered panel, and for one of the five callers rather than all of them. And the handoff said Stage
D depended on settling who owns `entityNames.js`: it did not in the end, because that file resolves
public ids for the standings surfaces and never touched `getWorldData`, so the cutover did not reach
it. The decision stays open; it is no longer blocking anything.

**Stage E is what remains**: whether `worldData.universeIDs` keeps a read-through copy for its nine
readers or they move onto the hook. Nothing depends on it being decided quickly; the store is fed
from the cache and no longer holds anything the cache would disagree with.

`entityNames.js` is still unsettled and is now the only thing in this project's scope that resolves
ids outside the shared loader. It writes no verdicts, so it cannot reintroduce a fault; folding it in
would buy batching with whatever location ids the same render asks for, and nothing else.

Stage D depends on settling who owns `entityNames.js` with the session that wrote it.
