package telemetry

import (
	"testing"
)

func TestParseTraceSampleRate(t *testing.T) {
	tests := []struct {
		in   string
		want float64
	}{
		{"", 0},
		{"0", 0},
		{"0.0", 0},
		{"0.25", 0.25},
		{"1", 1},
		{"1.0", 1},
		{" 0.5 ", 0.5},
		{"2", 0},
		{"-1", 0},
		{"nope", 0},
	}
	for _, tt := range tests {
		if got := parseTraceSampleRate(tt.in); got != tt.want {
			t.Errorf("parseTraceSampleRate(%q) = %v, want %v", tt.in, got, tt.want)
		}
	}
}

func TestResolveTracesSampleRate_readsEnv(t *testing.T) {
	t.Setenv(tracesSampleRateEnv, "0.2")

	if got := resolveTracesSampleRate(); got != 0.2 {
		t.Fatalf("want 0.2: got %v", got)
	}
}

func TestResolveTracesSampleRate_unparseableMeansZero(t *testing.T) {
	t.Setenv(tracesSampleRateEnv, "some-of-them")

	if got := resolveTracesSampleRate(); got != 0 {
		t.Fatalf("want 0: got %v", got)
	}
}

func TestResolveServiceVersion_bakedRelease(t *testing.T) {
	saved := BakedRelease
	BakedRelease = "1.2.3"
	t.Cleanup(func() { BakedRelease = saved })

	if got := resolveServiceVersion(); got != "1.2.3" {
		t.Fatalf("got %q", got)
	}
}

func TestResolveServiceVersion_envFallback(t *testing.T) {
	saved := BakedRelease
	BakedRelease = ""
	t.Cleanup(func() { BakedRelease = saved })
	t.Setenv("APP_VERSION_NUMBER", "0.8.15")

	if got := resolveServiceVersion(); got != "0.8.15" {
		t.Fatalf("got %q", got)
	}
}

func TestDefaultConfig_serviceVersion(t *testing.T) {
	saved := BakedRelease
	BakedRelease = "2.0.0"
	t.Cleanup(func() { BakedRelease = saved })

	if got := DefaultConfig("api").ServiceVersion; got != "2.0.0" {
		t.Fatalf("got %q", got)
	}
}

func TestResolveDeploymentEnvironment(t *testing.T) {
	saved := BakedAppMode
	BakedAppMode = "baked"
	t.Cleanup(func() { BakedAppMode = saved })

	t.Setenv("DEPLOYMENT_ENVIRONMENT", "")
	t.Setenv("ENVIRONMENT", "")
	if got := resolveDeploymentEnvironment(); got != "baked" {
		t.Fatalf("want baked, got %q", got)
	}

	t.Setenv("ENVIRONMENT", "development")
	if got := resolveDeploymentEnvironment(); got != "development" {
		t.Fatalf("want ENVIRONMENT, got %q", got)
	}

	t.Setenv("DEPLOYMENT_ENVIRONMENT", "staging")
	if got := resolveDeploymentEnvironment(); got != "staging" {
		t.Fatalf("want DEPLOYMENT_ENVIRONMENT, got %q", got)
	}
}

func TestResolveTracesSampleRate_emptyMeansZero(t *testing.T) {
	t.Setenv(tracesSampleRateEnv, "")

	if got := resolveTracesSampleRate(); got != 0 {
		t.Fatalf("want 0: got %v", got)
	}
}

func TestResolveOTLPEndpoint(t *testing.T) {
	for _, tt := range []struct {
		env  string
		want string
	}{
		{"", ""},
		{"false", ""},
		{"nonsense", ""},
		{"true", DefaultOTLPEndpoint},
		{" 1 ", DefaultOTLPEndpoint},
	} {
		t.Setenv(observabilityEnabledEnv, tt.env)
		if got := resolveOTLPEndpoint(); got != tt.want {
			t.Errorf("%s=%q: got %q, want %q", observabilityEnabledEnv, tt.env, got, tt.want)
		}
	}
}

func TestDefaultConfig_observabilityOffKeepsSentry(t *testing.T) {
	t.Setenv(observabilityEnabledEnv, "false")
	saved := BakedSentryDSN
	BakedSentryDSN = "https://key@example.ingest.sentry.io/1"
	t.Cleanup(func() { BakedSentryDSN = saved })

	cfg := DefaultConfig("api")
	if cfg.OTLPEndpoint != "" {
		t.Fatalf("want no OTLP endpoint, got %q", cfg.OTLPEndpoint)
	}
	if !cfg.shouldInit() {
		t.Fatal("want Init to still run for Sentry")
	}
}

// With the observability addon off there is no collector to export to, so the
// services must not stand up a tracer that buffers spans for a name that
// resolves to nothing.
func TestTracingFollowsTheObservabilityAddon(t *testing.T) {
	t.Setenv(observabilityEnabledEnv, "false")
	if cfg := DefaultConfig("api"); cfg.OTLPEndpoint != "" {
		t.Fatalf("addon off: OTLPEndpoint = %q, want empty", cfg.OTLPEndpoint)
	}

	t.Setenv(observabilityEnabledEnv, "true")
	if cfg := DefaultConfig("api"); cfg.OTLPEndpoint != DefaultOTLPEndpoint {
		t.Fatalf("addon on: OTLPEndpoint = %q, want %q", cfg.OTLPEndpoint, DefaultOTLPEndpoint)
	}
}
