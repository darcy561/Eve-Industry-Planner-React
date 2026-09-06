

# Observability — collector and stores

Live SoT for the optional observability addon (fragment
[`docker-stack.obs.yml`](../../docker-stack.obs.yml)): image pins, what Alloy collects, where each
signal lands, and the retention each store keeps. Merged only when `addons.observability.enabled`.

Grafana Access / Base URL / Path → [config.md](./config.md). Overlay membership →
[network.md](./network.md). Fragment membership → [stack.md](./stack.md).

## Image & defaults

| Piece | Default | Change |
|-------|---------|--------|
| Alloy image | `grafana/alloy:v1.19.2` | [`docker-stack.obs.yml`](../../docker-stack.obs.yml) `services.alloy.image` |
| Prometheus image | `prom/prometheus:v3.2.1` | same file, `services.prometheus.image` |
| Loki image | `grafana/loki:3.7.2` | same file, `services.loki.image` |
| Tempo image | `grafana/tempo:3.0.0` | same file, `services.tempo.image` |
| Grafana image | `grafana/grafana:13.2.1` | same file, `services.grafana.image` |
| Docker socket proxy image | `tecnativa/docker-socket-proxy:v0.4.2` | same file, `services.alloy-docker-proxy.image` |
| Metric retention | 15 days (Prometheus default) | [`docker-stack.obs.yml`](../../docker-stack.obs.yml) `services.prometheus.command` |
| Log retention | `168h` | [`kit/obs/loki/config.yaml`](../../deployment-tool/internal/kit/obs/loki/config.yaml) `limits_config.retention_period` |
| Trace retention | `48h` | [`kit/obs/tempo/config.yaml`](../../deployment-tool/internal/kit/obs/tempo/config.yaml) `overrides.defaults.compaction.block_retention` |
| Trace sample rate | `0` (nothing traces) | `.env` `TRACES_SAMPLE_RATE` — see [config.md](./config.md) |

Each store's own limits live in its kit config file, which is embedded in the Deployment Tool
binary and materialised as a Swarm config object.

## What collects what

Alloy is the only collector. Nothing else scrapes, and no service writes to a store directly.

```text
Producers                          Alloy                        Stores

Go services ──OTLP :4317──┐
Traefik (edge spans) ─────┤
                          ├──► otelcol.receiver.otlp ──┬── metrics ──► prometheus:9090
                          │                            ├── logs ─────► loki:3100
                          │                            └── traces ───► tempo:4317
container stdout ─────────┴──► loki.source.docker ─────── logs ──────► loki:3100

redis · host · mongodb ───────► prometheus.exporter.* ──┐
nats-exporter:7777 ───────────► prometheus.scrape ──────┼── metrics ──► prometheus:9090
asynqmon:8080 ────────────────► prometheus.scrape ──────┤   (remote write)
seaweedfs:9327 ───────────────► prometheus.scrape ──────┘

Docker API (container discovery, log targets)
  alloy ──► alloy-docker-proxy:2375   (CONTAINERS · NETWORKS · EVENTS, POST=0)
```

Redis, host and MongoDB metrics come from exporters Alloy embeds; NATS, asynqmon and SeaweedFS are
scraped as separate targets because Alloy has no component for them. All of it reaches Prometheus
by remote write rather than by Prometheus scraping anything itself.

## Trace sampling

Sampling is head-based and decided once at the edge: Traefik takes the decision, and the services
follow it. One key governs both — `TRACES_SAMPLE_RATE`, which
[`docker-stack.yml`](../../docker-stack.yml) passes to Traefik and to the Go services through the
shared `x-otel-env` anchor. Both halves are required: a service that does not receive it still
exports spans under a sampled request, because the parent decided, but exports nothing for the work
it starts itself.

## Docker socket proxy allowlist

`eip_alloy-docker-proxy` mounts the host sock; Alloy does not. Allowlist: `CONTAINERS` +
`NETWORKS` + `EVENTS`, `POST=0`. `NETWORKS` is required — `discovery.docker` computes network
labels, and without it the Docker log scrape stops refreshing while Alloy still reports healthy.


## Getting a change into the stack

The kit configs are **embedded in the `eip` binary** (`//go:embed obs/**` in
[`kit/obs.go`](../../deployment-tool/internal/kit/obs.go)), materialised and shipped as Swarm config
objects. Stack fragments are read from disk. The two halves land at different times:

```text
edit kit/obs/**            → rebuild the binary, then deploy
edit docker-stack.obs.yml  → deploy
```

Deploying a kit edit without rebuilding applies the stack half only, and reports success while the
old config keeps running. Check the binary carries the edit before concluding a change did not work:

```bash
grep -a -c '<a string from the edit>' eip.exe    # 0 means the binary predates it
```

A dashboard-only change needs a rebuild and **`eip sync`** rather than `eip dev` — a targeted config
update instead of a bake. Grafana re-reads provisioned files on a fifteen-second cycle, so the config
object is replaced at once but the API serves the previous dashboard until that cycle runs.

Verbs → [verbs.md](../deployment/deployment-tool/cli/verbs.md).

## Reading a store back

A store's own limits are merged from its config plus its defaults, and the defaults are cluster-sized.
Read the merged result rather than the file when a limit matters:

```bash
# from a container on eip-obs
GET tempo:3200/status/config      # merged Tempo configuration
GET tempo:3200/metrics            # ingest, discards, live traces
```

Two traps are worth knowing. **Alloy's component health is not a failure signal** — during a
`discovery.docker` outage every component reported healthy while the Docker log scrape collected
nothing, so trust the error log and the data in the store. And **Loki indexes OTLP resource
attributes as structured metadata, not stream labels**: a log arriving by the OTLP path carries
`compose_service` in `loki_attribute_labels`, so `{compose_service="x"}` matches nothing. Confirm a
label is queryable against `/loki/api/v1/label/compose_service/values` before assuming a log path
works.

Validating the collector config needs the stability level the config uses:

```bash
docker run --rm -v "$PWD/deployment-tool/internal/kit/obs/alloy/config.alloy":/c.alloy:ro \
  grafana/alloy:v1.19.2 validate --stability.level=experimental /c.alloy
```
