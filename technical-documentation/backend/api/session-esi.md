# `/api/v1` session and ESI surfaces

Planner **app session** (opaque Redis refresh + cookies) is separate from **ESI access JWT** (CCP) and from **OAuth credential storage** (Mongo).

How the SPA calls these → [frontend/auth/spa.md](../../frontend/auth/spa.md). Server-side session storage → [auth/sessions.md](./auth/sessions.md).

## Planner session

| Method | Path | Response `kind` |
|--------|------|-------------------|
| POST | `/api/v1/auth/sessions` | `session_bootstrap` |
| POST | `/api/v1/auth/sessions/bootstrap` | `session_bootstrap` |
| POST | `/api/v1/auth/sessions/rotate` | `session_rotate` |
| POST | `/api/v1/auth/sessions/logout` | (204 no body) |

Bootstrap payloads include `esi_oauth_storage`: `client` \| `server` (mirrors `userCloudAccounts`). The browser may also read `eip_esi_oauth_storage` cookie (routing hint).

## ESI access (split by storage mode)

| Mode | Method | Path |
|------|--------|------|
| Client-held OAuth refresh | POST | `/api/v1/eve-sso/tokens/refresh` |
| Server-stored OAuth refresh, one character | POST | `/api/v1/esi/characters/access-token/server` (private) |
| Server-stored OAuth refresh, several characters | POST | `/api/v1/esi/characters/access-tokens/server` (private) |

The plural form takes `character_hashes` (up to 50) and answers one row per character — an access token,
or an `error` for that character alone. It reads the account document once and writes the rotated rows
once, whatever the count.

Raw CCP OAuth exchange remains `POST /api/v1/eve-sso/tokens/exchange`.

## Linked-character OAuth credentials (server storage)

| Method | Path |
|--------|------|
| GET, PUT, DELETE | `/api/v1/user/linked-characters/oauth-credentials` |

GET returns character hashes only.
