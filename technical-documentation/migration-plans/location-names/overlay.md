# Location names — behaviour overlay

How resolution works while this project is in flight. Live documentation stays true where this file
is silent; where the two overlap, this file wins until promote.

Live topic being replaced:
[`../../frontend/esi-collections/location-names.md`](../../frontend/esi-collections/location-names.md).

## Current behaviour (before this project)

### The hook

`Hooks/EveEsi/useLocationNames.js` takes the ids a view wants and narrows them to what
`worldData.universeIDs` does not already hold and no other consumer is already resolving, tracked in
a module-level `beingResolved` set with a `useSyncExternalStore` channel announcing releases. What is
left becomes one React Query entry keyed by the joined id list, with `staleTime: Infinity`,
`refetchOnMount: false` and an hour of `gcTime`. Names are read back out of the store, not out of the
query.

### The walk

`Functions/EveESI/World/resolveLocationNames.js` tries the account's characters in turn, asking
`getWorldData` for whatever is still unnamed, and writes `worldData` once at the end — because
`getWorldData` skips anything the store already holds, so a mid-walk write would hide an id from the
characters still to be tried. A refusal comes back as a named placeholder rather than an absence, so
the walk holds it without treating it as an answer.

### The sources

`getWorldData` splits ids by length: ten digits or fewer go to `getUniverseNames` in chunks of a
thousand, longer ones go to `getCitadelData` one at a time. `getCitadelData` asks
`/universe/structures/{id}` with the character's token; on any failure it consults the community
store through `resolveCitadelName`, and failing that returns a `No Access To Location - <id>`
placeholder. `getWorldData` catches everything and answers `{}`.

### The other callers

Five hooks call `getWorldData` themselves with the main character only, and three of them write
`worldData` afterwards. `Hooks/React Query/World/entityNames.js` resolves public ids through
`getUniverseNames` for the standings surfaces. `corporationOffices.jsx` and
`assetLocationsSelection.jsx` read `worldData.universeIDs` directly and resolve nothing.

### What this produces

A failure is indistinguishable from an answer of "nothing", and an answer of "nothing" is cached
against that exact set of ids for the session. A transient failure on a structure is written to the
store as a permanent refusal. Neither survives a reload, which is why reloading is the workaround.

## Stage A — the outcome vocabulary and the resolvers

_Landed._

### An answer against a failure

