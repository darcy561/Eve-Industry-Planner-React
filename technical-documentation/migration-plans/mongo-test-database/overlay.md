# Mongo test database — overlay

How the live Mongo test setup works **while this project is in flight**. Live docs remain the truth
where this file is silent; where they overlap, this file wins.

Nothing has landed yet. The setup today is exactly as
[testing/harness.md](../../testing/harness.md) § Live Mongo describes it: one database, tests gated
on `EIP_MONGO_PARITY_LIVE` writing into it, `ScratchAccount` for cleanup, and no CI job. See
[plan.md](./plan.md) § Starting position.

Each stage fills its section below as it lands, stating **what changed** and **how that part works
now** — not what is intended.

## Stage A — One database name

*Not started.* Will record: where the database name resolves, what `MONGO_DATABASE` does when set
and when absent, why `authSource` stays pinned, and what a service sees (nothing).

## Stage B — Isolation

*Not started.* Will record: what `ScratchDatabase` drops and what it refuses, which database
`mongolive.Require` binds to, and what `EnsureSchema` applies before a suite runs.

## Stage C — CI

*Not started.* Will record: how the job provisions a replica set, how `mongo:27017` resolves at both
ends, what the job skips, which tests skip inside it, and how it is triggered.

## Stage D — Remove the workaround

*Not started.* Will record: the gate's name, and what a test that once fell back to fixtures does
now.

## Deliberate differences from the setup being replaced

Every intended behavioural change lands here as a row, so a reader can tell a fix from a regression.

| Behaviour | Was | Is | Why |
|-----------|-----|----|-----|
| *(none yet)* | | | |
