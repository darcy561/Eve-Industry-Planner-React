package redis

import (
	"context"
	"time"
)

// Cardinality counts distinct values approximately, in constant space, using
// Redis HyperLogLog. The count carries a small error and cannot be reversed
// into the values that produced it.

// AddDistinct records that values were seen under key, and applies the key's
// lifetime. Empty values are skipped: an absent id is not a distinct one, and
// counting it would inflate every window it appears in.
func (r *Redis) AddDistinct(ctx context.Context, key string, ttl time.Duration, values ...string) error {
	members := make([]any, 0, len(values))
	for _, value := range values {
		if value != "" {
			members = append(members, value)
		}
	}
	if len(members) == 0 {
		return nil
	}
	c, err := r.client()
	if err != nil {
		return err
	}

	if err := c.PFAdd(ctx, key, members...).Err(); err != nil {
		return err
	}
	return r.expire(ctx, key, ttl)
}

// CountDistinct estimates how many distinct values were recorded across keys.
//
// Merging several keys needs somewhere to put the result, so this writes a
// scratch key unique to the call and removes it — a shared one would be
// corrupted by a concurrent count.
func (r *Redis) CountDistinct(ctx context.Context, keys ...string) (uint64, error) {
	if len(keys) == 0 {
		return 0, nil
	}
	c, err := r.client()
	if err != nil {
		return 0, err
	}

	if len(keys) == 1 {
		count, err := c.PFCount(ctx, keys[0]).Result()
		return uint64(count), err
	}

	scratch := scratchKey("pfmerge")
	// Deleted below, and expiring on its own if this process does not get that
	// far — a unique key that is never cleaned up is one leaked per lost call.
	defer func() {
		// Detached: the delete is owed even if the count's context ended.
		_, _ = r.Delete(context.WithoutCancel(ctx), scratch)
	}()

	if err := c.PFMerge(ctx, scratch, keys...).Err(); err != nil {
		return 0, err
	}
	if err := r.expire(ctx, scratch, ttlScratch); err != nil {
		return 0, err
	}

	count, err := c.PFCount(ctx, scratch).Result()
	return uint64(count), err
}
