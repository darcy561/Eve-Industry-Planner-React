package mongo

import (
	"context"
	"errors"
	"strings"
	"time"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/retry"

	"go.mongodb.org/mongo-driver/v2/mongo"
)

const (
	retryMaxAttempts  = 3
	retryInitialDelay = 100 * time.Millisecond
	retryMaxDelay     = 2 * time.Second
)

// Retry runs operation with exponential backoff (3 attempts, 100ms → 2s),
// retrying what [IsRetryableMongoError] accepts. operationName labels the logs
// (empty → "MongoDB operation"); the error returned is the Mongo failure itself.
func Retry(ctx context.Context, operationName string, operation func() error) error {
	opName := operationName
	if opName == "" {
		opName = "MongoDB operation"
	}

	attempts := 0
	refused := false

	// refuse reports whether err ends the operation rather than earning another
	// attempt, and logs it once. The engine does not consult the predicate on the
	// last attempt, so a failure there is classified after Do returns instead.
	refuse := func(err error) bool {
		if IsRetryableMongoError(err) {
			return false
		}
		refused = true
		// A missing document is an answer the caller asked for, not a failure.
		if !errors.Is(err, mongo.ErrNoDocuments) {
			logs.ErrorCtx(ctx, "MongoDB operation failed - non-retryable error",
				"operation", opName,
				"error", err)
		}
		return true
	}

	err := retry.Do(ctx,
		func(context.Context) error {
			attempts++
			return operation()
		},
		func(err error, at retry.AttemptContext) bool {
			if refuse(err) {
				return false
			}
			logs.WarnCtx(ctx, "MongoDB operation failed, retrying",
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
	case err == nil:
		if attempts > 1 {
			logs.InfoCtx(ctx, "MongoDB operation succeeded after retry",
				"operation", opName,
				"attempt", attempts)
		}
	// A cancelled context is the caller giving up, and Do reports it in place of
	// any operation error.
	case errors.Is(err, context.Canceled), errors.Is(err, context.DeadlineExceeded):
	case !refused && !refuse(err):
		logs.ErrorCtx(ctx, "MongoDB operation failed - all retries exhausted",
			"operation", opName,
			"attempts", attempts,
			"error", err)
	}
	return err
}

// IsRetryableMongoError reports whether err is a transient Mongo / network failure suitable for Retry.
// Prefers driver helpers (IsNetworkError / IsTimeout); keeps a narrow string fallback for SDAM messages.
func IsRetryableMongoError(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, context.Canceled) {
		return false
	}
	if errors.Is(err, mongo.ErrNoDocuments) || errors.Is(err, mongo.ErrNilDocument) {
		return false
	}
	if errors.Is(err, mongo.ErrClientDisconnected) {
		return true
	}
	if mongo.IsNetworkError(err) || mongo.IsTimeout(err) {
		return true
	}

	errStrLower := strings.ToLower(err.Error())
	for _, retryable := range []string{
		"server selection error",
		"server selection timeout",
		"no reachable servers",
		"connection closed",
		"connection reset",
		"incomplete read",
	} {
		if strings.Contains(errStrLower, retryable) {
			return true
		}
	}
	return false
}
