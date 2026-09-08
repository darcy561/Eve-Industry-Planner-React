package redis

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/testing/redisfake"
)

func TestPipelineBatchesReadsAndWrites(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	if err := r.PutString(ctx, "a", "one", time.Minute); err != nil {
		t.Fatalf("seed: %v", err)
	}
	fake.Server.HSet("h", "f", "v")

	p, err := r.Pipe()
	if err != nil {
		t.Fatalf("pipe: %v", err)
	}
	got := p.Get(ctx, "a")
	missing := p.Get(ctx, "absent")
	fields := p.Fields(ctx, "h")
	p.AppendToList(ctx, "list", "x", "y")
	length := p.Length(ctx, "list")

	if err := p.Exec(ctx); err != nil {
		t.Fatalf("exec: %v", err)
	}

	if v, err := got.Result(); err != nil || v != "one" {
		t.Errorf("get = %q, %v; want one", v, err)
	}
	if _, err := missing.Result(); !IsNotFound(err) {
		t.Errorf("absent key = %v, want not-found", err)
	}
	if v, err := fields.Result(); err != nil || v["f"] != "v" {
		t.Errorf("fields = %v, %v", v, err)
	}
	if n := length.Val(); n != 2 {
		t.Errorf("list length = %d, want 2", n)
	}
}

// A result read before Exec is not populated; the commands must actually be
// sent, not merely queued.
func TestPipelineSendsWhatItQueued(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	p, _ := r.Pipe()
	p.AppendToList(ctx, "q", "first")
	if fake.Server.Exists("q") {
		t.Fatal("the queued append reached Redis before Exec")
	}
	if err := p.Exec(ctx); err != nil {
		t.Fatalf("exec: %v", err)
	}
	if !fake.Server.Exists("q") {
		t.Error("Exec did not send the queued append")
	}
}

func TestPipelineDedupesAListEntry(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	for range 2 {
		p, _ := r.Pipe()
		p.RemoveFromList(ctx, "w", 1, "sess")
		p.AppendToList(ctx, "w", "sess")
		if err := p.Exec(ctx); err != nil {
			t.Fatalf("exec: %v", err)
		}
	}

	p, _ := r.Pipe()
	length := p.Length(ctx, "w")
	if err := p.Exec(ctx); err != nil {
		t.Fatalf("exec: %v", err)
	}
	if n := length.Val(); n != 1 {
		t.Errorf("waitlist length = %d, want 1: the entry was not deduped", n)
	}
}

func TestPipelineTrimsAndCountsAScoredSet(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	for member, score := range map[string]float64{"old": 10, "live": 10_000} {
		if err := r.PutScored(ctx, "z", member, score, time.Minute); err != nil {
			t.Fatalf("seed: %v", err)
		}
	}

	p, _ := r.Pipe()
	p.DropScoredRange(ctx, "z", "0", "100")
	count := p.CountScored(ctx, "z")
	if err := p.Exec(ctx); err != nil {
		t.Fatalf("exec: %v", err)
	}
	if n := count.Val(); n != 1 {
		t.Errorf("remaining members = %d, want 1", n)
	}
}

// Exec suppresses a missing key, because each result reports that for itself.
// It must not suppress anything else: a pipeline whose write failed would
// otherwise report success and lose a waitlist entry or a ledger update.
func TestPipelineExecReportsARealFailure(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	// A wrong-type command is a real error rather than a missing key.
	if err := r.PutString(ctx, "notalist", "value", time.Minute); err != nil {
		t.Fatalf("seed: %v", err)
	}

	p, err := r.Pipe()
	if err != nil {
		t.Fatalf("pipe: %v", err)
	}
	p.AppendToList(ctx, "notalist", "x")
	if err := p.Exec(ctx); err == nil {
		t.Error("Exec reported success for a pipeline whose command failed")
	}

	// And a pipeline of reads over absent keys still succeeds.
	p, _ = r.Pipe()
	absent := p.Get(ctx, "nothing-here")
	if err := p.Exec(ctx); err != nil {
		t.Errorf("Exec on absent keys = %v, want nil", err)
	}
	if _, err := absent.Result(); !IsNotFound(err) {
		t.Errorf("absent result = %v, want not-found", err)
	}
}
