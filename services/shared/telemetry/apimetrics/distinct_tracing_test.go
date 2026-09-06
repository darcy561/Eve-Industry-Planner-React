package apimetrics_test

import (
	"testing"

	"eve-industry-planner/shared/telemetry/apimetrics"
	"eve-industry-planner/testing/redisfake"

	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/otel"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
)

// These gauges merge HyperLogLogs on every export. The Redis client is instrumented in production,
// so without suppression each merge writes spans onto whichever trace is open when the reader fires.
func TestDistinctGaugeCollectionEmitsNoSpans(t *testing.T) {
	for _, tc := range []struct {
		name     string
		register func(*redis.Client)
	}{
		{"auth sessions", apimetrics.RegisterAuthSessionDistinctGauges},
		{"sso refresh", apimetrics.RegisterSSORefreshDistinctGauges},
	} {
		t.Run(tc.name, func(t *testing.T) {
			rec := tracetest.NewSpanRecorder()
			tp := sdktrace.NewTracerProvider(
				sdktrace.WithSpanProcessor(rec),
				sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(1.0))),
			)
			otel.SetTracerProvider(tp)
			t.Cleanup(func() { otel.SetTracerProvider(nil) })

			reader := sdkmetric.NewManualReader()
			otel.SetMeterProvider(sdkmetric.NewMeterProvider(sdkmetric.WithReader(reader)))

			rdb := redisfake.New(t)
			if err := redisotel.InstrumentTracing(rdb.Client); err != nil {
				t.Fatalf("InstrumentTracing: %v", err)
			}

			// Dial happens lazily on first use and is connection setup, not the callback's work.
			if err := rdb.Client.Ping(t.Context()).Err(); err != nil {
				t.Fatalf("Ping: %v", err)
			}

			tc.register(rdb.Client)

			before := len(rec.Ended())

			var rm metricdata.ResourceMetrics
			if err := reader.Collect(t.Context(), &rm); err != nil {
				t.Fatalf("Collect: %v", err)
			}
			if err := tp.ForceFlush(t.Context()); err != nil {
				t.Fatalf("ForceFlush: %v", err)
			}

			if spans := rec.Ended()[before:]; len(spans) != 0 {
				names := make([]string, 0, len(spans))
				for _, s := range spans {
					names = append(names, s.Name())
				}
				t.Fatalf("metric collection emitted %d spans: %v", len(spans), names)
			}
		})
	}
}
