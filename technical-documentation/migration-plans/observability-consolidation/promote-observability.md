# Promotion draft — `stack/observability.md`

**This file is not live SoT.** It is the topic doc Stage J creates at
[`stack/observability.md`](../../stack/contents.md), drafted here because live SoT is not edited
while the project is active. Its links are written relative to `stack/`, so they resolve once the
file lands there and not from this folder.

Companion drafts: [promote-contents.md](./promote-contents.md) (task-map and `.env` rows).

---


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

