package redis

import (
	"context"
	"errors"
	"net"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

func TestRetryStopsAtTheFirstSuccess(t *testing.T) {
	calls := 0
	err := Retry(context.Background(), "test", func() error {
		calls++
		return nil
	})
	if err != nil {
		t.Fatalf("retry: %v", err)
	}
	if calls != 1 {
		t.Fatalf("calls = %d, want 1", calls)
	}
}

func TestRetryGivesUpAfterThreeAttempts(t *testing.T) {
	calls := 0
	cause := &net.OpError{Op: "dial", Err: errors.New("connection refused")}
	err := Retry(context.Background(), "test", func() error {
		calls++
		return cause
	})
	if calls != retryMaxAttempts {
		t.Fatalf("calls = %d, want %d", calls, retryMaxAttempts)
	}
	// The cause is returned rather than wrapped in a count, so a caller can
	// classify what failed without unwrapping.
	if !errors.Is(err, cause) {
		t.Fatalf("error = %v, want the cause", err)
	}
	if !IsUnavailableError(err) {
		t.Fatal("an exhausted retry no longer reads as unavailable")
	}
}

func TestRetryDoesNotRetryAMissingKey(t *testing.T) {
	calls := 0
	err := Retry(context.Background(), "test", func() error {
		calls++
		return redis.Nil
	})
	if !errors.Is(err, redis.Nil) {
		t.Fatalf("error = %v, want redis.Nil", err)
	}
	if calls != 1 {
		t.Fatalf("calls = %d, want 1", calls)
	}
}

func TestRetrySucceedsAfterATransientFailure(t *testing.T) {
	calls := 0
	err := Retry(context.Background(), "test", func() error {
		calls++
		if calls == 1 {
			return &net.OpError{Op: "read", Err: errors.New("connection reset")}
		}
		return nil
	})
	if err != nil {
		t.Fatalf("retry: %v", err)
	}
	if calls != 2 {
		t.Fatalf("calls = %d, want 2", calls)
	}
}

func TestRetryHonoursACancelledContext(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	calls := 0
	err := Retry(ctx, "test", func() error {
		calls++
		return nil
	})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("error = %v, want context.Canceled", err)
	}
	if calls != 0 {
		t.Fatalf("calls = %d, want the operation not to run", calls)
	}
}

func TestRetryStopsSleepingWhenTheContextEnds(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	start := time.Now()
	err := Retry(ctx, "test", func() error {
		return &net.OpError{Op: "dial", Err: errors.New("connection refused")}
	})
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("error = %v, want context.DeadlineExceeded", err)
	}
	if elapsed := time.Since(start); elapsed > time.Second {
		t.Fatalf("retry slept through cancellation for %v", elapsed)
	}
}

func TestClassification(t *testing.T) {
	opErr := &net.OpError{Op: "dial", Err: errors.New("connection refused")}

	cases := []struct {
		name        string
		err         error
		retryable   bool
		unavailable bool
	}{
		{"nil", nil, false, false},
		{"missing key", redis.Nil, false, false},
		{"cancelled", context.Canceled, false, false},
		{"deadline", context.DeadlineExceeded, false, false},
		{"closed client", redis.ErrClosed, true, true},
		{"network", opErr, true, true},
		{"wrapped network", errors.Join(errors.New("get key"), opErr), true, true},
		{"no client", ErrNoClient, false, true},
		{"loading dataset", errors.New("LOADING Redis is loading the dataset in memory"), true, false},
		{"wrong type", errors.New("WRONGTYPE Operation against a key holding the wrong kind of value"), false, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsRetryableError(tc.err); got != tc.retryable {
				t.Errorf("IsRetryableError = %v, want %v", got, tc.retryable)
			}
			if got := IsUnavailableError(tc.err); got != tc.unavailable {
				t.Errorf("IsUnavailableError = %v, want %v", got, tc.unavailable)
			}
		})
	}
}
