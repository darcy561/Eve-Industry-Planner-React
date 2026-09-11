# Job dependency tree (`frontend/src/Styled Components/JobTreeFlow`, `frontend/src/Components/Groups/JobTree`)

Live SoT for choosing and focusing a job in the parent/child dependency tree. `JobDependencyTreeFlow`
is the one component: `GroupJobTreeFlow` draws it embedded on the group page, and
`JobDependencyTreeDialogue` draws the same component in a dialogue — built through the SPA's shared
dialogue shell (see [../technical-rules.md](../technical-rules.md) § Dialogues) — reachable both from
the group page and from Edit Job's link-parent-job view. This topic is what the tree itself does;
the dialogue shell and the linking rules that decide which jobs are offered belong to their own
owners.

## Choosing a job

Clicking a job brings its chain of parents and children forward and dims everything else. A job that
stops being drawn while it is the chosen one — narrowed out of the tree, or archived somewhere else
— stops being a choice: nothing stays dimmed for a job the tree no longer shows.

## Being taken to a job

Opening the tree already pointed at a job — the group panel opening on the job that was just built,
or the dialogue opening from Edit Job's link view — brings that job forward and centres the view on
it. Asking for the same job again takes the view back to it, whether that is reopening the dialogue
or returning to the group page from the job's own page.

What each caller hands the tree is the job to focus, not a signal that something happened:

- The **group panel** re-mounts for every request, because the job to focus arrives through the
  route's search parameters and every path that sets it crosses back from the job's own page — so a
  fresh mount is always a fresh request.
- The **dialogue** keys each request on the opening it came from, so a caller can name the same job
  twice across two separate openings and both are honoured, while a request that has not changed does
  not re-focus mid-view.
