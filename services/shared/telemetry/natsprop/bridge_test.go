package natsprop_test

import (
	"context"
	"testing"

	"eve-industry-planner/shared/telemetry/natsprop"

	natslib "github.com/nats-io/nats.go"
	"go.opentelemetry.io/otel/trace"
)

// The bridge re-publishes an inbound message onto a queue. The consumer's span belongs under the
// bridge's, so the wait in Redis is the gap between parent and child rather than a gap between two
// siblings that no span accounts for.
func TestBridgeHeadersParentOnTheBridgeNotThePublisher(t *testing.T) {
	installPropagator(t)

	publisherCtx, published := sampledContext(t)
	inbound := natslib.Header{}
	natsprop.Inject(publisherCtx, inbound)

	// The bridge's own span, as eipnats.Handle opens it around the inbound message.
	bridgeCtx, bridge := sampledContext(t)

	headers := natsprop.AsynqHeadersForBridge(bridgeCtx, inbound)

	got := trace.SpanContextFromContext(natsprop.ExtractFromStringMap(context.Background(), headers))
	if got.SpanID() != bridge.SpanID() {
		t.Fatalf("parent span %s, want the bridge %s", got.SpanID(), bridge.SpanID())
	}
	if got.SpanID() == published.SpanID() {
		t.Fatal("parent is still the publisher: execution would be a sibling of the bridge")
	}
}

// Whatever else the message arrived carrying is the publisher's to send and the handler's to read,
// so replacing the trace context must not drop it.
func TestBridgeHeadersKeepInboundIdentity(t *testing.T) {
	installPropagator(t)

	inbound := natslib.Header{}
	inbound.Set("x-request-id", "req-1")

	bridgeCtx, _ := sampledContext(t)
	headers := natsprop.AsynqHeadersForBridge(bridgeCtx, inbound)

	if headers["x-request-id"] != "req-1" {
		t.Fatalf("inbound identity lost across the bridge: %v", headers)
	}
	if headers["traceparent"] == "" {
		t.Fatalf("bridge wrote no traceparent: %v", headers)
	}
}

// A bridge with no span of its own still has to forward what it was given, or the trace stops at
// the queue rather than continuing through it.
func TestBridgeWithoutItsOwnSpanForwardsInbound(t *testing.T) {
	installPropagator(t)

	publisherCtx, published := sampledContext(t)
	inbound := natslib.Header{}
	natsprop.Inject(publisherCtx, inbound)

	headers := natsprop.AsynqHeadersForBridge(context.Background(), inbound)

	got := trace.SpanContextFromContext(natsprop.ExtractFromStringMap(context.Background(), headers))
	if got.TraceID() != published.TraceID() {
		t.Fatalf("trace id %s, want the publisher's %s", got.TraceID(), published.TraceID())
	}
}

func TestBridgeWithNothingToCarry(t *testing.T) {
	installPropagator(t)
	if got := natsprop.AsynqHeadersForBridge(context.Background(), natslib.Header{}); got != nil {
		t.Fatalf("want nil, got %v", got)
	}
}
