package appconfig

import (
	"context"
	"errors"
	"sync/atomic"
	"time"

	"eve-industry-planner/shared/logs"
	eipnats "eve-industry-planner/shared/nats"

	"github.com/redis/go-redis/v9"
)

// MaintenanceKey is the Redis key holding the live maintenance flag.
const MaintenanceKey = "appconfig:maintenance_mode"

// Written form; reads accept any Truthy spelling.
const (
	storedOn  = "1"
	storedOff = "0"
)

// MaintenanceFlag reads and writes the live maintenance flag in Redis, holding
// the last value read when Redis cannot answer. No key means off.
type MaintenanceFlag struct {
	rdb      *redis.Client
	lastRead atomic.Bool
}

// NewMaintenanceFlag builds the flag over rdb.
func NewMaintenanceFlag(rdb *redis.Client) *MaintenanceFlag {
	return &MaintenanceFlag{rdb: rdb}
}

// Enabled reports the live value, holding the last known one on a read failure.
func (f *MaintenanceFlag) Enabled(ctx context.Context) bool {
	if f == nil || f.rdb == nil {
		return false
	}
	value, err := f.rdb.Get(ctx, MaintenanceKey).Result()
	switch {
	case err == nil:
		enabled := Truthy(value)
		f.lastRead.Store(enabled)
		return enabled
	case errors.Is(err, redis.Nil):
		f.lastRead.Store(false)
		return false
	default:
		logs.WarnCtx(ctx, "maintenance flag read failed, holding last known value",
			"error", err, "enabled", f.lastRead.Load())
		return f.lastRead.Load()
	}
}

// Set writes the flag; it does not announce the change.
func (f *MaintenanceFlag) Set(ctx context.Context, enabled bool) error {
	if f == nil || f.rdb == nil {
		return errors.New("appconfig: maintenance flag has no redis client")
	}
	value := storedOff
	if enabled {
		value = storedOn
	}
	if err := f.rdb.Set(ctx, MaintenanceKey, value, 0).Err(); err != nil {
		return err
	}
	f.lastRead.Store(enabled)
	return nil
}

// currentStateWait bounds both the watcher's request and the Redis read behind
// one reply; past it either side falls back to the value it already holds.
const currentStateWait = 2 * time.Second

// ServeMaintenanceState answers the current-value ask from flag. ctx bounds each
// reply's read; stop ends the subscription.
func ServeMaintenanceState(ctx context.Context, n *eipnats.NATS, flag *MaintenanceFlag) (stop func(), err error) {
	if n == nil || flag == nil {
		return func() {}, nil
	}
	return eipnats.SubscribeMaintenanceAsk(n, func() bool {
		readCtx, cancel := context.WithTimeout(ctx, currentStateWait)
		defer cancel()
		return flag.Enabled(readCtx)
	})
}
