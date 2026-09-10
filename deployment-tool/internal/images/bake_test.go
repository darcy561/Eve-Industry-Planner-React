package images

import (
	"slices"
	"strings"
	"testing"
)

func TestRoleEnvKey(t *testing.T) {
	if got := roleEnvKey("ws-router"); got != "ws_router" {
		t.Fatalf("got %q", got)
	}
}

func TestParseBakeArgs(t *testing.T) {
	t.Parallel()
	noCache, roles, err := parseBakeArgs([]string{"--no-cache", "api", "worker"})
	if err != nil || !noCache || len(roles) != 2 || roles[0] != "api" || roles[1] != "worker" {
		t.Fatalf("got noCache=%v roles=%v err=%v", noCache, roles, err)
	}
	noCache, roles, err = parseBakeArgs([]string{"swarm"})
	if err != nil || noCache || len(roles) != 0 {
		t.Fatalf("swarm: noCache=%v roles=%v err=%v", noCache, roles, err)
	}
	_, _, err = parseBakeArgs([]string{"--dry-run"})
	if err == nil || !strings.Contains(err.Error(), "unsupported") {
		t.Fatalf("dry-run: %v", err)
	}
	_, _, err = parseBakeArgs([]string{"--bogus"})
	if err == nil || !strings.Contains(err.Error(), "unknown flag") {
		t.Fatalf("unknown: %v", err)
	}
}

func TestSwarmLocalTag(t *testing.T) {
	repo := "eve-industry-planner-api"
	cases := []struct {
		img  string
		want string
	}{
		{"", ""},
		{"ghcr.io/foo/api:1.0", ""},
		{"eve-industry-planner-api:bake", ""},
		{"eve-industry-planner-api:0.8.27-20260725233928", "0.8.27-20260725233928"},
		{"eve-industry-planner-api:0.8.27-20260725233928@sha256:abc", "0.8.27-20260725233928"},
	}
	for _, tc := range cases {
		if got := swarmLocalTag(repo, tc.img); got != tc.want {
			t.Fatalf("swarmLocalTag(%q)=%q want %q", tc.img, got, tc.want)
		}
	}
}

func TestBakeArgs(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name    string
		noCache bool
		stream  bool
		roles   []string
		want    []string
	}{
		{
			name: "every role, quiet",
			want: []string{"buildx", "bake", "-f", "-", "--provenance=false", "--progress=quiet", "swarm"},
		},
		{
			name:   "named roles, streaming",
			stream: true,
			roles:  []string{"api", "worker"},
			want:   []string{"buildx", "bake", "-f", "-", "--provenance=false", "--progress=plain", "api", "worker"},
		},
		{
			name:    "no cache",
			noCache: true,
			roles:   []string{"core"},
			want:    []string{"buildx", "bake", "-f", "-", "--no-cache", "--provenance=false", "--progress=quiet", "core"},
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			t.Parallel()
			got := bakeArgs(c.noCache, c.stream, c.roles)
			if !slices.Equal(got, c.want) {
				t.Fatalf("got %v, want %v", got, c.want)
			}
		})
	}
}