`Functions/EveESI/World/locationOutcome.js` holds the vocabulary. `LOCATION_OUTCOME` names the three
settled outcomes — `NAMED`, `COMMUNITY`, `NO_ACCESS` — as the values
`assetLocationConstants.LOCATION_RESOLUTION_STATUS` already uses, so the surfaces that read a
resolution status (`assetTree.js`'s `unreadable` row flag, `useAssetLocations`, the office select)
keep reading what they read. The new part is that a failure is not one of them: it is a
`LocationResolutionError`, thrown rather than returned, so nothing upstream can cache it as an
answer.

`isRefusalStatus` decides which HTTP statuses mean *you cannot see this*: 403 and 404. Everything
else, 420 and 5xx included, is a failure.

### The resolvers

`getUniverseNames` has one return type. It answers with ESI's list or throws; the `{}` it used to
answer with on failure was indistinguishable from ESI knowing nothing about the ids, and the caller
caches that answer for the session.

`getCitadelData` descends to the community store only on a refusal. A token that cannot be acquired,
a request that fails outright, a 5xx and a rate-limit refusal all throw. Answering a failure with a
`No Access To Location` placeholder is what left structures an account can dock at showing as
inaccessible until the tab was reloaded.

`getWorldData` settles its lookups with `Promise.allSettled` and answers with two things: the names
it got, and `failedIds` — every id a failed lookup spoke for. A structure being refused says nothing
about the batch of station names beside it, so the batch is kept; but an id that failed and an id
ESI simply did not mention are both absent from the names, and a caller that cannot tell them apart
caches the gap as the answer. That is why the failed ids are reported rather than the call throwing:
throwing would lose the partial answer, and staying silent would lose the failure.

### The walk

`resolveLocationNames` tolerates one character's lookups failing and asks the next, because a token
that could not be refreshed belongs to that character alone. It tracks the ids nobody has answered
for, writes whatever was named to the store, and then throws if any of those ids is still
unanswered — so a retry asks only for what is missing rather than for the whole set again.

The partial case is the one that matters: a batch where the stations resolve and the structure
fails. The walk used to return that partial answer with no error, and the query cached it against
its set key for the session — which is a structure staying unnamed while everything beside it is
named, on an account with one character.

### The callers that treat a name as incidental

The two Edit Job hooks and the shopping list's corporation assets resolve names as a side errand
inside a larger flow, and each already sits in a `try` that fails the whole flow. They catch a
failed name lookup and carry on, which is the behaviour they had when `getWorldData` swallowed
everything. They are cut over properly in Stage D.

### `unnamed` is not one of the outcomes yet

The design names a fourth outcome for an id ESI genuinely has no name for. It is not here: an id
absent from a `/universe/names` answer is simply absent from the returned map, so it is neither
cached nor marked unreadable, and every ask tries it again. Nothing settles it today either, so this
is unchanged behaviour rather than a regression — but it is the reason `unreadable` still means only
"every character was refused", and it needs the per-id cache of Stage B to have somewhere to live.

### What this stage does not fix on its own

`useLocationNames` still keys its query on the id set, so an id that failed here is retried only
because the query now errors rather than succeeding with nothing. The set-keyed cache and the claim
set go in Stage C.

## Stage B — the per-id cache and the loader

_Landed, and not yet mounted: `useLocationNames` moves onto it in Stage C._

### The cache entry

`Hooks/React Query/World/locationNames.js` holds `locationNameQuery(id, characters)`, keyed
`["esi", "location-name", <id>]` and nothing else. Every view wanting a structure shares that one
entry, so a name resolved on one page is present on the next, and an id that could not be resolved
is a failure against that id rather than a hole in some page's set.

The characters are not part of the key. A location's name is a fact about the location; which of the
account's characters managed to read it is not something a consumer should have to match on.

Every settled outcome is kept for the session, a refusal included. A failure is not cached at all —
it rejects, and React Query asks again.

### The loader

`Functions/EveESI/World/locationNameLoader.js` is what keeps a cache entry per id from becoming a
request per id. Everything raised in one tick is collected and issued as ESI takes it: the public ids
in one `POST /universe/names` per thousand, each structure as its own walk. Two callers wanting the
same id in the same tick wait on one lookup.

The flush is a macrotask rather than a microtask, because React renders the whole list of views
wanting names before it yields, and a microtask would flush after the first of them.

### The ladder, properly ordered

Docking access is per character and the app cannot know which character holds it, so a structure can
only be named by asking each of them in turn. The community store is therefore asked only once
**every** character has been refused: `getCitadelData` consulted it on the first refusal, which meant
an account whose main is refused took a community name while an alt with docking rights was never
asked.

`getCitadelData`'s module is now two named exports and no composite. `fetchStructureName` is the ESI
ask alone — named, or refused — and `communityNameOrRefusal` is the fallback. Nothing joins them into
a one-character answer, because a single character's refusal is that character's answer and never the
account's. The order belongs to the loader, which is the only thing that walks the characters.

A character that could not ask at all does not count as a refusal. If any character failed, the
account has not established that it cannot see the structure, so the id fails and is retried rather
than settling as no access.

### The public/structure split

The loader classifies with `resolveLocationKind` rather than the id-length test the older path uses,
and only a `STRUCTURE` takes the token branch. Two kinds were added to the classifier for it:
regions and constellations, which never arrive as an asset's location but do reach name
resolution — a market history reads a region — and which the length test happened to route correctly
while the classifier's `STRUCTURE` default would have sent to an endpoint that answers for neither.

### `unnamed`

An id ESI answers about and does not mention now settles as `LOCATION_OUTCOME.UNNAMED`, carrying no
name. It is deliberately not `NO_ACCESS`: a station nobody can name is not a place the account cannot
see, and the surfaces that dim or drop an unreachable location would be wrong to do either. Keeping
it is what stops such an id being asked about on every render for the rest of the session.

## Stage C — `useLocationNames` cutover

_Landed._

### What the hook is now

`useLocationNames` keeps the signature its five consumers take, and is a `useQueries` over one
`locationNameQuery` per id it was asked for. Its `combine` builds the names map, reports loading
while any id is still in flight, and surfaces the first failure. The set-keyed query, the
`beingResolved` claim set and the release channel it needed are gone, and so is
`resolveLocationNames` — the walk it performed belongs to the loader now, per id rather than per
set.

An id that settled as `UNNAMED` is left out of the names map. It is a settled answer, so it is not
asked for again, but it carries no name and a consumer treating an entry as a named place would
render a blank.

### `worldData` is still read as well as written

The hook writes what it resolved into `worldData.universeIDs`, because nine surfaces read their
names from there and resolve nothing themselves. It reads it too: a name the store already holds is
an answer, and asking for it again would be work for nothing while the older resolve-and-write path
still fills the store from the five callers Stage D has yet to move.

That makes the store a cache in front of a cache until Stage E settles it. An incomplete store costs
nothing: what it does not hold is asked for. A **wrong** entry does cost something, and one path
still writes them — the five callers Stage D has yet to move resolve with a single character, so a
structure only an alt can dock at can be written to the store as `NO_ACCESS` by a market or Edit Job
panel. The hook then skips it, because the store holds an answer, and the per-id resolution that
would have walked every character is never asked. That is D2 and D4 surviving through the store
rather than through the resolver, and it closes when Stage D stops those callers writing
single-character verdicts.

### What this closes

D1 and D5 are gone as far as a reader is concerned: a page that fails to resolve a location asks
again on the next mount, and two pages wanting overlapping sets share the entries they have in
common rather than holding separate answers. D6 is gone with the claim set.

## Stage D — the direct callers

_Landed._

### Every character, not one

The five callers that resolved names themselves each did so against a single character — four against
the main, the shopping list against the one character it looks up for the selected corporation. A
structure only an alt could dock at came back refused, and that refusal was written to `worldData`
where every other surface then read it. They resolve against the account's characters now, so the
verdict a market panel writes is the same verdict the asset library would have reached.

### Two shapes, one cache

`useMarketData` and `useMarketHistoryData` are hooks with their ids known at render, so they take
`useLocationNames` and their bespoke `useQuery` entries — keyed by item and by a spread of ids — are
gone.

The other three resolve inside a flow already running, where a hook cannot be called, and take
`fetchLocationNames(queryClient, ids, characters)` instead. It fetches the same per-id entries the
hook subscribes to, so a name either of them resolves is present for the other. An id that fails is
left out rather than failing the set: these three resolve names as a side errand, and the flow they
belong to has other work to finish. Nothing is cached for a failure, so the next ask retries.

### `getWorldData` is deleted

Its last caller went with this stage. The store-already-holds filter, the id-length split and the
thousand-id chunking it owned all have homes in the loader; the swallowing it did does not.

### What this closes

D4 is gone: no path resolves a structure against one character any more. D2 is gone in the sense that
mattered — with no single-character path left to write a wrong `NO_ACCESS`, the store can no longer
hold a verdict the per-id resolution would have disagreed with.

`useMarketData` carries the test that proves it: a structure the main character is refused for, named
because the alt is asked, through the real hook and the real loader with only the ESI calls faked.
The other four callers take the same path and have no tests of their own — they had none before this
project either, and the ladder beneath them is covered.

## A ship is not a place

_Landed, found by a live failure rather than by the plan._

A ship flying in space is absent from the asset endpoint's answer while its fitted modules are not,
so each module names the **ship's item id** as its location. That id sits in the same range an Upwell
structure's does, and the id is all `resolveLocationKind` had to go on — so the ship read as a
structure, and every asset view asked ESI to name it.

Nothing names it. `GET /universe/structures/{id}` refuses an id that is not a structure, for every
character, on every ask. One ship in space was one wasted lookup while a single character did the
asking; Stage D made it one per character, and ESI charges a 4xx five times what it charges an
answer. An account with a few ships in space and four characters spends its error budget on lookups
that were never going to resolve — and once that budget trips, every other ESI call the app makes
fails with it.

What tells a ship from a structure is not the id but what is filed inside it: only a ship has fitting
slots, bays and holds. `assetLocationConstants.isShipHoldFlag` is that list — cargo included, the
`Structure` prefix and `RigSlot` excluded because an Upwell structure carries those too — and
`buildAssetNodes` settles the kind with it, for a holder the set does not contain.

It is deliberately not the list `assembledShipIds` keeps. That one answers whether an *item* is an
assembled ship, and admitting `Cargo` to it would take containers with it. Two questions, two lists.

Four surfaces hand location ids to `useLocationNames` — the tree, the location dropdown, the
"where is this held" dialogue and the blueprint library's locations. All four filter through
`assetLocationIds.unnameableLocationIds`, so a fifth cannot quietly reintroduce the storm. The rows
render exactly as before: unnamed, and last.

This is the case the plan's § Open decisions could not have found, because it is not about what a
name resolution does with an answer. It is about asking a question that has none.

## Stage E — the store

_Landed._

### A location nobody can name is shown, never dropped

A surface that resolves location names shows the ones it could not resolve, carrying the
`No Access To Location - <id>` name that says so. Filtering them out is what several pickers used to
do, and it is indistinguishable from the place not existing: an office the account cannot dock at
simply vanished from the corporation picker, so an access problem read as missing data and there was
nothing for the reader to act on.

`Functions/Assets/assetTree.js` owns the shape and the order. `describeLocation(id, names)` gives
`{locationId, name, unreadable}`; `byLocationOrder` puts named locations first alphabetically, then
the unnamed, then the unreadable. `orderLocations` builds a list of locations and what sits at each —
what the asset tree walks — and `locationOptions` builds the same thing without the contents, which
is what a picker offers. `locationOptions` withholds an id still being asked about: a list can show
an unnamed location because the assets are visibly there, but a picker row with no label says
nothing, and the name is moments away.

### The surfaces

`corporationOffices.jsx` and `Shopping List/assetLocationsSelection.jsx` call `useLocationNames` and
read `locationOptions`. Neither subscribes to `worldData.universeIDs` any more — the office picker
had been subscribing to it purely to force a re-render when a name landed.

`Market Data/dialogueFrame.jsx` and `priceHistory.jsx` needed no hook call at all: `useMarketData`
and `useMarketHistoryData` already hand them the names map, so they read it directly. Both dialogues
stopped calling `addUniverseIDs` on close, which the hook's own write-through had already made
redundant. The chart's map arrives as `regionNames`; it was called `alternativeRegionData` while it
was the fallback behind a store read, and there is no longer a store read for it to be alternative
to.

Both market hooks now ask for the region's own name whether or not any rows came back. They used to
withhold the request until there was something to name, which is how an item that has never traded
in a region came to be reported as having no data in "Unknown Region".

## Drafts for live documentation

Whole-file drafts of what promotes go under `promote/` when the stages are done, indexed by a
`promote/README.md`. Nothing is drafted yet.

## Coverage this project adds

In the depth labels [`../../testing/frontend/esi-collections.md`](../../testing/frontend/esi-collections.md)
uses. That live topic still describes the walk this project deleted — `resolveLocationNames` and its
"asks a later character only about what is still unnamed" coverage — and is superseded by this table
until promote.

| Surface | Depth | Covered by |
|---------|-------|------------|
| The outcome vocabulary | Tested | `Functions/EveESI/World/locationOutcome.test.js` — the settled outcomes carrying the same values the older resolution statuses do, and which HTTP statuses are a refusal against a failure |
| The resolvers | Tested | `getUniverseNames.test.js`, `getCitadelData.test.js` — a name, a refusal, an unacquirable token, a failed request and each failing status classified; the community rung reached only from a refusal, and not at all for an account that has opted out |
| The batching loader | Tested | `locationNameLoader.test.js` — one call for a tick's ids, a batch over a thousand split, two callers for one id asking once, an id ESI did not mention settling as unnamed, a failed call failing the ids it spoke for, the character ladder and the community store only after every refusal, a character that could not ask failing rather than settling, a region asked for in bulk rather than against a token, one unresolvable id isolated out of a refused batch so the rest are still named, and a batch refused for any other reason left unsplit |
| The per-id cache entry | Tested | `Hooks/React Query/World/locationNames.test.jsx` — two callers sharing one entry, a refusal kept, a failure cached nowhere and asked again |
| The hook | Tested | `Hooks/EveEsi/useLocationNames.test.jsx` — asking only for what the store lacks, waiting for characters, writing through to the store, a failure reported rather than an empty result, the names that resolved kept when one fails, and the id asked for again on the next mount after a failure |
| The ladder, end to end | Tested | `Components/Assets/assetLibraryView.names.test.jsx` — the rendered library against a faked ESI and nothing else: a station from the bulk lookup, a structure only an alt can dock at, a community name once every character is refused, no access when nobody can name it, a ship in space never asked about, each character asked exactly once, and a pass that fails asked again |
| The market data panel | Tested | `Hooks/EveEsi/World/useMarketData.test.jsx` — a structure only an alt can dock at named through the real hook and loader, with only the ESI edges faked; the stations and systems its orders sit in named from the bulk lookup; and the region named even when no orders came back |
| The market history chart | Tested | `Hooks/EveEsi/World/useMarketHistoryData.test.jsx` — the region named when the item has no history at all, and no name asked for when there is no region; `Styled Components/LineGraph/priceHistory.test.jsx` — the chart naming its region from the map it is handed, and saying the region is unknown when no name reached it |
| The location pickers | Tested | `Styled Components/Select/corporationOffices.test.jsx` and `Components/Dialogues/Shopping List/assetLocationsSelection.test.jsx` — an office and an asset location nobody can read offered saying so, ordered after the named ones and selectable; `Hooks/EveEsi/useAssetLocations.test.jsx` — the same at the hook the three dropdowns share, plus a location held back until its name is known |
| The other three consumers | Little or none | The two Edit Job hooks and the shopping list's corporation assets have no tests of their own, and had none before this project. The ladder they now share is covered beneath them |

### What the store keeps

`marketbar.jsx` reads the names map the Market Data dialogue hands it, as `locationNames`. The four
Edit Job panels — `availableOrdersTab`, `linkedMarketOrdersTab`, `availableJobs`, `linkedJobs` —
call `useLocationNames` over the ids in their own rows. Each had been reading the store through
`getState()` inside the row loop: a read with no subscription behind it, so a row rendered before a
name resolved kept "Location Data Unavailable" until something else re-rendered it.

`findUniverseData` is deleted — nothing outside the hook reads the store's universe half any more.
`worldData.universeIDs` and `addUniverseIDs` remain: `useLocationNames` answers from the map before
it asks ESI, and writes back what it resolves.

## One bad id no longer costs a page its names

`POST /universe/names` is all-or-nothing: an id ESI cannot resolve refuses the whole call with a 404
that names nothing and does not say which id was at fault. A batch carries up to a thousand ids, so
one bad id among them left every location on the page unnamed — and, because the id is in the set
every time, on every attempt after it too.

`settlePublicNames` splits a batch refused that way in half and asks again, down to the single id
that is at fault. That one settles as `unnamed` — ESI has said it resolves to nothing, so keeping the
answer is what stops it poisoning the next batch it lands in — and every other id in the batch gets
its name. A batch refused for any other reason is not split: those ids failed, and failures are
retried whole rather than turned into a cascade of smaller calls.

The measurements behind this are in
[`measurements/universe-names-batch.md`](./measurements/universe-names-batch.md).

## An id says what can name it

`resolveLocationKind` classifies a location id against
[EVE's published id ranges](https://developers.eveonline.com/docs/guides/id-ranges/) rather than by
the handful of ranges the app happened to need, and `locationNameSource` turns that into where the
name can be got: the bulk lookup, a character's token, or nowhere.

Only a spawned item — an id at or above a million million — is a structure. Everything below that
and outside a documented range is `UNKNOWN`. That is the whole point of classifying: the previous
rule made *anything unmatched* a structure, and a structure is asked of every linked character in
turn, so one id that was never a place cost a refusal per character and five times a hit's weight
against the error budget each time. A ship in space was that defect in its most expensive form.

Three kinds that really do arrive as a location can be named by neither path, and the loader now
settles them without asking: a celestial (a starbase's modules sit at a moon), a stargate, and a
station's office folder. `POST /universe/names` answers only for regions, constellations, solar
systems and stations among places, and refuses the whole call over anything else — so batching one
of these would have cost every other name in the batch as well.

A location the app cannot name is not offered as somewhere to work from: `PLACE_KINDS` is unchanged,
so a stack at a moon does not appear in a location picker. It did appear before this, labelled
`No Access To Location` — which said the account could not read the place, when the truth was that
the place was a moon and nothing was ever going to name it.

## The Edit Job hooks stopped resolving names

`useGatherJobMatchesAndUpdateExistingLinkedJobs` and
`useGatherMarketOrdersAndUpdateExistingLinkedOrders` gathered the ids of their rows inside an async
effect, fetched the names imperatively and wrote them into the store themselves — while the panels
beneath them resolved the same ids again through `useLocationNames`. Each now calls that hook over
its own rows and returns its `isLoading`, so the page still waits for the names before it draws and
there is one lookup rather than two. The market order panel's gate had never worked: it read a field
its hook does not return, so the panel drew before any name arrived.

Matching moved out of the effect at the same time. It is a function of the jobs ESI reported and the
job being edited, so it is derived while rendering; the effect keeps only the write of the latest
ESI figures onto the job.
