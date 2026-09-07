package appconfig

import (
	"testing"

	"eve-industry-planner/shared/appconfig"
)

// The gauge's string case reads the shared truthy spelling rather than its own
// copy, so a value the rest of the stack calls on is not reported as off here.
func TestFeatureFlagAsFloat(t *testing.T) {
	t.Parallel()

	for _, tc := range []struct {
		name string
		in   any
		want float64
	}{
		{name: "bool true", in: true, want: 1},
		{name: "bool false", in: false, want: 0},
		{name: "float set", in: 2.5, want: 1},
		{name: "float zero", in: 0.0, want: 0},
		{name: "int set", in: 3, want: 1},
		{name: "int zero", in: 0, want: 0},
		{name: "int64 set", in: int64(9), want: 1},
		{name: "int64 zero", in: int64(0), want: 0},
		{name: "string 1", in: "1", want: 1},
		{name: "string true", in: "true", want: 1},
		{name: "string YES", in: "YES", want: 1},
		{name: "string padded on", in: " on ", want: 1},
		{name: "string false", in: "false", want: 0},
		{name: "string empty", in: "", want: 0},
		{name: "string nonsense", in: "nonsense", want: 0},
		{name: "unknown type", in: []string{"x"}, want: 0},
		{name: "nil", in: nil, want: 0},
	} {
		if got := featureFlagAsFloat(tc.in); got != tc.want {
			t.Errorf("%s: featureFlagAsFloat(%v) = %v, want %v", tc.name, tc.in, got, tc.want)
		}
	}
}

// Every spelling the shared reader calls true must report 1 here, so the metric
// and the behaviour it names cannot disagree.
func TestFeatureFlagStringsFollowTheSharedTruthy(t *testing.T) {
	t.Parallel()

	for _, spelling := range []string{"1", "true", "TRUE", "yes", "Yes", "on", "ON", " true ", "0", "false", "off", "", "maybe"} {
		want := 0.0
		if appconfig.Truthy(spelling) {
			want = 1
		}
		if got := featureFlagAsFloat(spelling); got != want {
			t.Errorf("%q: gauge reports %v, shared Truthy says %v", spelling, got, appconfig.Truthy(spelling))
		}
	}
}
