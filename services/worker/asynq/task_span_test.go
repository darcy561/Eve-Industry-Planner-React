package asynq

import (
	"context"
	"testing"
	"time"

	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/testing/redisfake"
	"eve-industry-planner/worker/taskrun"

	"github.com/hibiken/asynq"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
	"go.opentelemetry.io/otel/trace"
)

func runOneTaskThroughTheMiddleware(t *testing.T) sdktrace.ReadOnlySpan {
	t.Helper()

	rec := tracetest.NewSpanRecorder()
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSpanProcessor(rec),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)
	otel.SetTracerProvider(tp)
	t.Cleanup(func() { otel.SetTracerProvider(nil) })

	mux := asynq.NewServeMux()
	installTaskMiddleware(mux)

	handlers := map[string]asynq.HandlerFunc{}
	handle(handlers, eipnats.RefreshRegionMarketOrders, &taskrun.Dependencies{},
		func(context.Context, eipnats.RegionMarketOrdersRequest, *taskrun.Dependencies) error { return nil })
	mux.Handle(eipnats.RefreshRegionMarketOrders.Name, handlers[eipnats.RefreshRegionMarketOrders.Name])

	task := asynq.NewTask(eipnats.RefreshRegionMarketOrders.Name, []byte(`{"region_id":1,"station_id":2}`))
	if err := mux.ProcessTask(t.Context(), task); err != nil {
		t.Fatalf("ProcessTask: %v", err)
	}
	if err := tp.ForceFlush(t.Context()); err != nil {
		t.Fatalf("ForceFlush: %v", err)
	}

	spans := rec.Ended()
	if len(spans) != 1 {
		t.Fatalf("want one task span, got %d", len(spans))
	}
	return spans[0]
}

// A queue consumer rendered as an internal call does not appear in a backend's messaging views,
// which key off the span kind.
func TestTaskSpanIsAConsumer(t *testing.T) {
	span := runOneTaskThroughTheMiddleware(t)

	if got := span.SpanKind(); got != trace.SpanKindConsumer {
		t.Errorf("span kind %v, want Consumer", got)
	}
}

// {operation} {destination} is what makes a span render as messaging rather than as a bespoke name
// a backend has no view for.
func TestTaskSpanFollowsTheMessagingNameConvention(t *testing.T) {
	span := runOneTaskThroughTheMiddleware(t)

	want := "process " + eipnats.RefreshRegionMarketOrders.Name
	if got := span.Name(); got != want {
		t.Errorf("span name %q, want %q", got, want)
	}
}

// The task type has to be on the span, not only in the log line, or a trace cannot say what ran.
func TestTaskSpanCarriesTheTaskType(t *testing.T) {
	span := runOneTaskThroughTheMiddleware(t)

	attrs := map[string]string{}
	for _, kv := range span.Attributes() {
		attrs[string(kv.Key)] = kv.Value.Emit()
	}

	for key, want := range map[string]string{
		"messaging.system":           "asynq",
		"messaging.operation.name":   "process",
		"messaging.destination.name": eipnats.RefreshRegionMarketOrders.Name,
		"asynq.task.type":            eipnats.RefreshRegionMarketOrders.Name,
	} {
		if attrs[key] != want {
			t.Errorf("%s = %q, want %q", key, attrs[key], want)
		}
	}
}

// The attempt attributes come from asynq's own run context, which only a running server populates,
// so this drives a real server rather than the mux alone. "Which attempt is this?" is the question
// a trace is best placed to answer, and it was only ever answered on a log line.
func TestTaskSpanCarriesTheAttempt(t *testing.T) {
	rec := tracetest.NewSpanRecorder()
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSpanProcessor(rec),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)
	otel.SetTracerProvider(tp)
	t.Cleanup(func() { otel.SetTracerProvider(nil) })

	fake := redisfake.New(t)
	opt := asynq.RedisClientOpt{Addr: fake.Addr()}

	ran := make(chan struct{}, 1)
	handlers := map[string]asynq.HandlerFunc{}
	task := eipnats.RefreshRegionMarketOrders
	handle(handlers, task, &taskrun.Dependencies{},
		func(context.Context, eipnats.RegionMarketOrdersRequest, *taskrun.Dependencies) error {
			ran <- struct{}{}
			return nil
		})

	mux := asynq.NewServeMux()
	if err := mount(mux, fullHandlerSet(handlers)); err != nil {
		t.Fatalf("mount: %v", err)
	}
	installTaskMiddleware(mux)

	srv := asynq.NewServer(opt, asynq.Config{
		Concurrency: 1,
		Queues:      map[string]int{task.DefaultPriority: 1},
	})
	go func() { _ = srv.Run(mux) }()
	t.Cleanup(func() { srv.Shutdown() })

	client := asynq.NewClient(opt)
	t.Cleanup(func() { _ = client.Close() })
	if _, err := client.Enqueue(
		asynq.NewTask(task.Name, []byte(`{"region_id":1,"station_id":2}`)),
		asynq.Queue(task.DefaultPriority),
	); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	select {
	case <-ran:
	case <-time.After(20 * time.Second):
		t.Fatal("the handler never ran")
	}

	// The span ends after the handler returns, so wait for it rather than racing the middleware.
	var span sdktrace.ReadOnlySpan
	for range 100 {
		if spans := rec.Ended(); len(spans) > 0 {
			span = spans[0]
			break
		}
		time.Sleep(50 * time.Millisecond)
	}
	if span == nil {
		t.Fatal("the task span never ended")
	}

	attrs := map[string]attribute.Value{}
	for _, kv := range span.Attributes() {
		attrs[string(kv.Key)] = kv.Value
	}

	if got, ok := attrs["messaging.message.id"]; !ok || got.AsString() == "" {
		t.Error("no task id on the span, so a trace cannot name what an operator sees")
	}
	if got := attrs["messaging.destination.subscription.name"].AsString(); got != task.DefaultPriority {
		t.Errorf("queue = %q, want %q", got, task.DefaultPriority)
	}
	if got := attrs["asynq.task.retried"].AsInt64(); got != 0 {
		t.Errorf("retried = %d on a first delivery, want 0", got)
	}
	if got := attrs["asynq.task.max_retries"].AsInt64(); got <= 0 {
		t.Errorf("max_retries = %d, want the queue's limit", got)
	}
	if _, ok := attrs["asynq.task.final_attempt"]; !ok {
		t.Error("no final_attempt on the span")
	}
}
