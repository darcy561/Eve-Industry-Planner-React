package redis

import (
	"context"
	"time"
)

// Queue is the list operations the waitlists need. A list is ordered by
// insertion, so the head is the longest-waiting entry.

// HeadOfList returns the first entry, or "" when the list is empty.
func (r *Redis) HeadOfList(ctx context.Context, key string) (string, error) {
	c, err := r.client()
	if err != nil {
		return "", err
	}
	value, err := c.LIndex(ctx, key, 0).Result()
	if IsNotFound(err) {
		return "", nil
	}
	return value, err
}

// AppendToList adds value to the tail.
func (r *Redis) AppendToList(ctx context.Context, key string, value any, ttl time.Duration) error {
	c, err := r.client()
	if err != nil {
		return err
	}
	if err := c.RPush(ctx, key, value).Err(); err != nil {
		return err
	}
	return r.expire(ctx, key, ttl)
}

// RemoveFromList removes up to count occurrences of value from the head,
// reporting how many went. A count of 0 removes every occurrence.
func (r *Redis) RemoveFromList(ctx context.Context, key string, count int64, value any) (int64, error) {
	c, err := r.client()
	if err != nil {
		return 0, err
	}
	return c.LRem(ctx, key, count, value).Result()
}

// ListLength reports how many entries a list holds.
func (r *Redis) ListLength(ctx context.Context, key string) (int64, error) {
	c, err := r.client()
	if err != nil {
		return 0, err
	}
	return c.LLen(ctx, key).Result()
}

// ScoreOf returns a member's score, and false when the set does not hold it.
func (r *Redis) ScoreOf(ctx context.Context, key, member string) (float64, bool, error) {
	c, err := r.client()
	if err != nil {
		return 0, false, err
	}
	score, err := c.ZScore(ctx, key, member).Result()
	if IsNotFound(err) {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}
	return score, true, nil
}

// RemoveScored removes members from a sorted set, reporting how many were
// present.
func (r *Redis) RemoveScored(ctx context.Context, key string, members ...string) (int64, error) {
	if len(members) == 0 {
		return 0, nil
	}
	c, err := r.client()
	if err != nil {
		return 0, err
	}
	args := make([]any, len(members))
	for i, m := range members {
		args[i] = m
	}
	return c.ZRem(ctx, key, args...).Result()
}
