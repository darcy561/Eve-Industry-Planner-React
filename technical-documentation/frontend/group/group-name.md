# Group name (`frontend/src/Components/Groups/Group Name`)

Live SoT for the group name panel at the top of a group, `groupNameFrame.jsx`. It shows
`group.groupName` and, for a reader who can edit, swaps that label for a text field to rename it.

## Opening the editor

The text field is seeded with the group's current name at the moment it opens, not kept in step with
the group the rest of the time. Two things follow on a group other members are also working in:

- Opening the field always shows the name as it stands right now — a rename that landed while the
  field was shut is on screen the next time it opens.
- A rename landing while the field is already open does not touch it. What the reader is typing is
  theirs until they save or revert; save writes it with `setGroupName` and
  `updateModifiedGroups`, then flushes the pending save immediately rather than waiting on the
  usual debounce, so the change reaches Mongo in time for other sessions' changestream/WS
  notification.

## Losing the right to edit

Losing edit access — `useActiveGroupCanEdit` turning false — while the field is open closes it and
drops whatever was typed; it does not reopen if access comes back. Reopening after that reads the
name fresh, rather than resuming on typing that may since have been overtaken by someone else's
rename. Edit access itself, and what makes a reader able to edit a group at all, is owned by
[../document-lock/spa.md](../document-lock/spa.md).
