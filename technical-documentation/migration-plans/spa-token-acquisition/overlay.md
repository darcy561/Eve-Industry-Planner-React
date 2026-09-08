# Overlay — how token acquisition works after the change

Lay this over [`frontend/auth/spa.md`](../../frontend/auth/spa.md). Where this file is silent, that doc
remains the truth. Sections marked **planned** describe the target and are not yet what runs.

## The two subjects, kept apart

| Subject | Lifetime | Acquired by |
|---|---|---|
| ESI access token, one per character | ~20 minutes, refreshed inside a 660s buffer | The provider, on demand — held in the provider, not in Zustand |
| Planner session | Session id plus a rotating refresh token; hard reauth deadline 7 days from session start | `refreshServerToken`, on demand from the private request path |

They are refreshed by different code against different backends and share no schedule. The only thing
they have in common is that a stale one is discovered by the caller that needs it.

## The provider — **planned**

One module owns *give me a usable ESI access token for this character*:

```
getEsiAccessToken(characterHash, { minRemainingSec }) -> { accessToken, exp }
```

Behaviour:

- Returns the held token when it has more than `minRemainingSec` left; refreshes otherwise.
- Single-flights per character, so concurrent callers for one character produce one refresh and share
  its result.
- Throws a classified error on failure — recoverable, or reauth-required. Callers act on the class;
  only the provider knows what each mode's failures mean.

### Module shape

A **factory returning the API, plus a default singleton built from it** — not a class, and not bare
module-level state:

```js
// Functions/Auth/esiCredentials/provider.js
export function createEsiCredentialProvider({ strategies, now = Date.now }) {
  const tokens = new Map();    // characterHash -> { accessToken, exp }
  const inflight = new Map();  // characterHash -> Promise

  async function getEsiAccessToken(characterHash, { minRemainingSec = 660 } = {}) { … }

  return { getEsiAccessToken, forget, reset };
}

export default createEsiCredentialProvider({ strategies: realStrategies });
```

Call sites import the default. Tests build their own with fake fetchers and a fake clock, which is what
the single-flight and failure-classification tests need — bare module state would leak between tests in
one file, and a class buys nothing a closure does not when exactly one instance exists.

This follows the established idiom for non-React infrastructure in the SPA (`Realtime/realtimeClient.js`,
`Realtime/wsClientIdentity.js`, `Functions/Auth/tabSessionStorage.js`). It does **not** belong under
`Classes/`, which holds domain entities whose members follow the getter/method rules in
[frontend/technical-rules.md](../../frontend/technical-rules.md).

The two storage modes are plain objects of functions selected once from `userCloudAccounts` — no
inheritance, no `this`:

```js
const serverStoredCredentials = { refresh: (hash) => …, persist: null };
const clientHeldCredentials   = { refresh: (hash) => …, persist: (token) => … };
```

### Token ownership — out of Zustand

**The provider's `Map` holds live access tokens. `Character` keeps identity only**, losing
`esiAccessToken` and `esiAccessTokenEXP`.

This is the point of the shape. Today those fields live on `Character` instances in the store, so every
refresh ends with `updateCharacters([...characters])` — a new array identity for
`account.characters`, which 38 component call sites subscribe to. A token rotation therefore re-renders
the header, the dashboard, account cards, asset pages and character pickers, none of which display a
token. After the change a rotation touches no store state and renders nothing.

It also removes the last reason `Character` reads `userCloudAccounts`, which is what makes
`Classes/character.js` mode-aware today.

The rule that follows, and the one a later change is most likely to breach: **an access token is not
application state.** Nothing renders from it, so it does not belong in a store whose updates drive
renders. Identity belongs in Zustand; credentials belong to the provider.

## Callers — **planned**

- **ESI fetchers** (`Functions/EveESI/**`) await the provider and use what it returns. They no longer
  read a token off a passed-in `Character`.
- **Private API requests** (`applyPrivateHeaders.js`) ensure planner session freshness before sending,
  and keep the existing `session_missing` 401 recovery.
- **Login and bootstrap** (`appLoginFlow.js`) are unchanged. On the fresh-SSO path the token in hand is
  seconds old, so those call sites are already correct.

## What no longer exists — **planned**

Nothing schedules auth work. There is no interval, no boot-time supervisor, and no auth branch on tab
visibility. A token is refreshed when something needs it and it is stale; at every other moment the SPA
does nothing about tokens at all.

The visibility handler in `useAccountWebSocket.js` survives for the realtime resync it also performs.

## Why no clock is needed

Recorded here because it is the non-obvious part, and the thing a future change is most likely to get
wrong by reintroducing a timer:

- The planner session's reauth deadline is `sessionStart + 7 days` and does not slide, so rotating
  early buys no additional life.
- The WebSocket authenticates on the session id, which rotation carries forward unchanged.
- EVE OAuth refresh tokens do not expire from disuse.

Sources and line references: [current-state.md](./current-state.md) § The clocks protect nothing.
