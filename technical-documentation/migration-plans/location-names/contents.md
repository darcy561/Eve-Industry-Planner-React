# Location names

## Owns

Plan, stage notes and behaviour overlay for rebuilding how the SPA turns an EVE id into a name:
station, system and region names from ESI's bulk lookup, structure names from each linked
character's token, and the community-submitted store as the fallback beneath them.

In scope: the outcome a resolution settles into and which of those are cached, the per-id cache and
the loader that keeps the wire bulk, `useLocationNames` and the five call sites that resolve names
without it, and the fate of `worldData.universeIDs`.

## Does not own

- Where public ESI reads live in general — market prices and other bulk public data are fetched and cached server-side → [backend/contents.md](../../backend/contents.md). This project settles one lookup, and settles it as staying in the SPA
- The community citadel-name store's storage, submission path and moderation → the API's `citadel-names` endpoints, unchanged by this project except for a possible batch read, which is an open decision
- The asset and blueprint row collections that ask for names → [frontend/esi-collections/](../../frontend/esi-collections/contents.md). Their consumers keep the hook signature they have
- ESI rate limiting and the request queue beneath these calls → [backend/contents.md](../../backend/contents.md)
- Authentication and token acquisition → [frontend/auth/spa.md](../../frontend/auth/spa.md). This project consumes tokens, it does not manage them
- Live behaviour after promote → [frontend/esi-collections/location-names.md](../../frontend/esi-collections/location-names.md), which this project's overlay replaces

## Task map

| I need to… | Read |
|------------|------|
| Understand the goal and why it is a redesign rather than a fix | [plan.md](./plan.md) § The goal, § Defects |
| See what a player is actually reporting | [plan.md](./plan.md) § What a reader sees today |
| Find the defect behind a symptom, and the evidence for it | [plan.md](./plan.md) § Defects, and the evidence for each |
| Know what a resolution can answer, and which answers are kept | [plan.md](./plan.md) § The outcome vocabulary |
| See the order the sources are tried in | [plan.md](./plan.md) § The resolution ladder |
| Know why the cache is keyed by id | [plan.md](./plan.md) § One entry per id |
| Keep the wire bulk while the cache is per id | [plan.md](./plan.md) § Batching without set-keyed caching |
| Find everywhere that resolves a name today | [plan.md](./plan.md) § Who resolves names today |
| See what a stage does and what it deletes | [plan.md](./plan.md) § Stages |
| Know what tests a stage owes | [plan.md](./plan.md) § Testing |
| Check what is still undecided | [plan.md](./plan.md) § Open decisions |
| See what has landed | [plan.md](./plan.md) § Stage status |
| Read how resolution works today, before any stage lands | [overlay.md](./overlay.md) § Current behaviour |
| Read how a stage works once it has landed | [overlay.md](./overlay.md) |
| See what ESI actually answered, rather than what the plan assumed | [measurements/](./measurements/) |
| Promote this project into live documentation | [plan.md](./plan.md) § Promote map |
