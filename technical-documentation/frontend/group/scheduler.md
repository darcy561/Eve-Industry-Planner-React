# Group scheduler — character selection (`frontend/src/Components/Groups/Scheduler`)

Live SoT for who the scheduler plans for. `CharacterSelection.jsx` owns the checkbox list and its
default; `useGroupScheduler` takes the resulting rows and turns them into a schedule — that half is
not this topic.

## The default

Every tracked character starts selected, applied once: the first time the account's character list
has anything in it. Nothing re-applies the default after that. A reader who deselects one character,
or all of them with the panel's **Deselect All** button, keeps that choice — a later rewrite of the
character list, from anywhere in the store, does not put anyone back. A character added to the
account after the panel has already seeded its default arrives unselected, the same as any other
change the reader has not acted on.

What decides whether the default applies is whether the character list has gone from empty to
non-empty, not whether anything is currently selected. Reading it the second way cannot tell "the
reader chose nobody" from "this has not loaded yet," and would put everyone back the moment the store
rewrote the character list — those are both "nothing selected." The list itself arrives after the
panel first draws, since characters load from the account rather than from a prop, which is why the
default has to be applied when they turn up rather than only on mount.

## Selecting characters

`onSelectionChange` reports the current set of selected `Character` rows to `GroupSchedulerFrame`
whenever the selection changes, including the moment the default seeds it. Toggling one checkbox,
**Select All**, and **Deselect All** all go through the same selected-hashes state; nothing about the
default path is a separate write.
