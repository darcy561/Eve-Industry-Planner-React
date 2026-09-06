package esi_test

import (
	"testing"
	"time"

	"eve-industry-planner/core/metrics/esi"
	"eve-industry-planner/shared/esiclient"
	"eve-industry-planner/testing/redisfake"

	"github.com/redis/go-redis/extra/redisotel/v9"

	"go.opentelemetry.io/otel"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/metric/metricdata"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
)

// A gauge callback runs on every metric export, for the life of the process. The Redis client is
// instrumented, so a client call inside a callback becomes a span on whichever trace is open when
// the reader fires — unbounded span volume describing no request. Collection must not be traced.
func TestBucketGaugeCollectionEmitsNoSpans(t *testing.T) {
	// Seeding the bucket below is itself instrumented Redis work, so recording starts empty and is
	// read only across the collection: what is under test is what the callback costs, not setup.
	rec := tracetest.NewSpanRecorder()
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSpanProcessor(rec),
		// The sampler the services run, at the rate that would sample everything.
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(1.0))),
	)
	otel.SetTracerProvider(tp)
	t.Cleanup(func() { otel.SetTracerProvider(nil) })

	reader := sdkmetric.NewManualReader()
	otel.SetMeterProvider(sdkmetric.NewMeterProvider(sdkmetric.WithReader(reader)))

	rdb := redisfake.New(t)
	// Production installs this on every Redis client (shared/core/redis), and it is what turns a
	// command inside a callback into a span. Without it this test cannot see the defect.
	if err := redisotel.InstrumentTracing(rdb.Client); err != nil {
		t.Fatalf("InstrumentTracing: %v", err)
	}
	store := esiclient.NewStore(rdb.Client, esiclient.DefaultConfig())

	// A bucket with real state, so the callback does the Redis work it exists to do rather than
	// returning early on an empty keyspace.
	bucket := esiclient.Bucket{Group: "market-order", User: esiclient.AnonymousUser}
	grant, err := store.Reserve(t.Context(), bucket, esiclient.ClassBackground, esiclient.EndpointPolicy{}, 1)
	if err != nil {
		t.Fatalf("Reserve: %v", err)
	}
	if err := store.Settle(t.Context(), grant.Reservations[0], esiclient.Outcome{
		Attempted: true, Status: 200, Cost: esiclient.SuccessCost, ObservedAt: time.Now(),
		Limit: 12000, Window: 15 * time.Minute, Remaining: 12000 - esiclient.SuccessCost, Metered: true,
	}); err != nil {
		t.Fatalf("Settle: %v", err)
	}

	esi.Register(store)

	// Dial happens lazily on first use and is connection setup, not the callback's work.
	if err := rdb.Client.Ping(t.Context()).Err(); err != nil {
		t.Fatalf("Ping: %v", err)
	}

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
}
