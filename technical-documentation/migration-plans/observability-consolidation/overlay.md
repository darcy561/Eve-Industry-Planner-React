# Observability consolidation — behaviour overlay

How the parts this project touches work **after** each stage lands. Live docs remain the truth
wherever this file has no section. Sections fill in as stages complete — see
[plan.md](./plan.md) § Stage status.

## Logging with the observability layer off

`LOG_LEVEL` is the floor for everything a Go service emits, read in `services/shared/logs` and
applied once with `zap.IncreaseLevel` so the stdout core and the OTLP core cannot disagree about what
was logged. Accepted values are `debug`, `info`, `warn` and `error`; anything else, including unset,
is `info`. Changing it restarts the services rather than the collector.

Nothing downstream filters by severity any more. `config.alloy` carries no `LOG_LEVEL` and the
`alloy` service no longer receives one, because a process that floors at source leaves the collector
nothing to drop.

`debug_steps` follows the same rule. `logs.DebugStepsField` returns `zap.Skip` unless the level is
debug, so the field is never emitted rather than emitted and scrubbed downstream. Steps are still
collected on every operation, so raising the level is a restart and not a code path.

Which sinks a service writes to is unchanged and still decided by `OBSERVABILITY_ENABLED`:

| Layer | Sinks |
|---|---|
| Off | Stdout only, JSON with caller |
| On | OTLP to the collector, plus a stdout mirror when `LOG_STDOUT` is true or `ENVIRONMENT` is development |

`LOG_STDOUT` now reaches the processes it documents. It and `LOG_LEVEL` travel together on the
`x-log-env` anchor in `docker-stack.yml`, which every Go service merges — `ws-router` and
`capacity-controller` included, neither of which received either variable before.

Every service in every fragment rotates its stdout: `json-file`, 10 MB per file, 5 files. It is an
`x-log-rotate` anchor defined once per fragment and merged onto each service, so there is nothing
per-service to keep in step. That matters most with the layer off, when stdout is the only copy of a
container's logs.

## Infrastructure and edge metrics

Alloy collects everything. Prometheus scrapes nothing but itself, and its `scrape_configs` holds one
job for that reason alone.

| Source | How Alloy gets it | `job` |
|---|---|---|
| Redis | `prometheus.exporter.redis` (embedded) | `redis` |
| Host | `prometheus.exporter.unix` (embedded) | `node` |
| MongoDB | `prometheus.exporter.mongodb` (embedded) | `mongodb` |
| NATS | `prometheus.scrape` of the `nats-exporter` container | `nats` |
| Asynq queues | `prometheus.scrape` of `asynqmon` | `asynqmon` |
| SeaweedFS | `prometheus.scrape` of `seaweedfs:9327` | `seaweedfs` |
| Traefik | native OTLP push to `alloy:4317` | `traefik` |

Three exporter containers are gone. `nats-exporter` remains because Alloy has no NATS exporter
component; `asynqmon` remains because it is a queue UI as well as a metrics source.

**Embedded exporters do not take their `job` from the scrape.** Their targets arrive carrying
`job="integrations/<name>"`, and a target label beats `prometheus.scrape`'s `job_name`, so each one
passes through a `discovery.relabel` that rewrites `job` before the scrape. The static scrapes carry
no target `job`, so `job_name` works there directly. Getting this wrong is silent: metrics arrive and
the dashboards that filter on `job` stay empty.

**Infrastructure scrapes bypass `prometheus.relabel "otel_collector"`.** That component stamps
`job="otel_collector"` on everything crossing it, which is what the application dashboards filter on.
Each infrastructure scrape forwards straight to `prometheus.remote_write.local.receiver` instead.

**Traefik is the exception that goes through it**, because OTLP push lands on the same pipeline as the
applications. A second rule keyed on `service_name = "traefik"` runs after the stamp and takes it back
out — relabel rules apply in order. Its metric names are unchanged from the Prometheus exposition it
replaced, `_bucket` histogram series included.

**Alloy holds credentials and host access it did not before.** `REDIS_PASSWORD`,
`MONGO_ROOT_USERNAME` and `MONGO_ROOT_PASSWORD` reach it as environment, read with `sys.env`, and the
host filesystem is bound read-only at `/host` for the unix exporter's `rootfs_path`, `procfs_path` and
`sysfs_path`. That avoids putting Alloy in the host PID namespace, which is how `node_exporter` used
to read host `/proc`. Mongo credentials sit inside `mongodb_uri` because the component takes them no
other way; that is safe unescaped only because `EnvFields` constrains a generated password to the
url-safe base64 alphabet.

**SeaweedFS is new coverage**, not a move — it was never collected before. Under `mini` one port
serves master, filer, filerStore, volume server and admin metrics together; the `-s3.metricsPort` the
CLI advertises never listens in that mode.

## What each service reports

_Empty until Stage C lands._

## Where telemetry goes

Alloy is the only collector. Prometheus stores metrics, Loki stores logs, Grafana queries both.

| Signal | Path |
|---|---|
| Application metrics | OTLP → Alloy → `prometheus.remote_write` → Prometheus |
| Infrastructure metrics | Alloy's embedded exporters and scrapes → the same `remote_write` |
| Traefik metrics | Native OTLP push → Alloy → the same `remote_write` |
| Application logs | OTLP → `scrub_otlp_boilerplate` → `otelcol.exporter.otlphttp` → Loki `/otlp` |
| Container stdout | `loki.source.docker` → `loki.write` → Loki's push API |
| Traces | Discarded at `otelcol.exporter.debug` |

