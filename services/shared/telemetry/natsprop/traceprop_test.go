package natsprop_test

import (
	"context"
	"testing"

	"eve-industry-planner/shared/telemetry/natsprop"

	natslib "github.com/nats-io/nats.go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

// installPropagator matches what telemetry.Init sets. Without it the global propagator is a no-op
// and every Inject writes nothing, which is the failure this package exists to prevent.
func installPropagator(t *testing.T) {
	t.Helper()
	saved := otel.GetTextMapPropagator()
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))
	t.Cleanup(func() { otel.SetTextMapPropagator(saved) })
}

func sampledContext(t *testing.T) (context.Context, trace.SpanContext) {
	t.Helper()
	tp := sdktrace.NewTracerProvider(sdktrace.WithSampler(sdktrace.AlwaysSample()))
	ctx, span := tp.Tracer("test").Start(context.Background(), "publisher")
	t.Cleanup(func() { span.End() })
	return ctx, span.SpanContext()
}

// A publisher's span and the consumer's span belong to one trace, or following a request across
// the hop is impossible: the consumer starts a new root and the two halves never join.
func TestTraceSurvivesTheNATSHop(t *testing.T) {
	installPropagator(t)
	ctx, published := sampledContext(t)

	hdr := natslib.Header{}
	natsprop.Inject(ctx, hdr)

	if hdr.Get("traceparent") == "" {
		t.Fatal("Inject wrote no traceparent: the hop would break the trace")
	}

	got := trace.SpanContextFromContext(natsprop.Extract(context.Background(), hdr))
	if got.TraceID() != published.TraceID() {
		t.Fatalf("trace id %s across the hop, want %s", got.TraceID(), published.TraceID())
	}
	if got.SpanID() != published.SpanID() {
		t.Fatalf("parent span id %s, want %s", got.SpanID(), published.SpanID())
	}
	if !got.IsSampled() {
		t.Fatal("sampling decision lost across the hop: the consumer would resample independently")
	}
	if !got.IsRemote() {
		t.Fatal("extracted context is not remote")
	}
}

// The worker reaches its handlers through Asynq, so the context has to survive being copied from
// NATS headers into a flat string map and extracted again.
func TestTraceSurvivesTheAsynqHop(t *testing.T) {
	installPropagator(t)
	ctx, published := sampledContext(t)

	hdr := natslib.Header{}
	natsprop.Inject(ctx, hdr)

	headers := natsprop.AsynqHeadersFromNATS(hdr)
	if headers["traceparent"] == "" {
		t.Fatalf("traceparent lost copying NATS headers to Asynq: %v", headers)
	}

	got := trace.SpanContextFromContext(natsprop.ExtractFromStringMap(context.Background(), headers))
	if got.TraceID() != published.TraceID() {
		t.Fatalf("trace id %s after the Asynq hop, want %s", got.TraceID(), published.TraceID())
	}
	if !got.IsSampled() {
		t.Fatal("sampling decision lost through Asynq headers")
	}
}

// A task published from inside a handler stays on the trace that task arrived on.
func TestChildTaskStaysOnTheSameTrace(t *testing.T) {
	installPropagator(t)
	ctx, published := sampledContext(t)

	headers := natsprop.AsynqHeadersFromContext(ctx)
	if headers == nil {
		t.Fatal("AsynqHeadersFromContext returned nothing for a sampled span")
	}

	got := trace.SpanContextFromContext(natsprop.ExtractFromStringMap(context.Background(), headers))
	if got.TraceID() != published.TraceID() {
		t.Fatalf("child task trace id %s, want %s", got.TraceID(), published.TraceID())
	}
}

// Every function here no-ops on empty input rather than erroring, so a silently missing propagator
// looks identical to a working one. These pin the boundary so that stays deliberate.
func TestPropagationDegradesQuietly(t *testing.T) {
	installPropagator(t)

	t.Run("extract without headers leaves the context alone", func(t *testing.T) {
		ctx := natsprop.Extract(context.Background(), natslib.Header{})
		if trace.SpanContextFromContext(ctx).IsValid() {
			t.Fatal("empty headers produced a span context")
		}
	})

	t.Run("no active span injects nothing", func(t *testing.T) {
		if got := natsprop.AsynqHeadersFromContext(context.Background()); got != nil {
			t.Fatalf("headers from an untraced context: %v", got)
		}
	})

	t.Run("nil header is not a panic", func(t *testing.T) {
		ctx, _ := sampledContext(t)
		natsprop.Inject(ctx, nil)
	})

	t.Run("empty asynq headers survive the copy", func(t *testing.T) {
		if got := natsprop.AsynqHeadersFromNATS(natslib.Header{}); got != nil {
			t.Fatalf("want nil for empty headers, got %v", got)
		}
	})
}
