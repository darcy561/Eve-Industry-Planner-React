package plannersession

import (
	"testing"
	"time"
)

func TestReauthDeadlineFromSessionStart(t *testing.T) {
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	if got := ReauthDeadlineFromSessionStart(start); !got.Equal(start.Add(RefreshTokenTTL)) {
		t.Fatalf("deadline = %v, want %v", got, start.Add(RefreshTokenTTL))
	}
	if got := ReauthDeadlineFromSessionStart(time.Time{}); !got.IsZero() {
		t.Fatalf("zero start should give a zero deadline, got %v", got)
	}
}

func TestReauthDeadlineTakesTheEarlierOfTheTwo(t *testing.T) {
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	fromStart := start.Add(RefreshTokenTTL)

	if got := reauthDeadline(start, fromStart.Add(time.Hour)); !got.Equal(fromStart) {
		t.Fatalf("a later stored deadline must not extend the chain: got %v", got)
	}
	earlier := fromStart.Add(-time.Hour)
	if got := reauthDeadline(start, earlier); !got.Equal(earlier) {
		t.Fatalf("an earlier stored deadline must win: got %v", got)
	}
	if got := reauthDeadline(time.Time{}, earlier); !got.Equal(earlier) {
		t.Fatalf("with no start, the stored deadline applies: got %v", got)
	}
}

func TestIsReauthExpiredIsExclusiveAtTheDeadline(t *testing.T) {
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	deadline := start.Add(RefreshTokenTTL)

	if IsReauthExpired(start, time.Time{}, deadline) {
		t.Fatal("a session is still live exactly on its deadline")
	}
	if !IsReauthExpired(start, time.Time{}, deadline.Add(time.Second)) {
		t.Fatal("a session past its deadline is expired")
	}
	if IsReauthExpired(time.Time{}, time.Time{}, time.Now()) {
		t.Fatal("a session with no deadline at all never expires")
	}
}

func TestReauthRequiredAtUnixIsZeroWhenUnknown(t *testing.T) {
	if got := ReauthRequiredAtUnix(time.Time{}, time.Time{}); got != 0 {
		t.Fatalf("unknown deadline should report 0, got %d", got)
	}
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	if got := ReauthRequiredAtUnix(start, time.Time{}); got != start.Add(RefreshTokenTTL).Unix() {
		t.Fatalf("unix deadline = %d", got)
	}
}