**Container stdout keeps Loki's native push rather than being bridged onto OTLP.** Sending it through
`otelcol.receiver.loki` and out of the shared OTLP exporter works, and was in place while an
alternative backend was evaluated, but against Loki it delivers `compose_service`, `container`,
`swarm_service` and `task_slot` as structured metadata instead of stream labels. Every `logs-*`
dashboard selects `{compose_service="…"}`, so those queries return nothing. The two log paths
therefore leave Alloy by different exporters, and that is deliberate.

**`loki.source.docker` takes `discovery.relabel.docker.output`, not the raw target list.** Passing
`discovery.docker.docker.targets` with `relabel_rules` supplied separately applies `drop` actions to
entry labels rather than to the tailing set: every container gets tailed, and services named in a
drop rule still arrive. The dropped set is the six Go services, which export OTLP logs of their own,
and the four socket proxies.

## Reading the ESI limiter

_Empty until Stage E lands._

## Traces

**The Go services export spans to the collector, and Sentry receives errors only.** A tracer
provider is built whenever `OTLPEndpoint` is set — the same condition that already governs metric
and log export — so tracing follows the observability addon rather than the Sentry DSN.

**Nothing about tracing runs with the addon off.** `OTLPEndpoint` resolves to empty unless
`OBSERVABILITY_ENABLED` is true, so the services install a noop tracer and build no exporter, rather
than buffering spans for a collector that is not deployed. Tempo itself lives in
`docker-stack.obs.yml`, which is only deployed when the addon is on, alongside Prometheus, Loki and
Grafana. A test covers the service half of that.

`sentry.Init` runs with `EnableTracing: false` and without `sentryotel.NewOtelIntegration`, so
errors, grouping and release tracking are unchanged and no span reaches Sentry. The SPA is
unaffected: its browser tracing reports straight to Sentry, never touches the collector, and keeps
its own `SENTRY_TRACES_SAMPLE_RATE`, baked at image build through `vite.config.js`.

**One sample rate governs the whole request path.** The services read `TRACES_SAMPLE_RATE`, which
already drove `--tracing.sampleRate` on Traefik, and sample `ParentBased`. Traefik takes the head
decision at the edge and the services follow it; a service sampling independently would drop spans
out of the middle of a trace it did not start. `BakedSentryTracesSampleRate` is gone, along with the
build argument that fed it in the five Go service Dockerfiles and their bake targets.

Nothing traces until the rate is raised: it defaults to 0, which exports no spans.

`docker-stack.yml` passes the key to the Go services through the shared `x-otel-env` anchor as well
as to Traefik. Both halves are needed and the failure of the service half is partly hidden: with
`ParentBased`, a request arriving through Traefik carries a sampled parent and its spans export
correctly, so edge traces look healthy while every span a service starts for itself — cron jobs,
NATS consumers, anything without an inbound parent — falls to the ratio sampler at zero and is never
exported.

**Tempo stores them.** `otelcol.exporter.debug "discard_traces"` is gone; the trace pipeline ends at
`otelcol.exporter.otlp "tempo"` against `tempo:4317`. Traefik's edge spans arrive on that same
pipeline, which is what puts an edge span and the service spans it precedes on one trace. Grafana
queries it as the `tempo` datasource, with `tracesToLogsV2` mapping a span's `service.name` onto the
`compose_service` label Loki indexes, so a span links to what that service logged while the trace
was open.

**Every limit Tempo runs under is set, not defaulted.** Its defaults are cluster-sized and this host
has two cores and eight gigabytes with the rest of the stack already on it.
`kit/obs/tempo/config.yaml` caps ingest against a default of 30 MB/s, the block builder at
256 MB against 5 GB, live traces against a default of ten thousand, and retention at 48 hours.

The ingestion limits are sized against measured use rather than scaled down from the defaults.
This stack idles at about **1.3 KB/s across 16 traces in flight**, so 512 KB/s and 400 traces leave
roughly twenty-five times that headroom while cutting the worst case the live store can reach.
`max_traces_per_user` is the number that bounds live-store memory, which is what makes it the one
worth sizing on a host this small. Tightening does not prevent shedding under a flood — it makes
shedding start sooner, in exchange for a lower ceiling.

Compaction is configured **twice** — the scheduler decides what to compact and the worker does it —
and each carries its own hundred-gigabyte block size and fortnight of retention that the per-tenant
overrides do not govern. Both are capped. So are the query concurrencies, which default to a
thousand jobs per search, and the metrics generator's sixteen ingest workers: it runs whether or not
a processor is configured for it, and sixteen exceeds this host's core count.

The way to find these is to read them back rather than trust the file: `GET /status/config` on a
running Tempo prints the merged configuration, and anything still oversized there is a default that
was never overridden. Reading it back also catches the trap that the kit is
embedded in the Deployment Tool binary: editing `kit/obs/tempo/config.yaml` and running `eip dev`
against a tool built before the edit deploys the **old** config and reports success, leaving the
Swarm config object and the container untouched. Rebuild the tool first, then verify against
`/status/config` rather than against the deploy's exit code.

