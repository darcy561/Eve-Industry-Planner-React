package telemetry

import (
	"context"
	"testing"

	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
)

// A gauge callback runs on every metric export, so a client call it makes must not become a span
// on whichever trace happened to be open when the reader fired.
func TestWithoutTracingStopsChildSpans(t *testing.T) {
	rec := tracetest.NewSpanRecorder()
	// The sampler the services actually run, at the rate that would sample everything.
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSpanProcessor(rec),
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(1.0))),
	)
	tracer := tp.Tracer("test")

	ctx, parent := tracer.Start(context.Background(), "parent")

	_, suppressed := tracer.Start(WithoutTracing(ctx), "collection")
	suppressed.End()

	_, normal := tracer.Start(ctx, "work")
	normal.End()
	parent.End()

	names := []string{}
	for _, s := range rec.Ended() {
		names = append(names, s.Name())
	}
	for _, n := range names {
		if n == "collection" {
			t.Fatalf("suppressed span was recorded: %v", names)
		}
	}
	if len(names) != 2 {
		t.Fatalf("want parent and work only, got %v", names)
	}
}
