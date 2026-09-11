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

## The scheduler keeps the characters you chose

**Where:** choosing which characters the group scheduler plans for.

That panel has a button for taking everyone out at once, so nobody chosen is a
choice a reader can make. It was not read that way. The default — everyone chosen —
was applied whenever there were characters and none was chosen, and "none chosen"
cannot tell "the reader has taken everyone out" from "this has not been set up yet".

So a reader who took everyone out had all of them put back the next time anything
rewrote the character list in the store, and the scheduler was told to plan for all
of them without the reader touching it.

The default now follows whether there *are* any characters rather than whether any
are chosen. It applies when they first arrive — they load after the panel draws — and
not again. Taking everyone out now survives, and a character added later still arrives
unchosen, as it did before.

## Renaming a group

**Where:** the group name panel at the top of a group.

The name in the editing box is now filled in at the moment the box is opened, rather
than being kept in step with the group the whole time it is shut. Two things follow
from that on a planner someone else is also working in:

- If another member renames the group, opening the box shows the name on screen.
  It used to show whatever the name was when the page drew.
- A rename arriving while the box is open no longer takes over what is being typed.
  What a reader has typed is theirs until they save or revert.

Losing the right to edit mid-rename still shuts the box and throws the typing away, and
it now stays shut if the right comes back, rather than reopening on a half-typed name
that may since have been overtaken.

## A value that follows another is brought into step the same way everywhere

Six places now share one way of saying "this value moved, bring the copy into step":
the tax field, the job status stages, the reprocessing panel, the recalculation notice,
the scheduler's character list and the group name panel's edit lock. What each of them
does is unchanged — the four that already worked this way kept every one of their tests.

## The floating step buttons on a job

**Where:** the arrows that follow a reader down a long job step.

Unchanged to look at: the floating arrow still appears when the step's own button
has scrolled off the screen, and goes away when it comes back. What changed is
underneath — one piece now watches the button and answers the question, instead of
two near-identical copies keeping a flag each.

One case went with them: a floating arrow used to appear if the step's own button
could not be found at all. Nothing produces that case — the button is drawn whenever
the move is available — so the arrow now follows the button it stands in for.

## The tutorial cards

**Where:** the help cards on the dashboard, the planner's side menu and each job step.

A card still fades away over a second when a reader turns tutorials off, still comes
back when they turn them on, and still holds its place on the dashboard until the fade
has finished, so the panels below do not jump up mid-animation. The fade is MUI's own
now rather than a hand-run timer beside it, which is one less place for the second to
be written down.

## The price history chart

**Where:** the window selector under the price history graph.

Nothing changes for a reader. The chart still opens on the last month of history —
the last week on a phone — still goes back to that window when the item or region
changes, and still leaves a window the reader has dragged alone until one of those
changes. It arrives at the opening window straight away now rather than being put
there immediately after the first render.

## Linking a parent job

**Where:** the Link Parent Job dialogue on the job being edited.

The dialogue is built when a reader asks for it and taken away when they close it,
rather than sitting on the page waiting. It is drawn by the SPA's shared dialogue
shell now, like the rest of them. It reads every job on the planner to work out
what it can offer, and that work now happens only when the dialogue is being looked at.
The list is worked out as it draws, so it is right on the first frame; it used to be
worked out just after, which left the dialogue showing "No Jobs Available" for a frame
before the list arrived.

It closes at once instead of fading out. Opening is unchanged.

Which jobs are offered is unchanged: a job built from what this one makes, not already
linked and not already waiting to be linked, in the same group when the job being
edited is in one — plus any link the reader has just taken off, so they can put it back
without leaving the job.

## The lock icon's nudge when someone comes to watch

**Where:** the document lock control in the app bar.

Holding the lock and having the first reader arrive to watch still pulses the icon
for a moment. It now stops the moment the reason does: the viewer leaving, the lock
changing hands, or the header moving to another document. Before, the pulse was a
plain "on" that each of those had to remember to switch off, and a reader who lost
the lock mid-pulse kept it.

## Choosing a job in the dependency tree

**Where:** the job dependency tree, on the group page and in its own dialogue.

Clicking a job still brings its chain forward and dims the rest. A job that leaves
the tree while it is the chosen one — narrowed out of the view, or archived from
somewhere else — no longer leaves every other job dimmed behind it.

## What counts as opening the job tree

**Where:** the record kept of the job dependency tree dialogue being looked at.

Unchanged for a reader. An opening is still counted once, and reopening still
counts again — including the case where a caller names the opening's id and the
same id comes back, which stays one opening. What was a piece of state is now a
note to one side, because nothing was ever drawn from it.

## Prices on the item watchlist

**Where:** the watchlist panel on the dashboard.

The wait for prices before the rows appear is unchanged, and so is what happens when
they cannot be fetched: the rows are drawn anyway, without them. The prices are asked
for the way the rest of the SPA asks for things now, so two watchlists open at once
ask once between them rather than once each.

## Being taken to a job in the tree

**Where:** the job tree on a group page, and the job tree dialogue.

Opening the tree on a particular job still brings that job forward and moves the
view to it, and asking for the same job again still takes you back to it — on
reopening the dialogue, or on returning to the group page from that job. What
changed is underneath: the tree is handed the request itself rather than a counter
raised to get its attention.

## Pricing what is left of an item

**Where:** the price entry dialogue.

Each row still offers you a price box for however much of that item is not yet
priced, and still takes it away once nothing is left. What changed is that the row
follows the figure — how much is left — rather than being told separately that
something happened elsewhere. Confirm All no longer has to announce itself: it
writes the prices in a way the rows can see.

A row you are part way through filling in is left alone unless the amount left to
price actually moves.
