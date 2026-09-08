package redis

import (
	"context"
	"errors"
	"net"
	"strings"
	"time"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/retry"

	"github.com/redis/go-redis/v9"
)

const (
	retryMaxAttempts  = 3
	retryInitialDelay = 100 * time.Millisecond
	retryMaxDelay     = 2 * time.Second
)

// Retry runs operation with exponential backoff (3 attempts, 100ms → 2s),
// retrying what [IsRetryableError] accepts. operationName labels the logs; the
// error returned is the Redis failure itself.
func Retry(ctx context.Context, operationName string, operation func() error) error {
	opName := operationName
	if opName == "" {
		opName = "Redis operation"
	}

	attempts := 0
	err := retry.Do(ctx,
		func(context.Context) error {
			attempts++
			return operation()
		},
		func(err error, at retry.AttemptContext) bool {
			if !IsRetryableError(err) {
				return false
			}
			logs.WarnCtx(ctx, "Redis operation failed, retrying",
				"operation", opName,
				"attempt", at.Attempt,
				"max_attempts", at.MaxAttempts,
				"error", err)
			return true
		},
		retry.WithMaxAttempts(retryMaxAttempts),
		retry.WithInitialDelay(retryInitialDelay),
		retry.WithMaxDelay(retryMaxDelay),
		retry.WithOperationName(opName),
	)

	switch {
	case err != nil:
		logs.ErrorCtx(ctx, "Redis operation failed",
			"operation", opName, "attempts", attempts, "error", err)
	case attempts > 1:
		logs.InfoCtx(ctx, "Redis operation succeeded after retry",
			"operation", opName, "attempts", attempts)
	}
	return err
}

// isReachabilityFailure answers what both predicates agree on: whether err is
// the connection failing rather than the server answering. ok false means each
// falls through to the states only it cares about.
func isReachabilityFailure(err error) (failed, ok bool) {
	switch {
	case err == nil:
		return false, true
	// A missing key and a cancelled request are answers, not failures.
	case errors.Is(err, redis.Nil),
		errors.Is(err, context.Canceled),
		errors.Is(err, context.DeadlineExceeded):
		return false, true
	case errors.Is(err, redis.ErrClosed):
		return true, true
	}
	if _, isNet := errors.AsType[net.Error](err); isNet {
		return true, true
	}
	if _, isOp := errors.AsType[*net.OpError](err); isOp {
		return true, true
	}
	return false, false
}

// messageNames reports whether err's text contains any of states. It is the
// last resort for conditions a server reports only in prose.
func messageNames(err error, states ...string) bool {
	msg := strings.ToLower(err.Error())
	for _, state := range states {
		if strings.Contains(msg, state) {
			return true
		}
	}
	return false
}

// IsRetryableError reports whether err is a transient failure suitable for
// Retry. redis.Nil is an answer, not a failure, and is never retryable.
func IsRetryableError(err error) bool {
	if failed, ok := isReachabilityFailure(err); ok {
		return failed
	}
	return messageNames(err,
		"loading the dataset in memory",
		"connection pool timeout",
		"broken pipe")
}

// IsUnavailableError reports whether Redis could not be reached, so a caller
// can degrade rather than fail.
func IsUnavailableError(err error) bool {
	// A handle that was never given a connection is unreachable by definition,
	// but retrying it will never help.
	if errors.Is(err, ErrNoClient) {
		return true
	}
	if failed, ok := isReachabilityFailure(err); ok {
		return failed
	}
	return messageNames(err,
		"dial tcp",
		"no such host",
		"connection refused",
		"connection reset",
		"i/o timeout")
}
