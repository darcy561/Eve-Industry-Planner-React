# Service import boundaries

## Owns

Plan and stage notes for removing the imports that reach from one service under `services/` into
another, and for the shared homes the moved code needs.

## Does not own

- Live behaviour of the code being moved — sessions, SSO validation, request middleware → [backend/contents.md](../../backend/contents.md)
- The `services` ↔ `deployment-tool` no-cross rule, which is separate and already documented → [technical-rules.md](../../technical-rules.md)
- Splitting `shared/` into local modules → [service-library-modules/contents.md](../service-library-modules/contents.md)

## Task map

| I need to… | Read |
|------------|------|
| Understand the rule and why these break it | [plan.md](./plan.md) |
| See every crossing import and what it uses | [plan.md](./plan.md) § The crossings |
| Understand why the session package is shaped the way it is | [plan.md](./plan.md) § The pass-through wrapper layer |
| See the package layout the move produces | [plan.md](./plan.md) § Target layout for the moved code |
| Know what the session types are called and why | [plan.md](./plan.md) § Naming |
| Understand why the new package is built alongside the old | [plan.md](./plan.md) § How the session work is sequenced |
| Know where each piece is going | [plan.md](./plan.md) § Destinations |
| Check what has landed | [plan.md](./plan.md) § Stage status |
