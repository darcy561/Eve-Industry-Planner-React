package stack

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

// The Go services read these at runtime. A key the services read but the fragment never passes
// leaves the feature silently off: the service resolves the empty value and takes its default,
// which for the sample rate means it exports no spans of its own.
var telemetryRuntimeEnv = []string{
	"OBSERVABILITY_ENABLED",
	"TRACES_SAMPLE_RATE",
}

// goServices are the services built from services/ and so subject to shared/telemetry.
var goServices = []string{"api", "core", "websocket", "worker", "ws-router", "capacity-controller"}

// A service that reads a key the stack never supplies looks healthy and does nothing. Sampling is
// the case this exists for: with ParentBased, spans under an inbound request still export because
// the edge decided, so only the spans a service starts for itself go missing.
func TestGoServicesReceiveTelemetryEnv(t *testing.T) {
	root := repoRoot(t)

	raw, err := os.ReadFile(filepath.Join(root, "docker-stack.yml"))
	if err != nil {
		t.Fatal(err)
	}

	var doc struct {
		Services map[string]struct {
			Environment map[string]string `yaml:"environment"`
		} `yaml:"services"`
	}
	if err := yaml.Unmarshal(raw, &doc); err != nil {
		t.Fatalf("parse docker-stack.yml: %v", err)
	}

	for _, name := range goServices {
		svc, ok := doc.Services[name]
		if !ok {
			t.Errorf("service %s not in docker-stack.yml", name)
			continue
		}
		for _, key := range telemetryRuntimeEnv {
			if _, ok := svc.Environment[key]; !ok {
				t.Errorf("service %s does not receive %s", name, key)
			}
		}
	}
}

// The list above is only worth having while it matches what the code actually reads, so it is
// checked against the source rather than trusted.
func TestTelemetryRuntimeEnvMatchesTheCode(t *testing.T) {
	root := repoRoot(t)

	raw, err := os.ReadFile(filepath.Join(root, "services", "shared", "telemetry", "config.go"))
	if err != nil {
		t.Skipf("telemetry config.go not readable: %v", err)
	}

	// const nameEnv = "KEY" — the form shared/telemetry declares its runtime keys in.
	re := regexp.MustCompile(`(?m)^const\s+\w*[Ee]nv\s*=\s*"([A-Z][A-Z0-9_]*)"`)
	found := map[string]bool{}
	for _, m := range re.FindAllStringSubmatch(string(raw), -1) {
		found[m[1]] = true
	}
	if len(found) == 0 {
		t.Fatal("no env key constants found in shared/telemetry/config.go")
	}

	for _, key := range telemetryRuntimeEnv {
		if !found[key] {
			t.Errorf("%s is asserted here but shared/telemetry no longer declares it", key)
		}
	}
	for key := range found {
		if !slicesContains(telemetryRuntimeEnv, key) {
			t.Errorf("shared/telemetry reads %s but no stack assertion covers it; add it to telemetryRuntimeEnv or say why it is bake-time", key)
		}
	}
}

func slicesContains(list []string, want string) bool {
	for _, v := range list {
		if strings.EqualFold(v, want) {
			return true
		}
	}
	return false
}
