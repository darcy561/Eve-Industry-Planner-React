# Frontend

## Owns (SoT)

SPA behaviour: React auth/session UX, credential acquisition, document-lock UI, routing and page
chrome.

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
| Frontend test entrypoints / depth | [../testing/frontend/contents.md](../testing/frontend/contents.md) |
