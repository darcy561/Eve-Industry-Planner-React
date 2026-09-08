# Current state — what runs today, and what it protects

Collected 2026-09-08 against `Development`. This file holds the raw findings the plan's decision rests
on, so a later reader can re-check them rather than take the conclusion on trust.

## Four independent refresh triggers

| Trigger | Where | What it does |
|---|---|---|
| Stagger interval | `frontend/src/Hooks/App/useRefreshESITokens.js`, first `useEffect` | One character per tick, round-robin on a module-level `esStaggerIndex`. Tick = `ESI_STAGGER_TARGET_FULL_CYCLE_MINUTES` ÷ roster size, clamped to 20–180s. |
| Maintenance interval | same file, second `useEffect` | Every `DEFAULT_CHARACTER_REFRESH_INTERVAL` (15m): corporation claims, then `refreshServerToken()`. |
| Tab visibility | `frontend/src/Realtime/useAccountWebSocket.js:70`, debounced 800ms | `runTabVisibleAuthRefresh()` — carries its own copy of the expiry arithmetic. |
| Every private API call | `frontend/src/Functions/Endpoints/Private/applyPrivateHeaders.js`, `executePrivateFetchOnce` | `await refreshServerToken()` before every fetch, made cheap by a 20m cooldown, plus a `session_missing` 401 recovery path. |

The two intervals sit in one hook with different dependency arrays: the stagger one rebuilds when the
roster size changes, the maintenance one deliberately does not. That asymmetry is only discoverable by
reading both effects.

## The clocks protect nothing

Two facts, both checked in the backend, decide this.

**The planner session's reauth deadline is fixed, not sliding.**
`services/api/helper/auth/session_reauth.go:17` computes it as `sessionStart + RefreshTokenTTL`, and
`RefreshTokenTTL` is 7 days (`services/api/helper/auth/refresh_token.go:57`, with `SessionTTL` matching
it at line 75). Rotating early produces a new refresh token but moves no deadline. A session dies 7
days after it started whether or not the SPA rotated every 20 minutes in between, and an idle period
long enough to lose the Redis rows is long enough to have passed the deadline anyway.

**The WebSocket does not need rotation either.** It authenticates with the `planner_session_id` query
param (`frontend/src/Realtime/realtimeClient.js:119`), and rotate returns the *existing* `session_id`
unless the server issues a new one — so the identity the socket holds is not what rotation refreshes.

**EVE OAuth refresh tokens do not expire from disuse.** Nothing decays on the ESI side while a tab
sits idle.

What the maintenance interval *does* accomplish is `updateCorporationClaims` and
`getPublicCharacterData` — both data currency, not token maintenance, and both better served by React
Query's own staleness rules.

## Why the clocks exist anyway

The ESI fetchers read the access token as a **snapshot** off the `Character` instance rather than
acquiring one:

```js
const { esiAccessToken, CharacterID } = character;   // Functions/EveESI/Character/getSkills.js:31
...
Authorization: `Bearer ${esiAccessToken}`
```

A call therefore succeeds or fails on whether something else refreshed that field recently enough.
That is the inversion the clocks compensate for, and it is what makes the cloud/local storage mode —
a fact about where refresh material is kept — leak into scheduling code.

## Inventory — snapshot readers

**ESI fetchers (19 files, all under `frontend/src/Functions/EveESI/`):**

| Character | Corporation | World |
|---|---|---|
| `getAssets.js` | `getAssets.js` | `getAssetLocationNames.js` |
| `getBlueprints.js` | `getBlueprints.js` | `getCitadelData.js` |
| `getHistoricMarketOrders.js` | `getDivisions.js` | |
| `getIndustryJobs.js` | `getHistoricMarketOrders.js` | |
| `getJournal.js` | `getIndustryJobs.js` | |
| `getMarketOrders.js` | `getJournal.js` | |
| `getSkills.js` | `getMarketOrders.js` | |
| `getStandings.js` | `getTransactions.js` | |
| `getTransactions.js` | | |

**Non-fetcher readers:**

- `frontend/src/Functions/Auth/checkUserClaims.js:20` — maps the roster to tokens for a claims call.
- `frontend/src/Functions/Auth/appLoginFlow.js:67,151,154,157` — passes the main character's token to
  `fetchServerSession`. On the fresh-SSO path the token is seconds old, so this one is sound as-is.
- `frontend/src/Zustand/account/tokenActions.js:510` — chooses whether to send `eve_token` on rotate.

## Inventory — cloud/local branch sites

Each derives `applicationSettings.userCloudAccounts` independently and hand-rolls its own consequence:

| Site | Branch decides |
|---|---|
| `frontend/src/Classes/character.js:156-176` | Which refresh endpoint, and whether `localStorage["Auth"]` is written |
| `frontend/src/Zustand/account/tokenActions.js:510` | Whether `eve_token` is sent on rotate |
| `frontend/src/Zustand/account/tokenActions.js:571` | Whether a 401 can be recovered by re-establishing |
| `frontend/src/Zustand/account/tokenActions.js:772` | Whether a stale main character forces full SSO |
| `frontend/src/Functions/Auth/appLoginFlow.js:29` | Whether ESI refresh material is uploaded and dropped locally |
| `frontend/src/Functions/Auth/tabSessionStorage.js`, `hasResumablePlannerSession` | Whether a cold reload can resume |
| `frontend/src/Functions/Auth/checkUserClaims.js:13` | Which claims path to take |

## Latency the clocks currently hide

Removing them means the first query after an idle period pays an OAuth round-trip (roughly 200–400ms)
before its ESI call, once per character rather than per request.

`refetchOnWindowFocus: false` is set on several hooks — `Hooks/EveEsi/World/useMarketData.js:103`,
`Hooks/EveEsi/World/useMarketHistoryData.js:85`, `Hooks/React Query/Corporation/blueprints.js` and
others — so focus-driven refetching will not warm every token on wake. This affects perceived latency
only; a request that needs a token still gets a fresh one.

## Rotation re-renders the app

`tokenActions.js` ends each refresh path with `updateCharacters([...get().account.characters])` —
lines 654, 675, 741, 798 and 832. That hands `account.characters` a **new array identity** every time,
whether or not any character changed.

38 call sites subscribe to `account.characters`, including surfaces that display no token at all:

- `Components/Header/Components/UserIcon.jsx`
- `Components/Dashboard/Components/AccountData.jsx`
- `Components/Accounts/AdditionalAccounts.jsx`
- `Components/Assets/Corporation Assets/Standard Layout/officesPage.jsx`
- `Components/Assets/Corporation Assets/Standard Layout/assetLocationFlagPage.jsx`
- `Components/Groups/Scheduler/CharacterSelection.jsx`
- `Components/Dialogues/Shopping List/assetLocationsSelection.jsx`
- `Styled Components/Select/users.jsx`
- …and 30 more

So every token rotation — currently one per stagger tick, meaning as often as every 20 seconds on a
large roster — re-renders that set. The tokens are stored on `Character` instances, which is why
refreshing one requires a store write at all.
