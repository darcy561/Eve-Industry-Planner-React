# The rest of the idioms table, as swept

The effects are counted separately in [effect-inventory.md](./effect-inventory.md). This file covers
every other row of [`../../frontend/technical-rules.md`](../../../frontend/technical-rules.md)
§ React 19 idioms, plus the adjacent modern-React surface, and records what was found clean as well as
what was not — so the sweep does not have to be repeated to find that out.

## Totals

| Shape | Sites | Tier |
|-------|-------|------|
| Store read during render with no subscription | 6 | 6 |
| A timer standing in for a transition | 2 | 7 |
| Context on the React 18 spelling | 2 contexts, 2 files | 8 |
| Hand-rolled pending state | 3 | 9 |
| Imperative handle from `useLayoutEffect` | 1 | 10 |
| **Total to change** | **14** | |

---

## Tier 6 — store reads that take no subscription (6)

A component calls a Zustand action **in its render body** through `useUsersStore.getState()` and uses
what comes back. `getState()` reads the store once and subscribes to nothing, so the component does
not redraw when that value changes. It renders whatever was there the first time and then goes quiet.

This is not the same as destructuring an *action* through `getState()`, which around twenty component
files do and which is correct — actions are stable, and reading them that way deliberately avoids a
subscription. The distinction is whether what comes back is a function to call later or a value to
render now.

**The shape that is right is already in the tree.**
`Components/Dashboard/Components/ItemWatch/ItemRow.jsx` destructures `findMarketData` through
`getState()` **and** subscribes with `useUsersStore((state) => state.worldData.marketData)` on the
line above, so it redraws when prices land and then calls the action fresh. The six below do the first
half without the second.

| # | Call site | What it reads | Why it matters |
|---|-----------|---------------|----------------|
| 6.1 | `Components/Edit Job/.../Market Costs Panel/marketCostsPanel.jsx:15` | `findMarketData(state.activeJob.itemID)` | Market data arrives asynchronously and is written to the store by `addMarketData`. The selling panel's prices are read once, on a render that may precede the fetch landing |
| 6.2 | `Components/Edit Job/.../Material Cards/addMaterialCosts.jsx:28` | `findMarketData(material.typeID)` | The same, per material card, on the purchasing stage |
| 6.3 | `Components/Groups/Breakdown/itemFrame.jsx:26` | `getActiveGroupObject()` | The read behind **defect D1**. The effect's empty dependency array is the second half of the same bug — neither the read nor the effect notices the group changing |
| 6.4 | `Components/Groups/Breakdown/breakdownframe.jsx:10` | `getActiveGroupObject()` | Same read, the parent of 6.3. Take the two together |
| 6.5 | `Components/Edit Job/Edit Job Components/Selling/LayoutSelector.jsx:10` | `getMainCharacterHash()` | Changes rarely, so unlikely to be seen. Same shape, low risk — correct it while in the file |
| 6.6 | `Components/Edit Job/.../Linked Transaction Panel/addCustomTransaction.jsx:20` | `getMainCharacterHash()` | As above |

6.1 and 6.2 are the two that can show a reader a wrong number, and they are **defect D4**.

## Tier 7 — a timer standing in for a transition (2)

| # | Call site | What it does |
|---|-----------|--------------|
| 7.1 | `Components/Edit Job/.../Tab Panel/linkedJobs.jsx:69` | Marks the job clicked, then `setTimeout(…, 800)` before unlinking it, dispatching and showing a snackbar |
| 7.2 | `Components/Edit Job/.../Tab Panel/availableJobs.jsx:89` | The mirror image, for linking |

The delay exists so a click animation plays before the row changes. Neither timer is cleared, so
leaving the page inside the 800ms window still mutates `state.activeJob` and dispatches from a
component that is gone — **defect D5**.

The closed [effect-state-sync](../../effect-state-sync/contents.md) project reached the same conclusion
about the tutorial card and recorded it as a lesson to carry: a hand-run timer beside a transition is
the transition's own callback written out longhand. MUI's `Fade`/`Collapse` `onExited` is where this
belongs, with the mutation in the callback rather than on a clock.

## Tier 8 — context on the React 18 spelling (2 contexts)

| # | Context | Sites |
|---|---------|-------|
| 8.1 | `JobTreeInteractionContext` | `useContext` at `Styled Components/JobTreeFlow/JobDependencyNode.jsx:24`; `<…Provider>` at `Styled Components/JobTreeFlow/JobDependencyTreeFlow.jsx:226` and `:297` |
| 8.2 | `PLANNER_DRAG_DATA_CONTEXT` | `useContext` at `Context/PlannerDnDProvider.jsx:57`; `<…Provider>` at `:148` and `:187` |

