# The findings, as counted

Raw output behind the plan's figures. Regenerate from `frontend/` with:

```bash
npx eslint . -f json | jq -r '.[].messages[] | select(.ruleId=="react-hooks/set-state-in-effect")'
```

Counted after the three resolved findings landed. Every remaining file is listed, with whether it had
a test at the time of counting.

## Remaining — 18 findings, 13 files, 0 with tests

| Finding | The call | Test file? |
|---------|----------|-----------|
| `Components/Dashboard/Components/ItemWatch/itemWatchContainer.jsx:152` | `setMarketReady(true)` | no |
| `Components/Dashboard/Dashboard.jsx:27` | `setShowTutorialGrid(true)` | no |
| `Components/Dialogues/Job Tree/JobDependencyTreeDialogue.jsx:177` | `setTrackedOpenSession(messageData.openSession)` | no |
| `Components/Dialogues/Job Tree/JobDependencyTreeDialogue.jsx:184` | `setFitSession((n) => n + 1)` | no |
| `Components/Dialogues/Price Entry/itemRow.jsx:136` | `setUnconfirmedEntries([initialEntry])` | no |
| `Components/Dialogues/Price Entry/itemRow.jsx:154` | `setUnconfirmedEntries([])` | no |
| `Components/DocumentLock/DocumentLockHeaderControl.jsx:169` | `setPassiveViewerFlash(false)` | no |
| `Components/Edit Job/editJob.jsx:117` | `setShowFloatingPrevStep(false)` | no |
| `Components/Edit Job/editJob.jsx:138` | `setShowFloatingNextStep(false)` | no |
| `Components/Edit Job/parentJobDialogue.jsx:62` | `updateMatches(newMatches)` | no |
| `Components/Groups/Group Name/groupNameFrame.jsx:28` | `updateAllowEditGroupName(false)` | no |
| `Components/Groups/Group Name/groupNameFrame.jsx:34` | `updateEditGroupNameText(selectedGroup.groupName)` | no |
| `Components/Groups/JobTree/groupJobTreeFlow.jsx:55` | `setFocusSession((n) => n + 1)` | no |
| `Components/Groups/Scheduler/CharacterSelection.jsx:45` | `setSelectedCharacterHashes(...)` | no |
| `Components/Tutorials/tutorialTemplate.jsx:43` | `setShouldMount(true)` | no |
| `Styled Components/JobTreeFlow/JobDependencyTreeFlow.jsx:77` | `setSelectedJobId(id)` | no |
| `Styled Components/JobTreeFlow/JobDependencyTreeFlow.jsx:83` | `setSelectedJobId(null)` | no |
| `Styled Components/LineGraph/priceHistory.jsx:68` | `setVisibleIndexRange(trailingRange(...))` | no |

## Verdicts (Phase 2)

Each finding read at its call site. Two of the first-pass buckets moved on reading: `priceHistory.jsx`
turned out to be a value being synchronised rather than a signal, and `itemRow.jsx:154` the reverse.

**Twelve of eighteen are correct where they stand.** The six that are not cluster around two
mechanisms, not eighteen independent problems.

### Correct in place — 12

| Finding | What replaces the effect |
|---------|--------------------------|
| `Dashboard.jsx:27` | Render-phase adjustment; a one-way latch, as the reprocessing panel already is |
| `groupNameFrame.jsx:34` | Render-phase adjustment, guarded on the group's **id** rather than the object — `getActiveGroupObject()` is called while rendering and its identity is not guaranteed stable, and guarding on identity would clobber what the reader is typing |
| `groupNameFrame.jsx:28` | No state at all: `allowEditGroupName && canEdit` where it is read |
| `CharacterSelection.jsx:45` | Render-phase adjustment — see the behaviour note below |
| `parentJobDialogue.jsx:62` | `useMemo`; the value is derived and nothing else writes it |
| `priceHistory.jsx:68` | Render-phase adjustment guarded on `seriesIdentity`, which the file already computes for this purpose |
| `editJob.jsx:117` | Derive the off value at the render site; the effect keeps only its observer |
| `editJob.jsx:138` | As above |
| `DocumentLockHeaderControl.jsx:169` | As above, though entangled with a ref reset on the same path |
| `JobDependencyTreeDialogue.jsx:177` | A ref: it is an "already reported this session" latch that nothing renders |
| `tutorialTemplate.jsx:43` | MUI `Fade` with `unmountOnExit`, which is how `Collapse` is already used elsewhere, instead of a mount flag and a matching timer |
| `JobDependencyTreeFlow.jsx:83` | Derive at use: `jobIdSet.has(selectedJobId) ? selectedJobId : null` |

### Needs a different shape — 6

| Finding | Why it is not a lint fix |
|---------|--------------------------|
| `JobDependencyTreeDialogue.jsx:184` | A counter bumped so the tree below re-runs a fit. The state carries no value; it is a message. Removing it means changing how the message is sent |
| `groupJobTreeFlow.jsx:55` | The same mechanism, sending the same kind of message |
| `JobDependencyTreeFlow.jsx:77` | The receiving end of that mechanism, unpacking a composed key back into an id |
| `itemRow.jsx:136` | Seeds editable state rather than deriving a value — the entry it creates is then edited by the reader, so it cannot simply be computed while rendering |
| `itemRow.jsx:154` | Clears that state on a trigger counter; the same signal mechanism as the tree, in a second place |
| `itemWatchContainer.jsx:152` | A loading flag around a fetch. The frontend rules already say a fetch belongs to React Query, which the SPA uses everywhere else |

### One behaviour worth recording

`CharacterSelection.jsx:45` re-selects **every** character whenever `allCharacters` changes identity
and the current selection is empty. A reader who has deliberately deselected everyone therefore has
the whole list re-selected under them the next time that array is rebuilt. That is not what the
effect is for, and any replacement should keep "nobody selected" as a state the reader can hold.

## Resolved before this project — 3 findings

Kept because the plan's starting position cites them and because they are the worked examples for the
first shape.

| Finding | What replaced the effect |
|---------|--------------------------|
| `Styled Components/Textfield/tax.jsx:44` | The copy is brought into step while rendering, guarded on the value it was last shown for |
| `Hooks/useJobStatuses.js:29` | The same, guarded on the account id; the stored map is now read once |
| `Components/Reprocessing/reprocessingSettingsPanel.jsx:50` | The same, guarded on the exempt count, with the initial state seeded from that count |

Each carries a characterisation test written before the change, and each test was confirmed to fail
against a deliberately broken version of the fix.

## What the count does not say

- **Difficulty is not spread evenly.** Twelve are corrections in their own file. The other six are
  two mechanisms — a signal sent by bumping a counter, used in three places, and the price-entry
  rows that are seeded rather than derived — plus one fetch that belongs in React Query.
- **No test anywhere.** Every remaining file starts from zero, so each fix carries the cost of a
  characterisation test before it. The three resolved findings took roughly as long as an entire
  earlier group of twenty-one for that reason.
- **The count is a lint count, not a defect count.** Only one finding turned out to misbehave, and
  its symptom is not what the rule is about: see the `CharacterSelection.jsx` note above. Two of the
  three already resolved changed only which frame a correct value appeared on.
