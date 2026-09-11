# Effect-driven state synchronisation — behaviour overlay

What a reader sees differently, and how the parts named here work now. Where this project has no
overlay, the live frontend documentation remains the truth.

## A figure that follows something else is right on the first frame

**Where:** the reprocessing settings panel and the tax percentage field.

A component that holds a copy of a value it was handed used to bring the copy back into step in an
effect. Effects run after the browser has painted, so the first frame a reader saw carried the
previous value and the correct one arrived on the frame after.

It was visible in both places:

- The **reprocessing settings panel** opens itself when ores are already exempt, because a list the
  reader came to see is the reason to open it. Arriving with ores already exempt, the panel painted
  shut and then opened.
- The **tax percentage field** is reused as the reader moves between structures. Handed a new
  structure's rate, it painted the previous structure's rate and then corrected itself.

Both now bring the copy into step while rendering, so the first painted frame already carries the
right value and neither flash happens. Neither panel changes what it settles on — only when.

The panel still opens itself and never shuts itself; shutting it remains the reader's to do, and a
panel the reader has shut stays shut unless the exempt list changes again.

## The job status list is read once when the planner opens

**Where:** the hook behind the planner's job status accordions.

Opening the planner read the stored expansion state twice: once to seed the list, then again in an
effect that wrote a freshly built object holding the same answer, which made React render the
accordions a second time for no change. It is read once now.

What the reader sees is unchanged. The stages still follow the account — signing out and back in as
someone else shows that account's collapsed stages, not the previous reader's.

## Still open

Eighteen findings across thirteen files are unresolved and unexamined; see
[plan.md](./plan.md) for the phases and [measurements/inventory.md](./measurements/inventory.md) for
what they are. Nothing in this overlay describes them, and live documentation remains the truth for
every part of the SPA this project has not yet touched.
