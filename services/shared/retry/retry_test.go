package retry

import (
	"context"
	"errors"
	"testing"
	"time"
)

var errBoom = errors.New("boom")

// alwaysRetry is the predicate for tests about the loop rather than about
// classification.
func alwaysRetry(error, AttemptContext) bool { return true }

func fastOpts(attempts int) []Option {
	return []Option{
		WithMaxAttempts(attempts),
		WithInitialDelay(time.Millisecond),
		WithMaxDelay(2 * time.Millisecond),
	}
}

func TestDo_succeedsWithoutRetrying(t *testing.T) {
	calls := 0
	err := Do(context.Background(), func(context.Context) error {
		calls++
		return nil
	}, func(error, AttemptContext) bool {
		t.Error("shouldRetry called for a successful operation")
		return false
	}, fastOpts(3)...)

	if err != nil {
		t.Fatalf("Do returned %v, want nil", err)
	}
	if calls != 1 {
		t.Fatalf("operation called %d times, want 1", calls)
	}
}

func TestDo_succeedsAfterRetryableFailures(t *testing.T) {
	calls := 0
	err := Do(context.Background(), func(context.Context) error {
		calls++
		if calls < 3 {
			return errBoom
		}
		return nil
	}, alwaysRetry, fastOpts(3)...)

	if err != nil {
		t.Fatalf("Do returned %v, want nil", err)
	}
	if calls != 3 {
		t.Fatalf("operation called %d times, want 3", calls)
	}
}

// The error a caller gets when attempts run out is the operation's own, so
// errors.Is and an area's predicates work on it without unwrapping.
func TestDo_exhaustedReturnsCause(t *testing.T) {
	calls := 0
	err := Do(context.Background(), func(context.Context) error {
		calls++
		return errBoom
	}, alwaysRetry, append(fastOpts(3), WithOperationName("labelled"))...)

	if err != errBoom {
		t.Fatalf("Do returned %v, want the cause %v unwrapped", err, errBoom)
	}
	if calls != 3 {
		t.Fatalf("operation called %d times, want 3", calls)
	}
}

// The last attempt is not offered to shouldRetry: there is no retry left to
// authorise, and an area that logs there would log a retry it never makes.
func TestDo_lastAttemptIsNotOfferedToShouldRetry(t *testing.T) {
	var seen []int
	err := Do(context.Background(), func(context.Context) error {
		return errBoom
	}, func(_ error, at AttemptContext) bool {
		seen = append(seen, at.Attempt)
		if at.MaxAttempts != 3 {
			t.Errorf("AttemptContext.MaxAttempts = %d, want 3", at.MaxAttempts)
		}
		return true
	}, fastOpts(3)...)

	if err != errBoom {
		t.Fatalf("Do returned %v, want %v", err, errBoom)
	}
	if len(seen) != 2 || seen[0] != 1 || seen[1] != 2 {
		t.Fatalf("shouldRetry saw attempts %v, want [1 2]", seen)
	}
}

func TestDo_nonRetryableReturnsImmediately(t *testing.T) {
	calls := 0
	err := Do(context.Background(), func(context.Context) error {
		calls++
		return errBoom
	}, func(error, AttemptContext) bool { return false }, fastOpts(5)...)

	if err != errBoom {
		t.Fatalf("Do returned %v, want %v", err, errBoom)
	}
	if calls != 1 {
		t.Fatalf("operation called %d times, want 1", calls)
	}
}

func TestDo_cancelledContextIsNotAttempted(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	calls := 0
	err := Do(ctx, func(context.Context) error {
		calls++
		return nil
	}, alwaysRetry, fastOpts(3)...)

	if !errors.Is(err, context.Canceled) {
		t.Fatalf("Do returned %v, want context.Canceled", err)
	}
	if calls != 0 {
		t.Fatalf("operation called %d times, want 0", calls)
	}
}

// Cancellation must end the wait rather than sleeping out the remaining backoff.
func TestDo_cancelledContextStopsBackoff(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	calls := 0
	start := time.Now()
	err := Do(ctx, func(context.Context) error {
		calls++
		cancel()
		return errBoom
	}, alwaysRetry,
		WithMaxAttempts(3),
		WithInitialDelay(30*time.Second),
		WithMaxDelay(time.Minute),
	)

	if !errors.Is(err, context.Canceled) {
		t.Fatalf("Do returned %v, want context.Canceled", err)
	}
	if calls != 1 {
		t.Fatalf("operation called %d times, want 1", calls)
	}
	if elapsed := time.Since(start); elapsed > 5*time.Second {
		t.Fatalf("Do waited %v after cancellation, want an immediate return", elapsed)
	}
}

