# Technical rules (frontend)

Applies to the SPA / frontend tree. On overlap with the project master [`../technical-rules.md`](../technical-rules.md), **this file wins**; otherwise the master applies.

## What already applies (from the master)

From root **Engineering practices — shared** (not Go-only):

- **One SoT** for shared facts — gather/build in the SPA from the owning SoT; no parallel hard-coded lists (public env knobs, product strings, theme tokens, etc.).
- **Modern platform idioms** — current React / JavaScript practices as used in-repo; prefer newer patterns over legacy ones when both work; explain options + pros/cons when choosing.
- Reusable helpers/modules; no legacy wrappers after a refactor; no one-file-per-folder sprawl.
- Dependencies kept current as we touch an area; check freshness/deprecation before new packages.
- Testing as we build; no secrets in client bundles or logs; API/wire compat flagged in planning.

## React 19 idioms

The SPA runs **React 19**. It was built across 18 and 19, so both generations of idiom are still
present. New and edited code uses the React 19 way; React 18 patterns are migrated **as files are
touched** rather than in a separate sweep, so the tree converges without a large untested change.

When editing a component, prefer the 19 idiom over its 18 equivalent, and modernise the surrounding
patterns in the file you are already working in. Do not open a project-wide migration unless asked
for one.

| Prefer | Over |
|--------|------|
| `ref` as an ordinary prop, and ref cleanup functions | `forwardRef` wrappers |
| `use()` for reading a promise or context in render | a `useEffect` that sets state from a promise |
| `useActionState` / `useOptimistic` / `<form action>` | hand-rolled pending, error and rollback state |
| `useDeferredValue` and `useTransition` for expensive updates | debounce timers guarding a render |
| Document metadata rendered directly in a component | side-effect writes to `document.title` and friends |
| Context read with `use()`, and `<Context>` as the provider | `useContext()` and `<Context.Provider>` |
| The compiler-friendly shape: derive during render | `useEffect` that only mirrors props into state |

**`useEffect` is the pattern most worth questioning.** Most of its uses in this tree predate the
alternatives: an effect that only derives a value from props or state should compute during render,
and one that only fetches should belong to React Query, which the SPA already uses everywhere.
Effects are for synchronising with something outside React — a subscription, a websocket, an
observer, a timer.

**Do not rewrite working code for its own sake.** The rule applies to code being written or edited
for another reason. A 19 idiom that would change behaviour, or that no test covers, is worth
flagging before taking it.

## Class members: getters and methods

A class in `frontend/src/Classes` exposes a **getter** when the member reads the object's
fields or totals its rows — `job.buildCost`, `material.quantityRemaining`, `job.childJobIDs`.
It exposes a **method** when the member takes an input, changes the object, or calculates a
figure from more than a sum — `job.materialRequirement(typeID)`, `job.importPurchaseToMaterial(...)`,
`job.buildCostPerItem()`.

A getter is the get: name it for the value, not for fetching it. `parentJobIDs`, not
`getParentJobIds`.

Derived values are getters rather than stored fields, so a figure cannot fall behind what it is
derived from. They are absent from a spread of an instance, so an object built with
`{ ...job }` carries the fields and none of the derived values — pass instances, or rebuild
with the class.

## Tests sit beside what they test

A `*.test.js(x)` lives in the same folder as the module it covers, the way `_test.go` does in
[`services/`](../../services/). `Functions/Auth/plannerAuthCookies.js` is tested by
`Functions/Auth/plannerAuthCookies.test.js` next to it, not from a separate tests tree.

Anything reusable across tests — fixtures, harnesses, store seeding, the Vitest setup file — lives in
[`frontend/src/tests/`](../../frontend/src/tests/). That folder is the SPA's counterpart to the
repo-root [`testing/`](../../testing/) module: **look there before writing a helper inside a test
file, and put a new reusable one there**. Helpers copied into each file that needs them are the
failure this prevents.

## Lint and format

The SPA is linted by **ESLint** ([`frontend/eslint.config.mjs`](../../frontend/eslint.config.mjs),
flat config) and formatted by **Prettier** ([`frontend/.prettierrc.json`](../../frontend/.prettierrc.json)).
`npm run lint` and `npm run format:check` run both, and the `frontend` job in
[`.github/workflows/test.yml`](../../.github/workflows/test.yml) runs them beside the Vitest suite.
Fix what they report in the area you are editing. Where a rule is genuinely wrong for the code in
front of you — a chart asserted by selector because its marks carry no name, a clock the rule cannot
see the dependency for — disable it at the narrowest scope that covers the case and write the reason
on the disable. What is not wanted is a disable that exists to avoid the work.

The rule set is **`@eslint/js` recommended plus `eslint-plugin-react-hooks`**, with
`jsx-a11y` on the SPA and the Vitest and Testing Library plugins on `*.test.*`. React-specific
coverage comes from `react-hooks`, which carries the React Compiler's rules —
`set-state-in-effect`, `immutability`, `purity`, `refs` — that flag exactly the React 18 patterns
the section above asks you to migrate. The rules are a bar to write to, not a build step: the
compiler itself is **not** enabled, so nothing here is memoised for you.

There is no `eslint-plugin-react`: its `recommended` set is almost entirely `react/prop-types`, and
this SPA types through JSDoc.

`react-hooks/exhaustive-deps` is a **warning, and is never autofixed**. A narrow dependency list in
this tree is usually deliberate — a memo that must not recompute when an unrelated reducer dispatch
returns a new state object, a callback TanStack requires to stay referentially stable. Completing
such an array is a behaviour or performance change wearing a lint fix's clothes. Read the effect and
its tests, then either fix it properly or leave a `// eslint-disable-next-line` **carrying the
reason**.

A leading underscore (`_get`, `_ev`) marks a binding kept for arity or destructuring position;
`no-unused-vars` ignores those and will not ignore anything else.

## Frontend-specific bar (TBD)

Design-system / visual / SPA-only conventions (component libraries, routing, styling) will be written
here when we have them. Until then, follow the shared master — do not invent a second undocumented
global frontend standard.
