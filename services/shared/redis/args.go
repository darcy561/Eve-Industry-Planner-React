package redis

import (
	"errors"

	"github.com/redis/go-redis/v9"
)

// Empty-input guards run before the connection is asked for, so a call with
// nothing to do succeeds without one while a caller mistake is reported either
// way.

// ErrEmptyKey reports a call made with no key. It is a caller mistake rather
// than a missing value, so it is not [redis.Nil].
var ErrEmptyKey = errors.New("redis: key is required")

// ErrEmptyPrefix reports a scan with no prefix. An empty prefix would walk the
// whole keyspace, letting one namespace reach another's keys.
var ErrEmptyPrefix = errors.New("redis: scan prefix is required")

// ErrNotFound reports a key that does not exist. It is the driver's own
// sentinel, so a caller may test it with [errors.Is] without importing the
// driver, and a value read through either name matches.
var ErrNotFound = redis.Nil

// IsNotFound reports whether err means the key does not exist, rather than that
// the read failed.
func IsNotFound(err error) bool { return errors.Is(err, ErrNotFound) }

// requireKey rejects an empty key.
func requireKey(key string) error {
	if key == "" {
		return ErrEmptyKey
	}
	return nil
}