Measured before adopting, on the pinned image with that config: **28 MB and 0.3% CPU idle**, flat
across five minutes. The store this project rejected idled at 1.2 GB, so the concern that prompted
the measurement does not repeat here.

### Under load, the cost is span shape rather than request volume

Measured at `TRACES_SAMPLE_RATE=0.1` against 538,000 edge requests over three minutes (~3,000 rps).
Tempo took 218,000 spans across 39,000 traces and never refused one: `tempo_receiver_refused_spans`
stayed at zero and the ingest limits were never the binding constraint.

The cost came from a few traces, not from the many. Average depth was under six spans, but a handful
reached **twenty thousand spans and more**, exceeding `max_bytes_per_trace`. Repeatedly assembling
and failing to compact those is what costs: Tempo held **a full core for about six minutes** and
grew to **2.5 GB**, and both continued well after the last request. 121,000 spans were dropped as
`live_traces_exceeded` and 94,000 as `trace_too_large_to_compact`.

Those spans were metric collection, not work. Observable gauge callbacks run on every metric export,
and the ESI bucket gauge called a Redis `SCAN` cursor loop plus one `HGetAll` and one `ZRangeByScore`
per bucket. `redisotel.InstrumentTracing` turns each of those commands into a span, so a gauge that
exists to report bucket state was emitting hundreds of spans every fifteen seconds, for as long as
the process ran. The traces grew huge because those spans attached to whatever trace was open when
the reader fired.

So the request rate misleads twice over: the load barely mattered, and what filled the store was a
timer. Re-measured after the fix, over half an hour idle and then under load: the idle
span rate is **2.5/s at about one span per trace**, against roughly thirty a second and traces of
twenty thousand before. Idle CPU stays under 1% and the two discard counters do not move at all.
Under 909,000 requests at ~3,800/s, CPU peaks at **36%** rather than holding a core, memory stays
between 0.6 and 1.0 GB, and **no trace is too large to compact** — the defect does not reappear
under the load that first exposed it. Disk shrinks as compaction reclaims rather than growing.

What load does reach is `max_traces_per_user`, and it is worth knowing what that limit governs
because the name reads like a volume cap and is not one. Tempo holds each incomplete trace in memory
while its spans arrive and releases it once the trace is cut to a block, so the limit is on traces
**in flight at once**, not traces stored or traces per second. It binds only when traces arrive
faster than they complete. A synthetic hammer is the worst case for it: nearly every request was
refused at the edge, so the load was hundreds of thousands of shallow near-empty traces, the
in-memory set pinned at 2,000 within thirty-five seconds, and spans belonging to traces that could
not be admitted were discarded.

That shedding is the limit working — it is why CPU stayed at 36% instead of pegging a core — and
recovery is immediate: the in-memory set falls from 2,000 to about 20 within thirty seconds of the
load stopping, and the discard counter never moves again. But a discarded span is not a sampled-out
trace; it is half a trace, which is worse than none. Whether 2,000 suits real traffic is not
something a synthetic firehose can answer, since real requests make fewer and deeper traces. Leave
it, and revisit if `tempo_discarded_spans_total{reason="live_traces_exceeded"}` moves under ordinary
use.

Two things are worth knowing before anyone reaches for back-pressure here.

**Tempo does not push back when it sheds.** `tempo_receiver_refused_spans` stayed at zero through the
whole load: every span was accepted at the gRPC receiver, decoded and passed through the distributor,
and only then dropped at the live store. The collector is never told to slow down, so it keeps
forwarding work the store has already decided to bin. `ingestion.rate_limit_bytes` is the limit that
*does* refuse at the receiver, but it never fired — 909,000 shallow traces came to 277 MB over four
minutes, about 1.1 MB/s against a 2 MB/s cap. The load was high in trace count and low in bytes, so
the byte limit is the wrong dimension for this failure.

**A memory limiter is not available to the trace path.** `otelcol.processor.memory_limiter` works by
refusing at the receiver, and `otelcol.receiver.otlp "apps"` is shared: it fans out to metrics, logs
and traces alike. A trace flood tripping the limiter would return `RESOURCE_EXHAUSTED` for metrics
and logs too, losing the dashboards and the logs at exactly the moment a spike makes them worth
having. Anything trace-only has to sit after the fan-out — a bounded `sending_queue` on the Tempo
exporter, or tail sampling — and neither is worth adding for a limit only a synthetic firehose has
reached. The rule this establishes is that **collection must not be traced**. A gauge callback runs
forever on a fixed interval, so any client call it makes is unbounded span volume that describes no
request. `telemetry.WithoutTracing` puts a valid but non-sampled span context on the callback's
context; `ParentBased` honours that decision, whereas leaving the context bare lets the sampler
start a fresh trace. The callbacks that touch Redis or Mongo use it.

The N+1 was worth removing on its own account: `Store.States` reads every bucket in one pipeline
rather than two commands each, so a reporting caller's cost stays flat as buckets are added.

Measured with tracing on and no request traffic at all, the idle span rate fell from roughly thirty
a second to **about two**, which is the background work that genuinely runs. Read the rate from
`tempo_distributor_spans_received_total` across a couple of minutes rather than from the span search:
a service that has just been replaced is still flushing the old container's spans, and their
timestamps predate the container that appears to be emitting them.

#### What guards this

Both defects were cost defects, which the suite was structurally blind to: the existing tests assert
what a function returns, never what it spends getting there. A gauge that produced correct numbers
through five hundred Redis calls passed everything.

