package telemetry

import (
	"context"
	"testing"

	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

func decide(t *testing.T, rate float64, parent trace.SpanContext) sdktrace.SamplingDecision {
	t.Helper()
	ctx := context.Background()
	if parent.IsValid() {
		ctx = trace.ContextWithSpanContext(ctx, parent)
	}
	return sampler(rate).ShouldSample(sdktrace.SamplingParameters{
		ParentContext: ctx,
		TraceID:       trace.TraceID{0x01, 0x02, 0x03},
		Name:          "span",
	}).Decision
}

func remoteParent(sampled bool) trace.SpanContext {
	flags := trace.TraceFlags(0)
	if sampled {
		flags = trace.FlagsSampled
	}
	return trace.NewSpanContext(trace.SpanContextConfig{
		TraceID:    trace.TraceID{0x0a},
		SpanID:     trace.SpanID{0x0b},
		TraceFlags: flags,
		Remote:     true,
	})
}

// Traefik takes the head decision and the services follow it. A service that resampled would drop
// spans out of the middle of a trace it did not start, leaving a gap rather than a shorter trace.
func TestSamplerFollowsTheEdgeDecision(t *testing.T) {
	// Rate 0 is the shipped default: without honouring the parent, nothing under a sampled request
	// would export at all.
	if got := decide(t, 0, remoteParent(true)); got != sdktrace.RecordAndSample {
		t.Errorf("sampled parent at rate 0: got %v, want RecordAndSample", got)
	}
	// And the reverse: a parent that declined is not overridden by a high local rate.
	if got := decide(t, 1.0, remoteParent(false)); got == sdktrace.RecordAndSample {
		t.Error("unsampled parent at rate 1.0 was resampled locally")
	}
}

// Spans a service starts for itself — cron jobs, consumers, anything without an inbound request —
// have no parent to follow, so the local rate is the only thing governing them. This is the half
// that goes missing when the rate is not delivered to the service.
func TestSamplerGovernsSpansWithNoParent(t *testing.T) {
	if got := decide(t, 0, trace.SpanContext{}); got == sdktrace.RecordAndSample {
		t.Error("rate 0 sampled a root span")
	}
	if got := decide(t, 1.0, trace.SpanContext{}); got != sdktrace.RecordAndSample {
		t.Errorf("rate 1.0 root span: got %v, want RecordAndSample", got)
	}
}

// A rate above 1 is a misconfiguration, not a reason to refuse to trace.
func TestSamplerClampsAboveOne(t *testing.T) {
	if got := decide(t, 5, trace.SpanContext{}); got != sdktrace.RecordAndSample {
		t.Errorf("rate 5 clamped wrong: got %v, want RecordAndSample", got)
	}
}
