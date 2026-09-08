package apimetrics_test

import (
	"context"
	"testing"
	"time"

	"go.opentelemetry.io/otel"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"

	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/shared/telemetry/apimetrics"
	"eve-industry-planner/testing/redisfake"
)

// Each gauge answers for its own window. A registration that paired a gauge
// with the wrong window would still export three numbers.
func TestAuthSessionGaugesReportTheirOwnWindow(t *testing.T) {
	reader := sdkmetric.NewManualReader()
	otel.SetMeterProvider(sdkmetric.NewMeterProvider(sdkmetric.WithReader(reader)))

	fake := redisfake.New(t)
	handle := eipredis.NewRedis(fake.Client)
	ctx := context.Background()

	// One account this hour, and another 100 hours ago: the 24h window sees
	// one, the 168h and 720h windows see two.
	now := time.Now().UTC().Truncate(time.Hour)
	if err := handle.AddDistinct(ctx, authHourKey(now), time.Hour*24*35, "recent"); err != nil {
		t.Fatalf("recent: %v", err)
	}
	if err := handle.AddDistinct(ctx, authHourKey(now.Add(-100*time.Hour)), time.Hour*24*35, "old"); err != nil {
		t.Fatalf("old: %v", err)
	}

	apimetrics.RegisterAuthSessionDistinctGauges(handle)

	var rm metricdata.ResourceMetrics
	if err := reader.Collect(ctx, &rm); err != nil {
		t.Fatalf("Collect: %v", err)
	}

	want := map[string]float64{
		"api.auth_sessions.distinct_accounts_last_24h":  1,
		"api.auth_sessions.distinct_accounts_last_168h": 2,
		"api.auth_sessions.distinct_accounts_last_720h": 2,
	}
	seen := map[string]float64{}
	for _, sm := range rm.ScopeMetrics {
		for _, m := range sm.Metrics {
			if g, ok := m.Data.(metricdata.Gauge[float64]); ok && len(g.DataPoints) > 0 {
				seen[m.Name] = g.DataPoints[0].Value
			}
		}
	}
	for name, w := range want {
		got, ok := seen[name]
		if !ok {
			t.Errorf("%s was not exported", name)
			continue
		}
		if got != w {
			t.Errorf("%s = %v, want %v", name, got, w)
		}
	}
}

func authHourKey(at time.Time) string {
	return "apimetrics:auth_sessions_distinct:hll:" + at.UTC().Truncate(time.Hour).Format("2006010215")
}
