package esiclient

import (
	"errors"
	"fmt"
	"time"
)

// Kind says why a call was turned away, which decides both what the caller does
// and when it should come back.
type Kind uint8

const (
	// KindQueued means the bucket is healthy and callers are ahead in the queue.
	// The wait drains at burst pace.
	KindQueued Kind = iota
	// KindDecelerating means the bucket is low and the interval is stretching.
	// Coming back at the next slot would only meet the same wait, so RetryAfter
	// is when the bank recovers.
	KindDecelerating
	// KindGated means the bucket is spent or 429'd.
	KindGated
	// KindBudget means the caller's own deadline cannot cover its slot.
	KindBudget
	// KindErrorLimit means the fleet-wide guard on non-2xx/3xx responses tripped.
	KindErrorLimit
	// KindDowntime means Tranquility is observed unavailable.
	KindDowntime
	// KindDiscovering means another caller is probing this bucket's allowance.
	KindDiscovering
)

func (k Kind) String() string {
	switch k {
	case KindQueued:
		return "queued"
	case KindDecelerating:
		return "decelerating"
	case KindGated:
		return "gated"
	case KindBudget:
		return "task_budget"
	case KindErrorLimit:
		return "error_limit"
	case KindDowntime:
		return "downtime"
	case KindDiscovering:
		return "discovering"
	default:
		return fmt.Sprintf("kind(%d)", uint8(k))
	}
}

// RateLimitError is a refusal to make a call now, carrying when to try again.
// Every one of these is retryable: the question is only when.
type RateLimitError struct {
	Kind       Kind
	RetryAfter time.Time
	Bucket     Bucket
	Headroom   Headroom
	Reason     string
	// Bound is which term held the call back, where the Kind alone does not say.
	Bound Bound
}

func (e *RateLimitError) Error() string {
	return fmt.Sprintf("esi rate limit [%s] %s (bucket %s, retry after %s)",
		e.Kind, e.Reason, e.Bucket, e.RetryAfter.UTC().Format(time.RFC3339Nano))
}

// RetryIn is how long from now the caller should wait, never negative.
func (e *RateLimitError) RetryIn() time.Duration {
	return max(time.Until(e.RetryAfter), 0)
}

// AsRateLimit extracts a *RateLimitError from err if there is one.
func AsRateLimit(err error) (*RateLimitError, bool) {
	return errors.AsType[*RateLimitError](err)
}

// IsRateLimit reports whether err is a refusal from this package.
func IsRateLimit(err error) bool {
	_, ok := AsRateLimit(err)
	return ok
}

// Bound says which term held a call back, for refusals where more than one term
// could have. A bucket that is simply empty, a floor promised to other classes,
// and an endpoint's own share are three different operational situations that
// look identical from the Kind alone.
type Bound uint8

const (
	// BoundNone is a refusal that names no term. It is also what a reply from a
	// replica running an older script reads as, so it means "not stated" rather
	// than "nothing was binding".
	BoundNone Bound = iota
	// BoundBucket means the bucket's own occupancy was the limit: it is spent,
	// and no share or floor came into it.
	BoundBucket
	// BoundFloor means the bucket had tokens but they are owed to classes that
	// have not spent their floor. Raising this class's floor, or lowering
	// another's, is what moves it.
	BoundFloor
	// BoundShare means the endpoint's max_share was reached while the bucket
	// still had room. It is a per-endpoint cap, so other endpoints in the same
	// bucket are unaffected.
	BoundShare
)

func (b Bound) String() string {
	switch b {
	case BoundBucket:
		return "bucket"
	case BoundFloor:
		return "class_floor"
	case BoundShare:
		return "endpoint_share"
	default:
		return "unstated"
	}
}
