package redis

import (
	"context"

	"github.com/redis/go-redis/v9"
)

// Pipeline batches commands into one round trip.
//
// Queue commands, then Exec, then read each result. A result read before Exec
// is not populated. Exec reports the first error other than a missing key,
// which each result reports for itself.
type Pipeline struct {
	pipe redis.Pipeliner
}

// Pipe starts a pipeline, or reports [ErrNoClient] when the handle has no
// connection.
func (r *Redis) Pipe() (*Pipeline, error) {
	c, err := r.client()
	if err != nil {
		return nil, err
	}
	return &Pipeline{pipe: c.Pipeline()}, nil
}

// StringResult is a queued command answering with a string.
type StringResult struct{ cmd *redis.StringCmd }

// Result returns the value, or ErrNotFound when the key does not exist.
func (s *StringResult) Result() (string, error) { return s.cmd.Result() }

// IntResult is a queued command answering with a count.
type IntResult struct{ cmd *redis.IntCmd }

// Result returns the count and any error the command reported.
func (i *IntResult) Result() (int64, error) { return i.cmd.Result() }

// Val returns the count, treating an error as zero.
func (i *IntResult) Val() int64 { return i.cmd.Val() }

// FieldsResult is a queued command answering with a hash.
type FieldsResult struct{ cmd *redis.MapStringStringCmd }

// Result returns the fields and any error the command reported. A hash that
// does not exist reads as empty rather than as an error.
func (f *FieldsResult) Result() (map[string]string, error) { return f.cmd.Result() }

// Get queues a read of one key.
func (p *Pipeline) Get(ctx context.Context, key string) *StringResult {
	return &StringResult{cmd: p.pipe.Get(ctx, key)}
}

// Fields queues a read of every field in a hash.
func (p *Pipeline) Fields(ctx context.Context, key string) *FieldsResult {
	return &FieldsResult{cmd: p.pipe.HGetAll(ctx, key)}
}

// Delete queues the removal of keys.
func (p *Pipeline) Delete(ctx context.Context, keys ...string) {
	if len(keys) > 0 {
		p.pipe.Del(ctx, keys...)
	}
}

// Length queues a read of a list's length.
func (p *Pipeline) Length(ctx context.Context, key string) *IntResult {
	return &IntResult{cmd: p.pipe.LLen(ctx, key)}
}

// RemoveFromList queues the removal of count occurrences of value from a list.
func (p *Pipeline) RemoveFromList(ctx context.Context, key string, count int64, value any) *IntResult {
	return &IntResult{cmd: p.pipe.LRem(ctx, key, count, value)}
}

// AppendToList queues an append to the tail of a list.
func (p *Pipeline) AppendToList(ctx context.Context, key string, values ...any) {
	if len(values) > 0 {
		p.pipe.RPush(ctx, key, values...)
	}
}

// CountScored queues a read of how many members a sorted set holds.
func (p *Pipeline) CountScored(ctx context.Context, key string) *IntResult {
	return &IntResult{cmd: p.pipe.ZCard(ctx, key)}
}

// DropScoredRange queues the removal of members whose score falls in [min, max].
func (p *Pipeline) DropScoredRange(ctx context.Context, key, min, max string) *IntResult {
	return &IntResult{cmd: p.pipe.ZRemRangeByScore(ctx, key, min, max)}
}

// Exec sends the queued commands. A missing key is not an error here — each
// result reports that for itself — so a caller that only queued reads can
// ignore the error and read the results.
func (p *Pipeline) Exec(ctx context.Context) error {
	_, err := p.pipe.Exec(ctx)
	if err != nil && !IsNotFound(err) {
		return err
	}
	return nil
}
