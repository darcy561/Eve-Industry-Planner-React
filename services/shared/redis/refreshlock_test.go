package redis

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/testing/redisfake"
)

func TestRefreshLockKeyMatches(t *testing.T) {
	// The lock keys the worker builds by hand today.
	for _, tc := range []struct {
		dataset Dataset
		want    string
	}{
		{DatasetMarketPrices.Dataset(), "esi:market_prices:refresh_lock"},
		{DatasetIndustrySystems.Dataset(), "esi:industry_systems:refresh_lock"},
		{RegionMarketOrdersDataset(10000002), "esi:market_orders:region:10000002:refresh_lock"},
	} {
		if got := tc.dataset.refreshLockKey(); got != tc.want {
			t.Errorf("key = %q, want %q", got, tc.want)
		}
	}
}

func TestRefreshLockExcludesASecondHolder(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	release, held := r.AcquireRefresh(ctx, DatasetMarketPrices.Dataset())
	if !held {
		t.Fatal("first acquire did not take the lock")
	}
	defer release()

	if _, held := r.AcquireRefresh(ctx, DatasetMarketPrices.Dataset()); held {
		t.Fatal("second acquire took a lock already held")
	}
}

func TestRefreshLockIsPerDataset(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	release, held := r.AcquireRefresh(ctx, DatasetMarketPrices.Dataset())
	if !held {
		t.Fatal("acquire did not take the lock")
	}
	defer release()

	otherRelease, held := r.AcquireRefresh(ctx, DatasetIndustrySystems.Dataset())
	if !held {
		t.Fatal("a different dataset was blocked by an unrelated lock")
	}
	otherRelease()
}

func TestRefreshLockReleaseFreesIt(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	release, held := r.AcquireRefresh(ctx, DatasetMarketPrices.Dataset())
	if !held {
		t.Fatal("acquire did not take the lock")
	}
	release()

	again, held := r.AcquireRefresh(ctx, DatasetMarketPrices.Dataset())
	if !held {
		t.Fatal("lock was not free after release")
	}
	again()
}

// Pinned to a literal: asserting the write against the same constant that set
// it cannot catch the constant itself being wrong.
func TestRefreshLockLifetime(t *testing.T) {
	if ttlRefreshLock != 300*time.Second {
		t.Errorf("ttl = %v, want 5m", ttlRefreshLock)
	}
}

func TestRefreshLockCarriesItsLifetime(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	release, held := r.AcquireRefresh(ctx, DatasetMarketPrices.Dataset())
	if !held {
		t.Fatal("acquire did not take the lock")
	}
	defer release()

	if got := fake.Server.TTL(DatasetMarketPrices.Dataset().refreshLockKey()); got != ttlRefreshLock {
		t.Fatalf("ttl = %v, want %v", got, ttlRefreshLock)
	}
}

// The defect this slice fixes. A refresh that outran the lock's TTL used to
// release with an unconditional DEL, which freed a lock the next refresher was
// already holding — so two refreshers ran at once from then on.
func TestRefreshLockReleaseDoesNotFreeAnotherHoldersLock(t *testing.T) {
	ctx := context.Background()
	key := DatasetMarketPrices.Dataset().refreshLockKey()

	t.Run("the rewrite leaves it held", func(t *testing.T) {
		fake := redisfake.New(t)
		r := handle(t, fake)

		release, held := r.AcquireRefresh(ctx, DatasetMarketPrices.Dataset())
		if !held {
			t.Fatal("acquire did not take the lock")
		}

		// The lock lapses and a second refresher takes it.
		fake.Server.Del(key)
		second, held := r.AcquireRefresh(ctx, DatasetMarketPrices.Dataset())
		if !held {
			t.Fatal("second refresher could not take the lapsed lock")
		}
		defer second()

		// The first refresher finishes and releases late.
		release()

		if !fake.Server.Exists(key) {
			t.Fatal("late release freed the second refresher's lock")
		}
	})

}
