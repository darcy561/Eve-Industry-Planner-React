# Location names (`frontend/src/Hooks/EveEsi/useLocationNames.js`)

Live SoT for how a location or container id becomes a name a player reads — the one place this
happens for both collections. Hook:
[`frontend/src/Hooks/EveEsi/useLocationNames.js`](../../../frontend/src/Hooks/EveEsi/useLocationNames.js).
Walk: [`frontend/src/Functions/EveESI/World/resolveLocationNames.js`](../../../frontend/src/Functions/EveESI/World/resolveLocationNames.js).

Which locations an asset or blueprint view needs named comes from
[assets.md](./assets.md) and [blueprints.md](./blueprints.md); this topic only covers turning an id
into a name.

## Asking for names

`useLocationNames(locationIds)` takes the locations a view needs named and returns the names it has,
alongside loading and error state. It asks only for what `worldData` does not already hold, so a
second consumer wanting the same locations resolves nothing and reads through the store instead. A
consumer that counts quantities rather than rendering a location simply never calls this hook, so it
never waits on a name round trip.

A module-level claim set (`beingResolved`) tracks ids a resolution is already running for, anywhere
in the app, keyed by id rather than by caller. The query only asks for ids that are both missing from
`worldData` and not already claimed, so a second screen wanting an overlapping-but-different set of
locations waits on the first's running resolution rather than asking ESI again for what is already in
flight. Claims are released once the walk they belong to settles (`releaseClaims`), which is announced
to every hook instance through a version counter (`useSyncExternalStore`) — a consumer that stood
aside for a running resolution has no other signal telling it the claim was dropped, since a failed
resolution writes nothing to the store and would otherwise be waited on for the rest of the session.
Claiming itself is silent, so the consumer doing the resolving does not see its own ids disappear from
under its own running query.

## The walk

`resolveLocationNames(missing, characters)` is the walk beneath the hook, and `worldData` is written
from there, once, at the end. Access to a structure's name is **per character** — one pilot holds
docking rights where another does not — which is why a walk over every character exists at all. A
refusal comes back from ESI as a *named placeholder* rather than an absence, so the walk holds a
placeholder without treating it as settled, and a structure only settles as genuinely unreachable once
every character has failed to name it — the second and third characters are still asked, rather than
being skipped because the first already produced a value.

The store is written once, at the end of the walk, rather than per character: `worldData`'s reader
skips whatever the store already holds, so a placeholder written mid-walk would hide the id from the
characters still to be tried.
