package redis

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/testing/redisfake"
)

func TestListHeadAppendAndLength(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	// An empty list has no head, and that is not an error: a waitlist nobody
	// is on reads the same as one that was never created.
	if head, err := r.HeadOfList(ctx, "w"); err != nil || head != "" {
		t.Fatalf("empty head = %q, %v; want \"\", nil", head, err)
	}

	for _, member := range []string{"first", "second"} {
		if err := r.AppendToList(ctx, "w", member, time.Minute); err != nil {
			t.Fatalf("append %s: %v", member, err)
		}
	}

	if head, err := r.HeadOfList(ctx, "w"); err != nil || head != "first" {
		t.Errorf("head = %q, %v; want first — the queue is not in arrival order", head, err)
	}
	if n, err := r.ListLength(ctx, "w"); err != nil || n != 2 {
		t.Errorf("length = %d, %v; want 2", n, err)
	}
	if got := fake.Server.TTL("w"); got != time.Minute {
		t.Errorf("list TTL = %v, want 1m", got)
	}
}

func TestRemoveFromListHonoursItsCount(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	for range 3 {
		if err := r.AppendToList(ctx, "w", "dup", time.Minute); err != nil {
			t.Fatalf("append: %v", err)
		}
	}

	// One means one: a waitlist dedupe must not empty the queue.
	if removed, err := r.RemoveFromList(ctx, "w", 1, "dup"); err != nil || removed != 1 {
		t.Fatalf("removed = %d, %v; want 1", removed, err)
	}
	if n, _ := r.ListLength(ctx, "w"); n != 2 {
		t.Errorf("length after removing one = %d, want 2", n)
	}

	// Zero means all.
	if removed, err := r.RemoveFromList(ctx, "w", 0, "dup"); err != nil || removed != 2 {
		t.Errorf("removed = %d, %v; want 2", removed, err)
	}
}

func TestScoreOfDistinguishesAbsentFromZero(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	if _, present, err := r.ScoreOf(ctx, "z", "nobody"); err != nil || present {
		t.Fatalf("absent member = present %v, %v; want false, nil", present, err)
	}

	// A member scored zero is present, which is why the bool exists.
	if err := r.PutScored(ctx, "z", "zero", 0, time.Minute); err != nil {
		t.Fatalf("seed: %v", err)
	}
	score, present, err := r.ScoreOf(ctx, "z", "zero")
	if err != nil || !present || score != 0 {
		t.Errorf("zero-scored member = %v, present %v, %v; want 0, true, nil", score, present, err)
	}
}

func TestRemoveScoredCountsWhatWasPresent(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	for _, member := range []string{"a", "b"} {
		if err := r.PutScored(ctx, "z", member, 1, time.Minute); err != nil {
			t.Fatalf("seed: %v", err)
		}
	}

	removed, err := r.RemoveScored(ctx, "z", "a", "missing")
	if err != nil || removed != 1 {
		t.Errorf("removed = %d, %v; want 1 — only the member that was there", removed, err)
	}
	if n, _ := r.RemoveScored(ctx, "z"); n != 0 {
		t.Errorf("removing nothing = %d, want 0", n)
	}
}

func TestAddScoredReportsWhetherTheMemberWasNew(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	added, err := r.AddScored(ctx, "z", "sess", 10, time.Minute)
	if err != nil || !added {
		t.Fatalf("first add = %v, %v; want true", added, err)
	}
	// A re-add moves the score rather than counting again, which is how a
	// viewer refreshing presence is told apart from a viewer arriving.
	added, err = r.AddScored(ctx, "z", "sess", 20, time.Minute)
	if err != nil || added {
		t.Errorf("second add = %v, %v; want false", added, err)
	}
	if score, _, _ := r.ScoreOf(ctx, "z", "sess"); score != 20 {
		t.Errorf("score after re-add = %v, want 20", score)
	}
}

func TestGetIntReportsAbsentSeparatelyFromZero(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	if _, err := r.GetInt(ctx, "counter"); !IsNotFound(err) {
		t.Fatalf("absent counter = %v, want not-found", err)
	}
	if err := r.PutString(ctx, "counter", "0", time.Minute); err != nil {
		t.Fatalf("seed: %v", err)
	}
	if n, err := r.GetInt(ctx, "counter"); err != nil || n != 0 {
		t.Errorf("stored zero = %d, %v; want 0, nil", n, err)
	}
}

// The count is what the operator CLI reports after clearing a bucket's
// allowance, so a wrong one is a wrong answer to a person.
func TestRemoveFieldsCountsWhatWasPresent(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := NewRedis(fake.Client)

	if err := r.PutFields(ctx, "h", map[string]any{"limit": "1", "window": "2"}, time.Minute); err != nil {
		t.Fatalf("seed: %v", err)
	}

	removed, err := r.RemoveFields(ctx, "h", "limit", "absent")
	if err != nil || removed != 1 {
		t.Errorf("removed = %d, %v; want 1 — only the field that was there", removed, err)
	}
	if n, err := r.RemoveFields(ctx, "h"); err != nil || n != 0 {
		t.Errorf("removing no fields = %d, %v; want 0, nil", n, err)
	}

	// The fields not named survive.
	fields, err := r.Fields(ctx, "h")
	if err != nil || fields["window"] != "2" {
		t.Errorf("remaining fields = %v, %v", fields, err)
	}
}
