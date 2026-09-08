package nats

import (
	"context"
	"errors"
	"net"
	"strings"
	"time"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/retry"

	natslib "github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

// ErrNotConnected reports a disconnected connection at the moment an operation needed it.
var ErrNotConnected = errors.New("nats: connection is not connected")

// RetryPolicy bounds one retried operation.
type RetryPolicy struct {
	Attempts     int
	InitialDelay time.Duration
	MaxDelay     time.Duration
}

// Acknowledgement backs off less than publishing: it holds a consumer's redelivery timer open.
var (
	PublishRetry = RetryPolicy{Attempts: 5, InitialDelay: 500 * time.Millisecond, MaxDelay: 5 * time.Second}
	AckRetry     = RetryPolicy{Attempts: 3, InitialDelay: 100 * time.Millisecond, MaxDelay: 400 * time.Millisecond}
)

// Retry runs operation under policy, retrying what [IsRetryable] accepts.
// operationName labels the logs; the error returned is the NATS failure itself.
func Retry(ctx context.Context, policy RetryPolicy, operationName string, operation func() error) error {
	if ctx == nil {
		ctx = context.Background()
	}
	if policy.Attempts < 1 {
		policy.Attempts = 1
	}
	opName := operationName
	if opName == "" {
		opName = "NATS operation"
	}

	attempts := 0
	refused := false

	// refuse reports whether err ends the operation rather than earning another
	// attempt, and logs it once. The engine does not consult the predicate on the
	// last attempt, so a failure there is classified after Do returns instead.
	refuse := func(err error) bool {
		if IsRetryable(err) {
			return false
		}
		refused = true
		logs.WarnCtx(ctx, "NATS operation failed - non-retryable error",
			"operation", opName,
			"error", err)
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
			logs.InfoCtx(ctx, "NATS operation failed, retrying",
				"operation", opName,
				"attempt", at.Attempt,
				"max_attempts", at.MaxAttempts,
				"error", err)
			return true
		},
		retry.WithMaxAttempts(policy.Attempts),
		retry.WithInitialDelay(policy.InitialDelay),
		retry.WithMaxDelay(policy.MaxDelay),
		retry.WithOperationName(opName),
	)

	switch {
	case err == nil:
		if attempts > 1 {
			logs.InfoCtx(ctx, "NATS operation succeeded after retry",
				"operation", opName,
				"attempt", attempts)
		}
	// The caller's context ended before any attempt ran, so this is not a NATS
	// failure. A deadline reached mid-operation is one, and IsRetryable treats it
	// as the server not answering.
	case attempts == 0:
	case !refused && !refuse(err):
		logs.ErrorCtx(ctx, "NATS operation failed - all attempts exhausted",
			"operation", opName,
			"attempts", attempts,
			"error", err)
	}
	return err
}

// IsRetryable reports whether err is a transient connection, stream, or timeout failure.
func IsRetryable(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, context.Canceled) {
		return false
	}
	if errors.Is(err, ErrNotConnected) {
		return true
	}
	switch {
	case errors.Is(err, natslib.ErrConnectionClosed),
		errors.Is(err, natslib.ErrConnectionDraining),
		errors.Is(err, natslib.ErrConnectionReconnecting),
		errors.Is(err, natslib.ErrDisconnected),
		errors.Is(err, natslib.ErrInvalidConnection),
		errors.Is(err, natslib.ErrNoResponders),
		errors.Is(err, natslib.ErrNoServers),
		errors.Is(err, natslib.ErrTimeout):
		return true
	}
	switch {
	case errors.Is(err, jetstream.ErrConnectionClosed),
		errors.Is(err, jetstream.ErrNoStreamResponse),
		errors.Is(err, jetstream.ErrServerShutdown):
		return true
	}
	if _, ok := errors.AsType[net.Error](err); ok {
		return true
	}

	// A publish carries its own deadline, so this is the server not answering.
	if errors.Is(err, context.DeadlineExceeded) {
		return true
	}

	// Backstop for responses that arrive as plain messages, not sentinels.
	msg := strings.ToLower(err.Error())
	for _, retryable := range []string{
		"no response from stream",
		"connection closed",
		"connection reset",
		"no responders",
	} {
		if strings.Contains(msg, retryable) {
			return true
		}
	}
	return false
}
