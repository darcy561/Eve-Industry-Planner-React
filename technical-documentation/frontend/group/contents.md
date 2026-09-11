# Frontend — group page

## Owns (SoT)

Behaviour of the group page's own panels under
[`frontend/src/Components/Groups`](../../../frontend/src/Components/Groups) and the job dependency
tree shared with Edit Job's link view: which characters the scheduler plans for by default and how
that default is seeded, how the group name is edited, and how choosing or being taken to a job in
the dependency tree behaves.

## Does not own

- Document-lock UI, the header icon, and per-scope read-only rules → [../document-lock/spa.md](../document-lock/spa.md)
- Routing and page chrome → [../navigation/spa.md](../navigation/spa.md)
- The asset and blueprint row collections a group's jobs draw material from → [../esi-collections/contents.md](../esi-collections/contents.md)
- The SPA's shared dialogue shell → [../technical-rules.md](../technical-rules.md) § Dialogues
- Edit Job's own reducer and panels → not yet documented here

## Task map

| I need to… | Read |
|------------|------|
| Change which characters the scheduler includes by default, or how a reader's selection is kept | [scheduler.md](./scheduler.md) |
| Change how the group name is edited, or what happens to it while another member renames the group | [group-name.md](./group-name.md) |
| Change how a job is chosen or focused in the dependency tree, on the group page or in its dialogue | [job-tree.md](./job-tree.md) |
