package redis

// The dataset keyspace: what each key is called and how long it lives. Pinned to
// literals, because a test that builds its expectation from the same constant it
// is checking cannot catch that constant being wrong.

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/testing/redisfake"
)

// Pinned to literals: the equivalence tests read the same constants they check,
// so only this can catch a constant itself being wrong.
func TestDatasetKeyLifetimes(t *testing.T) {
	for name, tc := range map[string]struct {
		got  time.Duration
		want time.Duration
	}{
		"market price":    {ttlMarketPrice, 24 * time.Hour},
		"industry system": {ttlIndustrySystem, 24 * time.Hour},
		"etag":            {ttlETag, 24 * time.Hour},
		"next refresh":    {ttlNextRefresh, 48 * time.Hour},
		"last updated":    {ttlLastUpdated, 24 * time.Hour},
	} {
		t.Run(name, func(t *testing.T) {
			if tc.got != tc.want {
				t.Errorf("ttl = %v, want %v", tc.got, tc.want)
			}
		})
	}
}

func TestDatasetCacheLifetimesOutliveTheirRefreshCadence(t *testing.T) {
	// Every cron that rewrites one of these runs at least hourly.
	const slowestRefresh = time.Hour

	for name, ttl := range map[string]time.Duration{
		"market price":    ttlMarketPrice,
		"industry system": ttlIndustrySystem,
		"etag":            ttlETag,
	} {
		t.Run(name, func(t *testing.T) {
			if ttl <= slowestRefresh {
				t.Errorf("ttl %v does not outlive the %v refresh cadence", ttl, slowestRefresh)
			}
		})
	}
}

func TestDatasetWritesCarryTheirKeyKindsLifetime(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)

	if err := handle(t, fake).Cache(DatasetMarketPrices).PutEntry(ctx, 34, map[string]int{"a": 1}); err != nil {
		t.Fatalf("put entry: %v", err)
	}
	if got := fake.Server.TTL("esi:market_prices:34"); got != ttlMarketPrice {
		t.Fatalf("ttl = %v, want %v", got, ttlMarketPrice)
	}
}
