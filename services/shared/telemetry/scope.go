package telemetry

import (
	"context"
	"fmt"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/trace"
)

// scopePrefix names every instrumentation scope this repo registers, so a component passes
// "worker" rather than repeating the full string at each call site.
const scopePrefix = "eve-industry-planner/"

// Meter returns the meter for component, e.g. Meter("worker") for scope
// "eve-industry-planner/worker".
//
// Deliberately not memoised: [Init] installs the global provider after package init and tests swap
// it, so a cached meter can pin the noop one that was current at first use. The provider caches by
// scope name, which is what makes calling this per registration cheap.
func Meter(component string) metric.Meter {
	return otel.Meter(scopePrefix + component)
}

// Tracer returns the tracer for component. Same scope convention and same caching note as [Meter].
func Tracer(component string) trace.Tracer {
	return otel.Tracer(scopePrefix + component)
}

// WithoutTracing returns ctx carrying a non-recording span, so client instrumentation that starts
// spans from it produces none. Observable gauge callbacks run on every metric export: the calls
// they make are collection rather than work worth a span, and they attach to whichever trace is
// open when the reader fires.
func WithoutTracing(ctx context.Context) context.Context {
	return trace.ContextWithSpanContext(ctx, notSampled)
}

// A valid SpanContext that is explicitly not sampled. ParentBased honours that decision, whereas a
// context with no parent at all leaves the sampler free to start a fresh trace.
var notSampled = trace.NewSpanContext(trace.SpanContextConfig{
	TraceID:    trace.TraceID{0x01},
	SpanID:     trace.SpanID{0x01},
	TraceFlags: 0,
	Remote:     false,
})

// Must returns instrument, panicking when the SDK refused to create it. A refusal means a malformed
// instrument name or unit, which is a programmer error fixed in the code rather than a runtime
// condition a caller could handle.
func Must[T any](instrument T, err error) T {
	if err != nil {
		panic(fmt.Sprintf("telemetry: %T: %v", instrument, err))
	}
	return instrument
}