func TestDo_zeroOptionsFallBackToDefaults(t *testing.T) {
	calls := 0
	err := Do(context.Background(), func(context.Context) error {
		calls++
		return errBoom
	}, func(_ error, at AttemptContext) bool {
		if at.MaxAttempts != DefaultConfig().MaxAttempts {
			t.Errorf("MaxAttempts = %d, want the default %d", at.MaxAttempts, DefaultConfig().MaxAttempts)
		}
		return false
	}, WithMaxAttempts(0), WithInitialDelay(0), WithMaxDelay(0))

	if err != errBoom {
		t.Fatalf("Do returned %v, want %v", err, errBoom)
	}
	if calls != 1 {
		t.Fatalf("operation called %d times, want 1", calls)
	}
}

func TestBackoff_doublesAndCaps(t *testing.T) {
	cfg := Config{InitialDelay: 100 * time.Millisecond, MaxDelay: 350 * time.Millisecond}
	want := []time.Duration{
		100 * time.Millisecond,
		200 * time.Millisecond,
		350 * time.Millisecond, // 400ms capped
		350 * time.Millisecond,
	}
	for i, w := range want {
		if got := backoff(cfg, i+1); got != w {
			t.Errorf("backoff(attempt %d) = %v, want %v", i+1, got, w)
		}
	}
}

// Jitter is off unless asked for, so adopting the engine does not change any
// existing area's timing.
func TestBackoff_noJitterByDefault(t *testing.T) {
	cfg := Config{InitialDelay: 100 * time.Millisecond, MaxDelay: time.Second}
	for range 50 {
		if got := backoff(cfg, 1); got != 100*time.Millisecond {
			t.Fatalf("backoff = %v, want exactly 100ms without jitter", got)
		}
	}
}

func TestBackoff_jitterStaysInBandAndVaries(t *testing.T) {
	cfg := Config{InitialDelay: 100 * time.Millisecond, MaxDelay: time.Second, Jitter: 0.5}
	seen := map[time.Duration]bool{}
	for range 200 {
		got := backoff(cfg, 1)
		if got < 50*time.Millisecond || got > 150*time.Millisecond {
			t.Fatalf("backoff = %v, want within ±50%% of 100ms", got)
		}
		seen[got] = true
	}
	if len(seen) < 2 {
		t.Fatal("jittered backoff produced a single value, want a spread")
	}
}

// Jitter applies after the cap, so a capped delay still spreads.
func TestBackoff_jitterSpreadsTheCap(t *testing.T) {
	cfg := Config{InitialDelay: time.Second, MaxDelay: 100 * time.Millisecond, Jitter: 0.5}
	seen := map[time.Duration]bool{}
	for range 200 {
		got := backoff(cfg, 4)
		if got < 50*time.Millisecond || got > 150*time.Millisecond {
			t.Fatalf("backoff = %v, want within ±50%% of the 100ms cap", got)
		}
		seen[got] = true
	}
	if len(seen) < 2 {
		t.Fatal("capped backoff did not jitter, want a spread")
	}
}

func TestBackoff_jitterFractionClampedAndStaysPositive(t *testing.T) {
	cfg := Config{InitialDelay: 100 * time.Millisecond, MaxDelay: time.Second, Jitter: 5}
	for range 200 {
		got := backoff(cfg, 1)
		if got < 1 || got > 200*time.Millisecond {
			t.Fatalf("backoff = %v, want a positive delay within ±100%% of 100ms", got)
		}
	}
}

// Full jitter spreads across the whole interval rather than clustering at its
// end, which is what a contended operation needs.
func TestBackoff_fullJitterSpansTheInterval(t *testing.T) {
	cfg := Config{InitialDelay: 100 * time.Millisecond, MaxDelay: time.Second, FullJitter: true}
	var low, high int
	for range 500 {
		got := backoff(cfg, 1)
		if got < 1 || got > 100*time.Millisecond {
			t.Fatalf("backoff = %v, want within (0, 100ms]", got)
		}
		if got < 50*time.Millisecond {
			low++
		} else {
			high++
		}
	}
	if low == 0 || high == 0 {
		t.Fatalf("full jitter produced %d low and %d high delays, want both halves of the interval", low, high)
	}
}

func TestBackoff_fullJitterHonoursTheCap(t *testing.T) {
	cfg := Config{InitialDelay: time.Second, MaxDelay: 10 * time.Millisecond, FullJitter: true}
	for range 200 {
		if got := backoff(cfg, 6); got < 1 || got > 10*time.Millisecond {
			t.Fatalf("backoff = %v, want within (0, 10ms]", got)
		}
	}
}

// WithJitter after WithFullJitter is the caller changing their mind, and the
// last option wins rather than both applying.
func TestWithJitter_replacesFullJitter(t *testing.T) {
	cfg := DefaultConfig()
	WithFullJitter()(&cfg)
	WithJitter(0.25)(&cfg)

	if cfg.FullJitter {
		t.Error("FullJitter still set after WithJitter, want it cleared")
	}
	if cfg.Jitter != 0.25 {
		t.Errorf("Jitter = %v, want 0.25", cfg.Jitter)
	}
}
