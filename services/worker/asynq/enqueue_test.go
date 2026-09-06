package asynq

import (
	"errors"
	"testing"

	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/testing/redisfake"

	"github.com/hibiken/asynq"
	natslib "github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

// streamMsg is a delivered task message. Enqueue reads only the body, the
// headers and the metadata, so the rest of the interface is left to panic if
// anything starts depending on it.
//
// A zero seq stands for metadata the consumer could not read.
type streamMsg struct {
	jetstream.Msg
	data    []byte
	headers natslib.Header
	seq     uint64
}

func (m streamMsg) Data() []byte            { return m.data }
func (m streamMsg) Headers() natslib.Header { return m.headers }
func (m streamMsg) Subject() string         { return "" }

func (m streamMsg) Metadata() (*jetstream.MsgMetadata, error) {
	if m.seq == 0 {
		return nil, errors.New("no metadata on this message")
	}
	return &jetstream.MsgMetadata{
		Sequence: jetstream.SequencePair{Stream: m.seq, Consumer: m.seq},
	}, nil
}

// delivery is one message off the task stream, identified by its stream
// sequence. Redelivering it means handing the same value to Enqueue again.
func delivery(seq uint64, body string) streamMsg {
	return streamMsg{data: []byte(body), headers: natslib.Header{}, seq: seq}
}

// taskClient is a client and an inspector on one fake Redis.
func taskClient(t *testing.T) (*asynq.Client, *asynq.Inspector) {
	t.Helper()
	fake := redisfake.New(t)
	opt := asynq.RedisClientOpt{Addr: fake.Addr()}

	client := asynq.NewClient(opt)
	t.Cleanup(func() { _ = client.Close() })
	inspector := asynq.NewInspector(opt)
	t.Cleanup(func() { _ = inspector.Close() })
	return client, inspector
}

func enqueueOne(t *testing.T, body string) (*asynq.Inspector, string) {
	t.Helper()
	fake := redisfake.New(t)
	opt := asynq.RedisClientOpt{Addr: fake.Addr()}

	client := asynq.NewClient(opt)
	t.Cleanup(func() { _ = client.Close() })

	taskType := eipnats.RefreshRegionMarketOrders.Name
	msg := delivery(1, body)
	if err := Enqueue(t.Context(), msg, client, eipnats.RefreshRegionMarketOrders); err != nil {
		t.Fatalf("Enqueue: %v", err)
	}

	inspector := asynq.NewInspector(opt)
	t.Cleanup(func() { _ = inspector.Close() })
	return inspector, taskType
}

// The request the publisher wrote is what reaches the queue. Asynq carries the
// task type in its own field, so nothing in the payload repeats it — a wrapper
// here would be decoded as the request itself and the task would run on a
// zero-valued one.
func TestEnqueuePutsTheRequestOnTheQueueUnwrapped(t *testing.T) {
	t.Parallel()

	request := `{"region_id":10000002,"station_id":60003760}`
	inspector, taskType := enqueueOne(t, `{"type":"task","data":`+request+`}`)

	queue := eipnats.RefreshRegionMarketOrders.DefaultPriority
	tasks, err := inspector.ListPendingTasks(queue)
	if err != nil {
		t.Fatalf("ListPendingTasks(%s): %v", queue, err)
	}
	if len(tasks) != 1 {
		t.Fatalf("queued %d tasks on %s, want 1", len(tasks), queue)
	}

	got := tasks[0]
	if got.Type != taskType {
		t.Errorf("task type %q, want %q — the mux routes on this", got.Type, taskType)
	}
	if string(got.Payload) != request {
		t.Errorf("payload is\n  %s\nwant the request as published\n  %s", got.Payload, request)
	}
}

// The queue a task runs on comes from its definition, not from anything the
// publisher can set, so a task cannot talk its way onto a busier queue.
func TestEnqueueUsesTheQueueFromTheDefinition(t *testing.T) {
	t.Parallel()

	inspector, _ := enqueueOne(t, `{"type":"task","data":{"region_id":1,"station_id":2}}`)

	want := eipnats.RefreshRegionMarketOrders.DefaultPriority
	for _, queue := range []string{
		eipnats.Priority1, eipnats.Priority2, eipnats.Priority3,
		eipnats.Priority4, eipnats.Priority5,
	} {
		tasks, err := inspector.ListPendingTasks(queue)
		if err != nil {
			continue
		}
		if queue != want && len(tasks) > 0 {
			t.Errorf("%d tasks landed on %s, want them all on %s", len(tasks), queue, want)
		}
	}
}

// A bodiless trigger carries no request, and must still queue: its task type is
// the whole instruction.
func TestEnqueueQueuesATriggerWithNoRequest(t *testing.T) {
	t.Parallel()

	inspector, _ := enqueueOne(t, `{"type":"empty"}`)

	tasks, err := inspector.ListPendingTasks(eipnats.RefreshRegionMarketOrders.DefaultPriority)
	if err != nil {
		t.Fatalf("ListPendingTasks: %v", err)
	}
	if len(tasks) != 1 {
		t.Fatalf("queued %d tasks, want 1", len(tasks))
	}
	if len(tasks[0].Payload) != 0 {
		t.Errorf("payload is %q, want nothing", tasks[0].Payload)
	}
}

// A message that is not the shared envelope is refused rather than queued as
// whatever it happened to parse as.
func TestEnqueueRefusesAMessageThatIsNotTheEnvelope(t *testing.T) {
	t.Parallel()

	fake := redisfake.New(t)
	client := asynq.NewClient(asynq.RedisClientOpt{Addr: fake.Addr()})
	t.Cleanup(func() { _ = client.Close() })

	msg := delivery(1, `not json`)
	if err := Enqueue(t.Context(), msg, client, eipnats.RefreshRegionMarketOrders); err == nil {
		t.Fatal("an unreadable message was queued")
	}
}

// The stream redelivers a message when its ack is slow or lost, and the task it
// carries is already on the queue. The second delivery must not queue the work a
// second time.
func TestEnqueueDoesNotQueueARedeliveredMessageTwice(t *testing.T) {
	t.Parallel()

	client, inspector := taskClient(t)
	task := eipnats.RefreshRegionMarketOrders
	msg := delivery(42, `{"type":"task","data":{"region_id":1,"station_id":2}}`)

	for attempt := 1; attempt <= 2; attempt++ {
		if err := Enqueue(t.Context(), msg, client, task); err != nil {
			t.Fatalf("delivery %d: %v — a redelivery is not a failure", attempt, err)
		}
	}

	tasks, err := inspector.ListPendingTasks(task.DefaultPriority)
	if err != nil {
		t.Fatalf("ListPendingTasks: %v", err)
	}
	if len(tasks) != 1 {
		t.Fatalf("queued %d tasks after redelivery, want 1", len(tasks))
	}
}

// Deduplication keys on the delivery, not on the work, so two genuine dispatches
// of the same task both run.
func TestEnqueueQueuesDistinctDeliveriesOfTheSameWork(t *testing.T) {
	t.Parallel()

	client, inspector := taskClient(t)
	task := eipnats.RefreshRegionMarketOrders
	body := `{"type":"task","data":{"region_id":1,"station_id":2}}`

	for _, seq := range []uint64{7, 8} {
		if err := Enqueue(t.Context(), delivery(seq, body), client, task); err != nil {
			t.Fatalf("sequence %d: %v", seq, err)
		}
	}

	tasks, err := inspector.ListPendingTasks(task.DefaultPriority)
	if err != nil {
		t.Fatalf("ListPendingTasks: %v", err)
	}
	if len(tasks) != 2 {
		t.Fatalf("queued %d tasks for two dispatches, want 2", len(tasks))
	}
}

// Without metadata there is nothing to deduplicate on, and the task still has to
// run: an unreadable sequence costs the guarantee, not the work.
func TestEnqueueQueuesAMessageWithNoReadableMetadata(t *testing.T) {
	t.Parallel()

	client, inspector := taskClient(t)
	task := eipnats.RefreshRegionMarketOrders
	msg := streamMsg{data: []byte(`{"type":"empty"}`), headers: natslib.Header{}}

	if err := Enqueue(t.Context(), msg, client, task); err != nil {
		t.Fatalf("Enqueue: %v", err)
	}

	tasks, err := inspector.ListPendingTasks(task.DefaultPriority)
	if err != nil {
		t.Fatalf("ListPendingTasks: %v", err)
	}
	if len(tasks) != 1 {
		t.Fatalf("queued %d tasks, want 1", len(tasks))
	}
}

// A real delivery carries trace headers, which asynq takes through a different
// constructor. Deduplication is not a property of the untraced path only, so the
// redelivery must be recognised there too.
func TestEnqueueDoesNotQueueARedeliveredTracedMessageTwice(t *testing.T) {
	t.Parallel()

	client, inspector := taskClient(t)
	task := eipnats.RefreshRegionMarketOrders
	msg := delivery(99, `{"type":"task","data":{"region_id":1,"station_id":2}}`)
	msg.headers = natslib.Header{
		"Traceparent": []string{"00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"},
	}

	for attempt := 1; attempt <= 2; attempt++ {
		if err := Enqueue(t.Context(), msg, client, task); err != nil {
			t.Fatalf("delivery %d: %v", attempt, err)
		}
	}

	tasks, err := inspector.ListPendingTasks(task.DefaultPriority)
	if err != nil {
		t.Fatalf("ListPendingTasks: %v", err)
	}
	if len(tasks) != 1 {
		t.Fatalf("queued %d traced tasks after redelivery, want 1", len(tasks))
	}
}

// Only a duplicate delivery is absolved. A queue that cannot be reached is a
// failure the caller has to see, or the message is acked and the task is lost.
func TestEnqueueReportsAFailureThatIsNotADuplicate(t *testing.T) {
	t.Parallel()

	fake := redisfake.New(t)
	client := asynq.NewClient(asynq.RedisClientOpt{Addr: fake.Addr()})
	t.Cleanup(func() { _ = client.Close() })
	fake.Server.Close()

	msg := delivery(1, `{"type":"task","data":{"region_id":1,"station_id":2}}`)
	if err := Enqueue(t.Context(), msg, client, eipnats.RefreshRegionMarketOrders); err == nil {
		t.Fatal("an unreachable queue was reported as queued")
	}
}