`use()` to read, `<Context>` as the provider. These two are the only reason `use()` appears nowhere in
the SPA, so this tier is also what puts the idiom in the tree for the first time.

## Tier 9 — hand-rolled pending state (3)

| # | Call site | What it does | Note |
|---|-----------|--------------|------|
| 9.1 | `Components/Accounts/AdditionalAccounts.jsx:70` | `isProcessing` guards an async account-import popup flow, set true on entry and false on both exits | `useTransition` |
| 9.2 | `Components/Settings/Standard Layout/customStructuresFrame.jsx:13` | `isLoading` prop-drilled into three children as `setIsLoading` | `useTransition`, and the drilled setter goes with it |
| 9.3 | `Components/First Login/planner-setup/FirstLoginCustomStructures.jsx:30` | The same, in a file that looks like 9.2 written twice | **Check for a duplicated source of truth before rewriting either.** If these are one panel in two places, that is the finding, and the pending state is a symptom |

The tree already uses these idioms in six places — `useActionState` in the crash report and archive
dialogues, `useOptimistic` in the layout settings frame, `useTransition` in the planner switcher, the
archived jobs list and the lock header control — so the shape is established and these three are
simply older.

## Tier 10 — an imperative handle from `useLayoutEffect` (1)

`Styled Components/autocomplete/virtualisedListbox.jsx:39` writes a `scrollToIndex` object onto a ref
handed in as a prop, inside the SPA's only `useLayoutEffect`, and clears it on cleanup.

`useImperativeHandle` is exactly this and says so at the call site. Worth noting the component already
takes `ref` as an ordinary prop, which is the React 19 shape — only the publishing is old.

This is the one finding the effect inventory could not have contained: it counted `useEffect` only.

---

## Swept and clean

Recorded so this does not get swept again. Each was checked across `frontend/src` at the same time as
the effect count.

| Idioms table row | Finding |
|------------------|---------|
| `ref` as an ordinary prop, over `forwardRef` | **No `forwardRef` anywhere.** `virtualisedListbox.jsx` already takes `ref` as a prop |
| `use()` for a promise or context | Only the two contexts in Tier 8; no promise is read in render, and none should be — data comes from React Query |
| `useActionState` / `useOptimistic` / `<form action>` | **No `<form>` with `onSubmit` in the SPA at all.** The three in Tier 9 are button flows, not forms |
| `useDeferredValue` / `useTransition` over debounce timers | **No debounce timer guards a render.** All 18 timer sites are lock leases, animations, popup grace periods, or Tier 7 |
| Document metadata rendered in a component | **No `document.title` write anywhere.** Titles come from `index.html`; per-route metadata is an opportunity, not a failure |
| Derive during render | Covered by the effect inventory's Tier 1, and by Tier 6 above |

Adjacent surface, also clean:

- **No class components, `PropTypes`, `defaultProps`, `createRef`, `useImperativeHandle` misuse,
  string refs, or `ReactDOM.render`.** One `import ReactDOM from "react-dom/client"` in `index.jsx`,
  which is correct.
- **No `fetch` or `axios` under `Components/`, `Hooks/`, `Styled Components/` or `routes/`.** React
  Query is the only data path.
- **No raw MUI `Dialog` parts outside `tests/muiStyleProps.test.jsx`.** All 29 dialogues are built on
  `ContentDialogue`, as the frontend rules require.
- **Error boundaries are `react-error-boundary`**, not hand-written classes — `ErrorBoundary.jsx` and
  `ContentErrorBoundary.jsx`.
- **Tests are colocated.** 345 `*.test.js(x)` sit beside the module they cover; `src/tests/` holds
  only shared harnesses and fixtures.
- **Dependencies are current**: React and React DOM 19.2.8, MUI 9.4, TanStack Query 5.102, TanStack
  Router 1.170, Zustand 5.0, Vite 8.2, `eslint-plugin-react-hooks` 7.1.

## The two defects found here

**D4 — a price panel that does not follow the price.** `marketCostsPanel.jsx:15` and
`addMaterialCosts.jsx:28` read market data during render through `getState()`, which subscribes to
nothing. Market data is fetched asynchronously and written to the store afterwards, so a panel
rendered before the fetch lands keeps the figure it first saw. `ItemRow.jsx` in the watchlist shows
what the correct shape looks like.

**D5 — a mutation that outlives the component.** `linkedJobs.jsx:69` and `availableJobs.jsx:89` delay
linking or unlinking a job by 800ms for an animation and never clear the timer. Navigating away inside
that window still mutates `state.activeJob`, dispatches, and raises a snackbar for a page the reader
has left.