- `core/metrics/esi` and `shared/telemetry/apimetrics` register their gauges against a real span
  recorder and a manual metric reader, force one collection, and assert it produced **no spans**.
  The Redis fake is instrumented with `redisotel` first, because that is what turns a command into
  a span — without it the test passes whether or not the suppression is there, which is the trap
  this test fell into while being written. Setup is seeded before recording starts, and the
  connection is dialled before the count is taken, so what is measured is the callback alone.
- `deployment-tool/internal/stack` reads the repository's own `docker-stack.yml` and asserts every
  Go service receives the runtime keys `shared/telemetry` reads. A second test derives that key list
  from `config.go` rather than trusting the literal, so a key added to the code but not to the stack
  fails rather than silently resolving empty.
- `shared/esiclient` asserts `States` costs the same number of round trips for forty buckets as for
  two, which is the property that decays quietly.

Both suppression tests were confirmed to fail with the fix reverted, naming the exact spans that
filled the store. A test for a cost defect that has never been seen failing is not evidence.

Tracing is guarded on three further properties, chosen because each fails silently rather than
loudly:

- **A trace survives every hop.** `shared/telemetry/natsprop` asserts that a publisher's trace and
  span id reach the consumer across NATS, that they survive being copied into Asynq's flat string
  headers, and that a task published from inside a handler stays on the trace it arrived on. A break
  here does not error: the consumer simply starts a new root, and the request appears as two
  unrelated traces.
- **The sampler follows the edge and governs what the edge cannot.** A sampled parent exports even
  at rate 0, an unsampled parent is not resampled at rate 1, and a span with no parent is governed
  by the local rate alone. That last case is the one the missing environment key exposed, so it is
  pinned rather than left implied.
- **Propagation degrades quietly on purpose.** Every function in `natsprop` no-ops on empty input,
  which means a missing propagator looks exactly like a working one. The boundary is asserted so
  that stays a decision rather than an accident.

`sampler` in `shared/telemetry` is a named function rather than an argument built inside `Init`,
because the sampling rule is the part worth stating and testing on its own.

Not covered: the `otelhttp` filter that keeps `/health`, `/healthy` and `/ready` off traces. Probes
hit those on a timer forever, so it is the same unbounded shape as the gauge callbacks, but the
filter is a closure inside `StartAPIServer` and reaching it would mean restructuring the server for
the test.

### What a task span says

A task's execution span is a **consumer**, not an internal call, and carries the attempt: task id,
queue, retries used, retries allowed, and whether this is the final attempt. That last group is the
question a trace is best placed to answer and was previously only ever on a log line.

The execution span is a **child of the bridge span that queued it**, not a sibling. `Enqueue` injects
the trace context from its own span rather than copying the inbound NATS headers, so the wait in
Redis is the gap between parent and child rather than a gap between siblings that no span accounts
for. `natsprop.AsynqHeadersForBridge` is where that happens: the trace context comes from the
bridge, and everything else the message arrived carrying is forwarded untouched. A bridge running
without a span of its own still forwards what it was given, so the trace continues through the queue
rather than stopping at it.

Span names follow `{operation} {destination}` — `send task.scheduled.…`, `process task`,
`process <task type>` — because that is what makes a span render in a backend's messaging views
rather than as a bespoke name nothing has a view for. The same reason applies to the span kinds:
producer at the publish, consumer at both the bridge and the execution.

Read back from a live trace, which is the only thing that proves the shape rather than the headers:

```
process task                 ROOT           kind=CONSUMER
└─ process checkSDEUpdates   parent=bridge  kind=CONSUMER
```

with the execution span carrying `messaging.message.id`, `messaging.destination.subscription.name`
(the queue), `asynq.task.retried`, `asynq.task.max_retries` and `asynq.task.final_attempt`.

Verifying this needs the sample rate at 1.0 for the moment it takes to trigger one task. At 0.1 a
task is a self-started trace with no parent to inherit a decision from, so a dozen triggers can all
go unsampled and the absence looks like a fault rather than the sampler working.

Tempo v3.0.0 renamed the sections these limits live in — `ingester` became `live_store` and
`compactor` split into `block_builder` and `backend_scheduler` — so a config written against older
documentation fails to parse rather than silently ignoring the caps.

### The OTel modules

The stack runs current stable: core, SDK and the OTLP exporters on v1.46.0, the log modules on
v0.22.0, and the zap bridge on v0.20.1. The core modules had been on pseudo-versions pinned to
unreleased commits after v1.44.0, which is what a `go get` against the default branch leaves behind;
they are on releases now.

Two things moved with the upgrade. `trace.NewNoopTracerProvider` is deprecated in favour of the
`trace/noop` package, and the log record's attribute `Key` became a distinct type rather than an
alias for `string`.

`otelhttp` is on v0.71.0 with the rest.

A test in `shared/httpclient` looked like it made v0.71.0 unusable, and did not.
`TestOnCompleteSeesEveryAttempt` asserts a retried request reports a positive duration for its final
attempt, and it fails most runs on **either** version: the monotonic clock on some hosts ticks
coarser than a loopback round trip takes, so `time.Since` legitimately returns zero. The test also
supplies its own transport, so `otelhttp` was never in that code path. Its handler now sleeps past a
tick, which tests the timing wiring rather than the clock's resolution.

## Dashboards

