# Frontend

## Owns (SoT)

SPA behaviour: React auth/session UX, credential acquisition, document-lock UI, routing and page
chrome, and the normalised ESI asset and blueprint row collections — their index hooks, the login
prefetch that fills them, and shared location-name resolution.

## Does not own

- Auth vocabulary / wire contract / HTTP sessions → [backend/api/auth](../backend/api/auth/overview.md)
- Document-lock Redis/HTTP → [backend/api/document-lock](../backend/api/document-lock/overview.md)
- Stack/ops → [stack/](../stack/contents.md)
- What maintenance mode does across the stack → [backend/maintenance-mode.md](../backend/maintenance-mode.md)

## Task map

| I need to… | Read |
|------------|------|
| Change SPA auth, bootstrap, refresh UX, realtime auth client | [auth/spa.md](./auth/spa.md) |
| Change document-lock UI / Zustand / hooks | [document-lock/spa.md](./document-lock/spa.md) |
| Change routing, page chrome, or navigation behaviour | [navigation/spa.md](./navigation/spa.md) |
| Change the asset row shape, its resolution rules, or how an asset view is assembled | [esi-collections/assets.md](./esi-collections/assets.md) |
| Change the blueprint row shape, corporation blueprint access, consolidation or library filters | [esi-collections/blueprints.md](./esi-collections/blueprints.md) |
| Change the index hooks, their scopes, or how a derived collection is shared | [esi-collections/row-collections.md](./esi-collections/row-collections.md) |
| Change what login prefetches, when, or under what budget | [esi-collections/prefetch.md](./esi-collections/prefetch.md) |
| Resolve a location or container id into a name | [esi-collections/location-names.md](./esi-collections/location-names.md) |
| Frontend test entrypoints / depth | [../testing/frontend/contents.md](../testing/frontend/contents.md) |
