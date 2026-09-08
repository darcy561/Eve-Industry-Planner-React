package apimetrics

import (
	"context"
	"fmt"
	"testing"
	"time"

	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/redisfake"
)

func handle(t *testing.T, fake *redisfake.Redis) *eipredis.Redis {
	t.Helper()
	r := eipredis.NewRedis(fake.Client)
	return r
}

func TestDistinctSeriesKeysMatchTheOnesInUse(t *testing.T) {
	at := time.Date(2026, 9, 8, 14, 30, 0, 0, time.UTC)

	for name, tc := range map[string]struct {
		series DistinctSeries
		want   string
	}{
		"auth sessions": {authSessionAccounts, "apimetrics:auth_sessions_distinct:hll:2026090814"},
		"sso refresh":   {ssoRefreshCharacters, "apimetrics:sso_refresh_distinct:hll:2026090814"},
	} {
		t.Run(name, func(t *testing.T) {
			if got := tc.series.hourKey(at); got != tc.want {
				t.Errorf("key = %q, want %q", got, tc.want)
			}
		})
	}
}

// An instant anywhere in the hour lands in that hour's bucket.
func TestDistinctSeriesBucketsByHour(t *testing.T) {
	hour := authSessionAccounts.hourKey(time.Date(2026, 9, 8, 14, 0, 0, 0, time.UTC))
	for _, at := range []time.Time{
		time.Date(2026, 9, 8, 14, 0, 0, 0, time.UTC),
		time.Date(2026, 9, 8, 14, 59, 59, 999_999_999, time.UTC),
	} {
		if got := authSessionAccounts.hourKey(at); got != hour {
			t.Errorf("%v landed in %q, want %q", at, got, hour)
		}
	}
	next := authSessionAccounts.hourKey(time.Date(2026, 9, 8, 15, 0, 0, 0, time.UTC))
	if next == hour {
		t.Fatal("the next hour shares a bucket with this one")
	}
}

func TestDistinctSeriesCountsAcrossHours(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	// Seed three hours by hand, so the count has to merge them rather than
	// read one.
	now := time.Now().UTC().Truncate(time.Hour)
	for i, accounts := range [][]string{{"a", "b"}, {"b", "c"}, {"d"}} {
		key := authSessionAccounts.hourKey(now.Add(-time.Duration(i) * time.Hour))
		for _, account := range accounts {
			if err := r.AddDistinct(ctx, key, time.Hour, account); err != nil {
				t.Fatalf("seed: %v", err)
			}
		}
	}

	// a, b, c, d across three hours; b appears twice and is counted once.
	got, err := authSessionAccounts.Count(ctx, r, 3)
	if err != nil {
		t.Fatalf("count: %v", err)
	}
	if got != 4 {
		t.Fatalf("count = %d, want 4", got)
	}

	// A shorter window sees fewer hours.
	got, err = authSessionAccounts.Count(ctx, r, 1)
	if err != nil {
		t.Fatalf("count: %v", err)
	}
	if got != 2 {
		t.Fatalf("count over one hour = %d, want 2", got)
	}
}

func TestDistinctSeriesRecordAndCount(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	for _, account := range []string{"a", "b", "a"} {
		if err := authSessionAccounts.Record(ctx, r, account); err != nil {
			t.Fatalf("record: %v", err)
		}
	}

	got, err := authSessionAccounts.Count(ctx, r, 1)
	if err != nil {
		t.Fatalf("count: %v", err)
	}
	if got != 2 {
		t.Fatalf("count = %d, want 2", got)
	}
}

func TestDistinctSeriesCarriesItsRetention(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	for name, tc := range map[string]struct {
		series DistinctSeries
		want   time.Duration
	}{
		// Each series keeps a little more than the longest window it is asked
		// for: 720h for accounts, 168h for characters.
		"auth sessions": {authSessionAccounts, 35 * 24 * time.Hour},
		"sso refresh":   {ssoRefreshCharacters, 8 * 24 * time.Hour},
	} {
		t.Run(name, func(t *testing.T) {
			if err := tc.series.Record(ctx, r, "value"); err != nil {
				t.Fatalf("record: %v", err)
			}
			key := tc.series.hourKey(time.Now())
			if got := fake.Server.TTL(key); got != tc.want {
				t.Fatalf("ttl = %v, want %v", got, tc.want)
			}
		})
	}
}

// Retention must outlive the longest window the series is asked for, or the
// oldest hours of that window are gone before the gauge reads them.
func TestDistinctRetentionOutlivesItsLongestWindow(t *testing.T) {
	for name, tc := range map[string]struct {
		series      DistinctSeries
		longestHour int
	}{
		"auth sessions": {authSessionAccounts, 720},
		"sso refresh":   {ssoRefreshCharacters, 168},
	} {
		t.Run(name, func(t *testing.T) {
			window := time.Duration(tc.longestHour) * time.Hour
			if tc.series.retention <= window {
				t.Errorf("retention %v does not outlive the %v window", tc.series.retention, window)
			}
		})
	}
}

func TestDistinctSeriesEmptyInputs(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	if err := authSessionAccounts.Record(ctx, r, ""); err != nil {
		t.Fatalf("recording nothing: %v", err)
	}
	if got, err := authSessionAccounts.Count(ctx, r, 0); err != nil || got != 0 {
		t.Fatalf("counting no hours = %d, %v", got, err)
	}
	if keys := fake.Server.Keys(); len(keys) != 0 {
		t.Fatalf("an empty value wrote %v", keys)
	}
}

// The merge needs somewhere to put its intermediate result, and it must not be
// a key another caller is using — two replicas scrape at the same moment.
func TestDistinctCountLeavesNoScratchBehind(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	for i := range 3 {
		key := authSessionAccounts.hourKey(time.Now().Add(-time.Duration(i) * time.Hour))
		if err := r.AddDistinct(ctx, key, time.Hour, fmt.Sprint(i)); err != nil {
			t.Fatalf("seed: %v", err)
		}
	}

	if _, err := authSessionAccounts.Count(ctx, r, 3); err != nil {
		t.Fatalf("count: %v", err)
	}

	for _, key := range fake.Server.Keys() {
		if len(key) >= 11 && key[:11] == "eip:scratch" {
			t.Fatalf("count left %q behind", key)
		}
	}
}