**`core-esi-limits.json`** reads the five bucket gauges `services/core/metrics/esi` registers:
`core_esi_bucket_token_limit`, `.token_used`, `.token_remaining`, `.fill` and
`.seconds_until_open`. It previously selected a `core_esi_group_*` spelling that nothing has
written since the limiter was renamed, so every panel was empty.

The layout leads with three radial gauges — allowance still available, tokens remaining, and seconds
until a refusing bucket admits again — over a time series of tokens remaining and the two snapshot
tables. Current state is what the limiter is usually consulted for; the trend underneath keeps the
history a gauge alone would lose. The allowance gauge runs 0–1 with thresholds that redden as it
drains, and the wait gauge treats any non-zero value as the interesting case.

Two panels changed subject rather than name, because the metric they described no longer exists:
`seconds_into_window` and `seconds_until_reset` were replaced by `fill` (share of the allowance
still available, `percentunit`) and `seconds_until_open` (seconds until a refusing bucket admits
again).

**The dashboard files are the source of truth, and Grafana now honours that.** The provisioning
provider ran with `allowUiUpdates: true`, which lets Grafana keep its own database copy of a
dashboard: the file seeds it once, and a later edit to that file no longer reaches the dashboard.
Every one of the twenty reported `provisioned: false` as a result, so a shipped change could land in
the container and still not be what Grafana served.

**Grafana runs 13.2.1.** The pin had sat at 13.0.1 while the line had moved on by eight patch
releases, and the browse page was failing in a way that looked version-related at the time. It was
not — that fault turned out to be client-side, and is recorded under § The Grafana dashboards browse page — but
the upgrade is worth keeping on its own terms and every dashboard came through it unchanged.

It now runs `allowUiUpdates: false` with `editable: false`. Measured against `grafana/grafana:13.0.1`
before the change: with the flag off a dashboard reports `provisioned: true`, keeps the `refresh`
value its file sets, and picks up a file edit automatically within `updateIntervalSeconds` — no
restart and no `eip sync`. The comment that justified the flag warned that provisioned auto-refresh
would be ignored; that does not happen on this version.

**`api-otel-metrics.json`** was reorganised rather than repaired. Its queries were sound, but two
panels carried sixteen series each — auth flows, static file serving and CRUD endpoints sharing one
axis despite differing by orders of magnitude in both rate and latency. It now opens with four stat
tiles (requests, errors, slowest endpoint, market data gaps), then a `topk(5)` pair naming the
busiest and slowest endpoints, then a row per concern: auth and SSO, content endpoints, lookup and
static data, and errors. Each row's panels carry three to nine related series.

The `topk` panels label their series with `label_replace`, because the underlying instruments are
separate metric names rather than one metric with an `endpoint` label. Their legends are tables on
the right: the per-series `mean` and `max` columns push the endpoint name out of a legend placed
underneath.

**A per-container row breaks the same figures down by replica.** The capacity controller runs one to
five API replicas, and `resource_to_telemetry_conversion` puts `service_instance_id` on every series,
so request rate, error rate and p96 latency each group by it. An uneven spread means traffic is not
landing evenly; one replica erroring alone points at that container rather than at the endpoint.

Those three panels join their metrics with `or`, not `+`. Addition requires the instance label to be
present on both sides, so a single endpoint with no traffic empties the whole panel; `or` unions the
series instead. A replica that has stopped reporting leaves NaN buckets behind, which is why the
latency panel can show a dead container until its samples age out.

**Static-data endpoints stay folded into the main panels.** They are registered and correct; they
simply see no traffic on a stack with no users, which is why they read empty.

**`websocket-otel-metrics.json`** now covers the router as well as the backends, and is titled
"WebSocket · delivery and placement" for it. The five `wsrouter_*` instruments Stage C added were
being collected and shown nowhere, as were the three `ws_placement_*` gauges — between them the
placement decision that puts a tenant on a backend, and the capacity ladder that decides when a
backend stops accepting new ones.

Six rows: what is connected now; the router's placement decisions, home skips and proxy errors;
connected clients plotted against the soft and full thresholds they are measured by, with the flags
each backend is publishing; the upgrade handshake; connection churn and fanout; and the per-backend
and per-account breakdowns.

**Who is connected is reported per owner, not per kind.** The websocket server already kept
`userConnections`, `corpRefToClients` and `allianceRefToClients` to route document updates by scope,
but nothing observed them, so there was no way to see which groups were connected or where the
router had put them. `services/websocket/server/metrics.go` now registers
`ws.owner_connected_clients`, labelled `owner_kind` and `owner_id`, with `ws.connected_owners` as
the total.

One instrument rather than one per kind, because `models.OwnerKind` is the thing that decides what
an owner can be, and it already carries four values — a planner is an owner too, and a metric named
for corporations and alliances would have missed it. A kind added there is picked up by extending
the callback, and the dashboards split on the label rather than on a metric name.

The maps are read under the existing `corpRefIndexMu` / `allianceRefIndexMu` locks, in the order
`types.go` sets out. Cardinality is bounded by owners with someone connected, which is at most the
account cardinality `ws.account_connected_clients` already carries plus the groups those accounts
belong to.

Two of those panels break each owner down by `service_instance_id`. That is the question a large
group raises: not how many clients it has, but whether they all landed on one backend. An owner
concentrated on a single backend is what drives that backend to soft and then full while its peers
sit idle.

