package redis

import (
	"context"
	"fmt"
	"time"

	"eve-industry-planner/shared/core/config"
	"eve-industry-planner/shared/logs"

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

	var lastErr error
	for attempt := 1; attempt <= connectAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return nil, err
		}

		client := redis.NewClient(opts)
		lastErr = client.Ping(ctx).Err()
		if lastErr == nil {
			logs.DebugCtx(ctx, "connected to Redis",
				"attempt", attempt,
				"attempts", connectAttempts)

			if err := redisotel.InstrumentTracing(client); err != nil {
				logs.WarnCtx(ctx, "redis OpenTelemetry tracing hook not installed", "error", err)
			}

			handle := &Redis{conn: client}
			// Detached from ctx: the loop lives until Close, not until the
			// context that happened to open the connection ends.
			healthCtx, stop := context.WithCancel(context.WithoutCancel(ctx))
			handle.stopHealth = stop
			go monitorConnection(healthCtx, client)
			return handle, nil
		}

		logs.ErrorCtx(ctx, "failed to connect to Redis",
			"attempt", attempt,
			"attempts", connectAttempts,
			"error", lastErr)
		_ = client.Close()

		if attempt < connectAttempts {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(connectDelay):
			}
		}
	}

	return nil, fmt.Errorf("redis: connect failed after %d attempts: %w", connectAttempts, lastErr)
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
