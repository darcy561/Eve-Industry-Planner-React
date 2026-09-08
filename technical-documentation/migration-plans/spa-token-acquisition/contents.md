# SPA token acquisition

## Owns

- The plan to make the SPA acquire auth tokens at the point of use instead of maintaining them on
  React-mounted clocks, and the fix for the stuck-session defect — [plan.md](./plan.md).
- The evidence that the background clocks protect nothing, and the inventory of every call site that
  reads a token as a snapshot — [current-state.md](./current-state.md).
- The in-flight description of how token acquisition works after the change — [overlay.md](./overlay.md).

## Does not own

- Current SPA auth behaviour → [frontend/auth/spa.md](../../frontend/auth/spa.md). Live SoT, untouched
  until this project promotes.
- Wire contracts and vocabulary for sessions, rotate and bootstrap →
  [backend/api/auth/overview.md](../../backend/api/auth/overview.md). This project changes no request
  or response shape.
- Which storage mode an account uses. Cloud and local both stay supported; the project confines the
  distinction to one module rather than removing it.
- ESI domain data caching. React Query keeps its keys, `staleTime` and invalidation as they are.

## Task map

| I need to… | Read |
|------------|------|
| Understand why the clocks are being deleted rather than relocated | [current-state.md](./current-state.md) |
| Find every call site that reads a token as a snapshot | [current-state.md](./current-state.md) § Inventory |
| Know how a token is obtained after the change | [overlay.md](./overlay.md) |
| Understand why a dead refresh token strands a session, and how it is fixed | [plan.md](./plan.md) § Stage G |
| Pick up the outstanding work | [plan.md](./plan.md) |