The placement panels stack their series, because the question there is the mix — a rising share of
`reassigned` or `sticky_fallback` against `hit` means tenants are being moved rather than staying
put. What each result means, and the soft/full/cutoff ladder, is
[backend/ws-router/ws-router.md](../../backend/ws-router/ws-router.md) § Placement.

**SeaweedFS has a dashboard for the first time.** Stage B started collecting it — under `mini` one
port serves master, filer, filer store, volume server and admin metrics together — but nothing read
the 86 series that arrived. It opens on what is stored and how much room is left, because storage
fills before it fails: stored bytes, object count, volume slots used against the server's ceiling,
space held by deleted objects awaiting vacuum, and whether the master holds the cluster lock.

Then capacity by bucket and collection, S3 traffic with request duration and time to first byte,
and a health row covering read and write failures, under-replicated volumes, in-flight work and
vacuum activity.

**Volume and disk metrics are published twice** — once bare as the server total and once per
collection — so the panels that want a total filter on `collection=""`. Summing across both counts
the same bytes in each.

**`redis`, `traefik`, `host` and `frontend-events-otel-metrics` are grouped into rows.** Each was a
single column of ten or more panels, so reading one meant scrolling past everything it was not
about. Their queries were sound and are unchanged; what moved is the arrangement — a "Now" band of
current-state tiles where the dashboard has them, then a row per subject.

Two things were replaced rather than moved. `host` measured its rates over a hardcoded one-minute
window, which under-samples as soon as the dashboard is zoomed out past that; it uses
`$__rate_interval` now, which follows the panel's own resolution. And the frontend panels carried
their instrument name in the title, several of them truncated mid-word by the width available — the
name belongs in the panel description, which is where it now is.

**The worker's queues and its task execution are one dashboard.** They were two — `asynq-queues`
for backlog and throughput, `worker-tasks` for run times and outcomes — describing the same
pipeline from either end, with the same Loki failures panel copied into both. `worker-tasks.json`
is gone and its panels live under "Worker · queues and tasks" alongside the queue ones.

Four rows: what the queues hold now; backlog by queue and state; execution by task type; and
failures. The state panel aggregates with `sum by (state)` rather than drawing the raw series —
nine queues across six states is fifty-four lines on one chart, and the question it answers is how
much work sits in each state, not which queue holds it.

Backlog comes from the asynq exporter and execution from the worker's own instruments, so a task
that fails and retries counts once per attempt on the queue counters and once per run on the worker
ones. The failure-rate tile is calculated from the queue side for that reason.

**`app-activity.json`** was nineteen tiles in an undifferentiated grid with no rows at all. It now
reads in three bands — usage and growth, usage shape, and build and configuration — across twelve
tiles.

**A metric measured over several windows is one panel, not one panel per window.** Distinct
characters, distinct logged-in accounts, new users and jobs archived each collapsed from separate
24h/7d/30d tiles into a single panel carrying the windows as series. That removed seven tiles and
let the remaining bands divide the grid evenly, where the per-window tiles had left panels stretched
across whatever width was left over.

Who is using the app and how that is growing now read together in one band, with the new-users trend
chart beside the tile it explains rather than orphaned at the foot of the dashboard.

Elsewhere the stat panels rendered `value_and_name`, which reprinted the series name inside the box
directly beneath the panel title that already said it; those show the value alone, and the legend
strings that fed them are gone. The consolidated panels keep `value_and_name`, because there the
name is the window label and it is the only thing distinguishing the figures.

Two panels were saying less than they appeared to. **Registered accounts** — formerly "Total users ·
Mongo" — counts documents in the users collection, meaning every account ever registered rather than
anything live. **SDE build** reports 0 with version `unknown` until an import calls
`SetCurrentVersion`, so a value of 0 now renders as "not imported" rather than as a bare zero that
reads like a fault.

**`mongodb.json`** was also the last dashboard built on the retired renderers: thirteen `graph` and
three `singlestat` panels on schema version 27, both deprecated in Grafana 13. They are now
`timeseries` and `stat` on schema 39, each carrying forward the unit its old y-axis declared.
Titles, positions, queries and legend formats are unchanged — only the rendering moved.

**`mongodb.json`** reads oplog size from `mongodb_oplog_stats_storageStats_size`. It previously
selected `mongodb_oplog_stats_size`, which the exporter has never emitted. Every one of the eleven
metrics this dashboard queries now resolves against the store.

**Every panel of `core-esi-limits.json` aggregates with `max by (group, scope)`.** Bucket state belongs to the fleet and is
reported once by core — [backend/shared/esi.md](../../backend/shared/esi.md) § What it reports — but
`resource_to_telemetry_conversion` promotes `service_instance_id` onto each series, so a restarted
container leaves its own copy behind until it goes stale. Selecting the raw series draws one line
per container id that has ever reported. `max` collapses them without summing, which would double
a fleet-wide figure.

## Operating the observability stack

### How a change actually reaches the stack

The observability configuration is **embedded in the `eip` binary** (`//go:embed obs/**` in
`kit/obs.go`), materialised to disk and shipped as a Swarm config object. Stack fragments are read
from disk. The two halves therefore land at different times:

```
edit kit/obs/**            → rebuild the binary, then deploy
edit docker-stack*.yml     → deploy
```

