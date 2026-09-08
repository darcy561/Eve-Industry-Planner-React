package redis

import (
	"context"
	"fmt"
	"time"

	"eve-industry-planner/shared/core/config"
	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/retry"

	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
)

const (
	connectAttempts = 5
	connectDelay    = 5 * time.Second

	dialTimeout  = 5 * time.Second
	readTimeout  = 10 * time.Second
	writeTimeout = 5 * time.Second
	poolSize     = 20

	healthInterval = 30 * time.Second
)

// Connect opens the shared connection from REDIS_HOST / REDIS_PORT /
// REDIS_PASSWORD and returns a handle.
func Connect(ctx context.Context) (*Redis, error) {
	return connectFromURL(ctx, config.RedisURL)
}

func connectFromURL(ctx context.Context, urlFn func() (string, error)) (*Redis, error) {
	redisURL, err := urlFn()
	if err != nil {
		return nil, err
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("redis: parse REDIS_URL: %w", err)
	}
	opts.DialTimeout = dialTimeout
	opts.ReadTimeout = readTimeout
	opts.WriteTimeout = writeTimeout
	opts.PoolSize = poolSize

	var client *redis.Client
	err = retry.Do(ctx, func(ctx context.Context) error {
		client = redis.NewClient(opts)
		if err := client.Ping(ctx).Err(); err != nil {
			_ = client.Close()
			client = nil
			return err
		}
		return nil
	}, func(err error, at retry.AttemptContext) bool {
		logs.ErrorCtx(ctx, "failed to connect to Redis",
			"attempt", at.Attempt,
			"attempts", at.MaxAttempts,
			"error", err)
		return true
	},
		retry.WithMaxAttempts(connectAttempts),
		// A server that is still starting comes up on its own schedule, so the
		// wait stays flat rather than growing away from it.
		retry.WithInitialDelay(connectDelay),
		retry.WithMaxDelay(connectDelay),
	)
	if err != nil {
		return nil, fmt.Errorf("redis: connect failed after %d attempts: %w", connectAttempts, err)
	}

	logs.DebugCtx(ctx, "connected to Redis", "attempts", connectAttempts)

	if err := redisotel.InstrumentTracing(client); err != nil {
		logs.WarnCtx(ctx, "redis OpenTelemetry tracing hook not installed", "error", err)
	}

	handle := &Redis{conn: client}
	// Detached from ctx: the loop lives until Close, not until the context that
	// happened to open the connection ends.
	healthCtx, stop := context.WithCancel(context.WithoutCancel(ctx))
	handle.stopHealth = stop
	go monitorConnection(healthCtx, client)
	return handle, nil
}

// monitorConnection pings for observability only; the driver reconnects on its
// own. Returns when ctx is cancelled.
func monitorConnection(ctx context.Context, client *redis.Client) {
	ticker := time.NewTicker(healthInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := client.Ping(ctx).Err(); err != nil && ctx.Err() == nil {
				logs.WarnCtx(ctx, "Redis ping failed", "error", err)
			}
		}
	}
}
