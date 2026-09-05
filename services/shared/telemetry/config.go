package telemetry

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// tracesSampleRateEnv is the head-based sampling rate for span export, shared with the edge:
// Traefik takes the sampling decision and the services follow it, so one rate governs both.
// Empty or unparseable → 0, which exports no spans.
const tracesSampleRateEnv = "TRACES_SAMPLE_RATE"

// DefaultOTLPEndpoint is the gRPC host:port for Alloy (DNS alias on eip-core when obs addon is up).
const DefaultOTLPEndpoint = "alloy:4317"

// observabilityEnabledEnv gates OTLP export. The observability addon is optional, so Alloy is
// absent unless the operator enabled it; dialling it anyway leaves every exporter retrying a name
// that resolves to nothing. The Deployment Tool sets this from addons.observability.enabled.
const observabilityEnabledEnv = "OBSERVABILITY_ENABLED"

// DefaultMetricExportInterval is the OTLP metric reader period when [Config.MetricExportInterval] is zero.
// Match Prometheus global scrape_interval for job otel_collector (see observability/prometheus/prometheus.yml)
// so the collector’s :8889 exposition updates between scrapes instead of going stale for a full minute.
const DefaultMetricExportInterval = 15 * time.Second

// Config controls Init. Sentry DSN/release come from link-time [Baked*] vars (see baked.go).
type Config struct {
	ServiceName    string
	ServiceVersion string

	OTLPEndpoint string
	OTLPInsecure bool

	// MetricExportInterval is how often the SDK pushes OTLP metrics to the collector.
	// Zero means [DefaultMetricExportInterval] (aligned with Prometheus ingest from Alloy remote write).
	MetricExportInterval time.Duration

	SentryDSN         string
	SentryEnvironment string
	SentryRelease     string

	// TracesSampleRate is the ratio of traces exported when a sampling decision has not
	// already been made upstream. Zero exports none.
	TracesSampleRate float64
}

// DefaultConfig returns OTLP settings for services running on the standard stack (Alloy as alloy:4317).
// The endpoint is empty unless the observability addon is on, which leaves metrics and logs
// unexported; Sentry is unaffected.
func DefaultConfig(serviceName string) Config {
	return Config{
		ServiceName:       strings.TrimSpace(serviceName),
		ServiceVersion:    resolveServiceVersion(),
		OTLPEndpoint:      resolveOTLPEndpoint(),
		OTLPInsecure:      true,
		SentryDSN:         strings.TrimSpace(BakedSentryDSN),
		SentryEnvironment: resolveDeploymentEnvironment(),
		SentryRelease:     strings.TrimSpace(BakedRelease),
		TracesSampleRate:  resolveTracesSampleRate(),
	}
}

// resolveOTLPEndpoint returns the collector address when the observability addon is on, else "".
func resolveOTLPEndpoint() string {
	on, err := strconv.ParseBool(strings.TrimSpace(os.Getenv(observabilityEnabledEnv)))
	if err != nil || !on {
		return ""
	}
	return DefaultOTLPEndpoint
}

// resolveDeploymentEnvironment prefers runtime .env (Swarm env_file) over bake-time mode.
// Order: DEPLOYMENT_ENVIRONMENT → ENVIRONMENT → BakedAppMode → "production".
func resolveDeploymentEnvironment() string {
	for _, key := range []string{"DEPLOYMENT_ENVIRONMENT", "ENVIRONMENT"} {
		if v := strings.TrimSpace(os.Getenv(key)); v != "" {
			return v
		}
	}
	if v := strings.TrimSpace(BakedAppMode); v != "" {
		return v
	}
	return "production"
}

// parseTraceSampleRate parses a performance-trace sample rate in [0,1].
// Empty or invalid input yields 0 (no performance traces; Sentry errors still use SampleRate 1.0 in telemetry.Init).
func parseTraceSampleRate(raw string) float64 {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return 0
	}
	f, err := strconv.ParseFloat(raw, 64)
	if err != nil || f < 0 || f > 1 {
		return 0
	}
	return f
}

func resolveTracesSampleRate() float64 {
	return parseTraceSampleRate(os.Getenv(tracesSampleRateEnv))
}

// resolveServiceVersion returns the app semver for OTLP service.version (logs/metrics resource).
// Priority: link-time BakedRelease (Docker APP_VERSION) → APP_VERSION_NUMBER → APP_VERSION → FRONTEND_APP_VERSION.
func resolveServiceVersion() string {
	if v := strings.TrimSpace(BakedRelease); v != "" {
		return v
	}
	for _, key := range []string{"APP_VERSION_NUMBER", "APP_VERSION", "FRONTEND_APP_VERSION"} {
		if v := strings.TrimSpace(os.Getenv(key)); v != "" {
			return v
		}
	}
	return ""
}

func (c Config) shouldInit() bool {
	if c.ServiceName == "" {
		return false
	}
	return c.OTLPEndpoint != "" || c.SentryDSN != ""
}