Deploying a kit change without rebuilding the binary applies the stack half only. During Stage B
that removed an exporter container while leaving its replacement absent — Redis had no collector at
all until the next build. Check before deploying:

```bash
grep -a -c 'prometheus.exporter.redis' eip.exe   # 0 means the binary predates the kit edit
```

A **dashboard-only** change does not need `eip dev`: rebuild the binary so the embedded kit carries
the edit, then `eip sync`, which is a targeted config update rather than a bake of seven application
images. Grafana then re-reads its provisioned files on a fifteen-second cycle — the config object is
replaced immediately, but the API serves the previous dashboard until that cycle runs, so wait for
the panel count to change rather than concluding the deploy failed.

### Verification commands

Run from the repo root; `eip-obs` is the observability overlay.

```bash
# every collection job, with real sample ages
docker run --rm --network eip-obs curlimages/curl:8.11.1 -s --data-urlencode \
  'query=timestamp({__name__=~"redis_up|node_load1|mongodb_up|asynq_queue_size"})' \
  'http://prometheus:9090/api/v1/query'

# which containers Alloy is tailing (should exclude the six Go services and four proxies)
cid=$(docker ps --format '{{.ID}} {{.Names}}' | grep 'eip_alloy\.1' | awk '{print $1}')
docker run --rm --network container:$cid curlimages/curl:8.11.1 -s \
  'http://localhost:12345/api/v0/web/components/loki.source.docker.docker'

# what a metric's labels actually are, including per-container identity
docker run --rm --network eip-obs curlimages/curl:8.11.1 -s \
  'http://prometheus:9090/api/v1/query?query=ws_connected_clients'

# which services reach Loki
docker run --rm --network eip-obs curlimages/curl:8.11.1 -s \
  'http://loki:3100/loki/api/v1/label/compose_service/values'

# Alloy's own view (component health, and its error log)
docker run --rm --network container:$cid curlimages/curl:8.11.1 -s \
  'http://localhost:12345/api/v0/web/components'
```

### Traps this stack has already cost time on

**`alloy validate` needs the stack's stability level.** Without `--stability.level=experimental` it
rejects `otelcol.exporter.debug`, which the config uses. Validate against the pinned image:

```bash
docker run --rm -v "$PWD/deployment-tool/internal/kit/obs/alloy/config.alloy":/c.alloy:ro \
  grafana/alloy:v1.19.2 validate --stability.level=experimental /c.alloy
```

**Docker refuses bind mounts from some host paths.** Mounting a probe file from a scratch directory
fails with "mounts denied", and a check that greps the output for a validation error reads that
failure as a pass. Write probe configs inside the container or mount from under the repo, and assert
on exit codes.

**Prometheus instant queries stamp the evaluation time, not the sample time.** Two series both
looked 0.3s old when one had been stale for five minutes. Use `timestamp(<metric>)` when the question
is whether something is still being written — but note `timestamp(<metric>) < N` can return empty
even while data arrives, so confirm with `count({__name__=~".+"})` or a known series before
concluding a store is not receiving.

**Alloy's component health is not a failure signal.** During the `discovery.docker` outage every
component reported healthy while the Docker log scrape collected nothing. Trust the error log and the
data in the store. Its reload burst misleads too: after a config change Alloy logs a few hundred
"node exited without error" lines, which arrive unlabelled and read as a broken drop rule.

**Loki indexes OTLP resource attributes as structured metadata, not stream labels.** A log arriving
by the OTLP path carries `compose_service` in `loki_attribute_labels`, and `{compose_service="x"}`
matches nothing. Check a label is queryable against
`/loki/api/v1/label/compose_service/values` before assuming a log path works.

**`strings` is not installed in this environment.** A staleness probe using it returns 0 with an
error on stderr whether or not the binary is current. Use `grep -a -c '<marker>' eip.exe`.

**`build-host.sh` fails on Windows/Git Bash.** It assigns `mktemp`'s output to `TMP`, already the
Windows temp-directory variable Go reads for its build work dir, so `go build` tries to `mkdir`
inside a file. Invoke `go build` directly with the script's ldflags and `-trimpath`, then copy the
result over `eip.exe`.

### The Grafana dashboards browse page

The dashboards **list** page can fail in a normal browser with
`TypeError: Cannot use 'in' operator to search for 'parentUID' in <!DOCTYPE html>`, while every
individual dashboard opens fine and the same page works in a private window. It is client-side
state, not the stack: a request loses the `/grafana` prefix, lands on the SPA's catch-all at the
document root, and Grafana parses the HTML it gets back as JSON.

Ruled out by measurement, so do not spend time on them again: the dashboard definitions (a blank
Grafana with a fresh database fails identically), the provisioning settings, `base_url`, and the
Grafana version. The likeliest remaining cause is a service worker registered by an older frontend
build — `5f0021418` removed the PWA artifacts, and a browser that visited before that still has one
installed. Unregistering it under devtools → Application → Service Workers is the thing to try.

## Missing live SoT to draft here

The observability stack has no live topic of its own today: what exists is spread between
[`stack/stack.md`](../../stack/stack.md) for fragment membership and the Deployment Tool's embedded
kit for the configuration itself. On promote this project needs a topic that says what collects
what, where it lands, and how an operator reaches it — drafted in this section first rather than
written straight into the live tree.

Stage J moves three things. The topic doc below becomes `stack/observability.md`; two rows join
`stack/contents.md`; and the sample-rate row joins `stack/config.md`. Nothing else in the live tree
changes, because fragment membership and the Grafana knobs already say what they need to.

### Draft — `stack/observability.md`

> # Observability — collector and stores
>
> Live SoT for the optional observability addon (fragment
> [`docker-stack.obs.yml`](../../docker-stack.obs.yml)): image pins, what Alloy collects, where each
> signal lands, and the retention each store keeps. Merged only when `addons.observability.enabled`.
>
> Grafana Access / Base URL / Path → [config.md](./config.md). Overlay membership →
> [network.md](./network.md). Fragment membership → [stack.md](./stack.md).
>
> ## Image & defaults
>
> | Piece | Default | Change |
> |-------|---------|--------|
> | Alloy image | `grafana/alloy:v1.19.2` | [`docker-stack.obs.yml`](../../docker-stack.obs.yml) `services.alloy.image` |
> | Prometheus image | `prom/prometheus:v3.2.1` | same file, `services.prometheus.image` |
> | Loki image | `grafana/loki:3.7.2` | same file, `services.loki.image` |
> | Tempo image | `grafana/tempo:3.0.0` | same file, `services.tempo.image` |
> | Grafana image | `grafana/grafana:13.2.1` | same file, `services.grafana.image` |
> | Docker socket proxy image | `tecnativa/docker-socket-proxy:v0.4.2` | same file, `services.alloy-docker-proxy.image` |
> | Metric retention | 15 days (Prometheus default) | [`docker-stack.obs.yml`](../../docker-stack.obs.yml) `services.prometheus.command` |
> | Log retention | `168h` | [`kit/obs/loki/config.yaml`](../../deployment-tool/internal/kit/obs/loki/config.yaml) `limits_config.retention_period` |
> | Trace retention | `48h` | [`kit/obs/tempo/config.yaml`](../../deployment-tool/internal/kit/obs/tempo/config.yaml) `overrides.defaults.compaction.block_retention` |
> | Trace sample rate | `0` (nothing traces) | `.env` `TRACES_SAMPLE_RATE` — see [config.md](./config.md) |
>
> Each store's own limits live in its kit config file, which is embedded in the Deployment Tool
> binary and materialised as a Swarm config object.
>
> ## What collects what
>
> Alloy is the only collector. Nothing else scrapes, and no service writes to a store directly.
>
> ```text
> Producers                          Alloy                        Stores
>
> Go services ──OTLP :4317──┐
> Traefik (edge spans) ─────┤
>                           ├──► otelcol.receiver.otlp ──┬── metrics ──► prometheus:9090
>                           │                            ├── logs ─────► loki:3100
>                           │                            └── traces ───► tempo:4317
> container stdout ─────────┴──► loki.source.docker ─────── logs ──────► loki:3100
>
> redis · host · mongodb ───────► prometheus.exporter.* ──┐
> nats-exporter:7777 ───────────► prometheus.scrape ──────┼── metrics ──► prometheus:9090
> asynqmon:8080 ────────────────► prometheus.scrape ──────┤   (remote write)
> seaweedfs:9327 ───────────────► prometheus.scrape ──────┘
>
> Docker API (container discovery, log targets)
>   alloy ──► alloy-docker-proxy:2375   (CONTAINERS · NETWORKS · EVENTS, POST=0)
> ```
>
> Redis, host and MongoDB metrics come from exporters Alloy embeds; NATS, asynqmon and SeaweedFS are
> scraped as separate targets because Alloy has no component for them. All of it reaches Prometheus
> by remote write rather than by Prometheus scraping anything itself.
>
> ## Trace sampling
>
> Sampling is head-based and decided once at the edge: Traefik takes the decision, and the services
> follow it. One key governs both — `TRACES_SAMPLE_RATE`, which
> [`docker-stack.yml`](../../docker-stack.yml) passes to Traefik and to the Go services through the
> shared `x-otel-env` anchor. Both halves are required: a service that does not receive it still
> exports spans under a sampled request, because the parent decided, but exports nothing for the work
> it starts itself.
>
> ## Docker socket proxy allowlist
>
> `eip_alloy-docker-proxy` mounts the host sock; Alloy does not. Allowlist: `CONTAINERS` +
> `NETWORKS` + `EVENTS`, `POST=0`. `NETWORKS` is required — `discovery.docker` computes network
> labels, and without it the Docker log scrape stops refreshing while Alloy still reports healthy.

### Draft — rows for `stack/contents.md`

Task map:

> | Observability addon (collector, stores, retention) | [observability.md](./observability.md) |
> | Trace sampling / what reaches Tempo | [observability.md](./observability.md) § Trace sampling |

### Draft — row for `stack/config.md`

The `.env` table gains the key the services and the edge share:

> | `TRACES_SAMPLE_RATE` | `0` | Head sampling rate for the whole request path. Empty or unparseable → 0, which exports no spans. |

### What does not move

The measurement narrative in this overlay — what Tempo cost before and after, why the gauge callbacks
were the fault, what a memory limiter would have done to metrics and logs — is migration writing and
stays here. Live docs get the settled behaviour, not how it was arrived at.

The testing coverage map at [`testing/services/core.md`](../../testing/services/core.md) says metrics
are largely untested, which this project has made stale: the ESI bucket gauge is now covered for what
it emits as well as what it returns. That correction belongs to Stage J as well.
