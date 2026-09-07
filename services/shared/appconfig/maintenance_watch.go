package appconfig

import (
	"context"
	"sync/atomic"
	"time"

	"eve-industry-planner/shared/logs"
	eipnats "eve-industry-planner/shared/nats"
)

// MaintenanceWatcher tracks the maintenance flag over NATS for a service that
// has no Redis client. It reads as off until told otherwise.
type MaintenanceWatcher struct {
	nats    *eipnats.NATS
	enabled atomic.Bool
}

// NewMaintenanceWatcher builds a watcher over n.
func NewMaintenanceWatcher(n *eipnats.NATS) *MaintenanceWatcher {
	return &MaintenanceWatcher{nats: n}
}

// Enabled reports the last value this process was told.
func (w *MaintenanceWatcher) Enabled() bool {
	if w == nil {
		return false
	}
	return w.enabled.Load()
}

// Start subscribes to changes and requests the current value; a failed request
// leaves the last value standing.
func (w *MaintenanceWatcher) Start(ctx context.Context) (stop func(), err error) {
	if w == nil || w.nats == nil {
		return func() {}, nil
	}
	unsubscribe, err := eipnats.SubscribeMaintenanceState(w.nats, func(state eipnats.MaintenanceState) {
		w.enabled.Store(state.Enabled)
	})
	if err != nil {
		return nil, err
	}
	w.fetchCurrentState(ctx, currentStateWait)
	// The reconnect callback runs on the connection's serialized dispatcher; a
	// blocking request there would stall every other callback on the handle.
	w.nats.OnReconnect(func() { go w.fetchCurrentState(context.WithoutCancel(ctx), 0) })
	return unsubscribe, nil
}

// fetchCurrentState requests the value from whichever replica answers. A zero
// wait takes the shared default.
func (w *MaintenanceWatcher) fetchCurrentState(ctx context.Context, wait time.Duration) {
	state, err := eipnats.AskMaintenanceState(ctx, w.nats, wait)
	if err != nil {
		logs.WarnCtx(ctx, "maintenance state request failed, holding last known value",
			"error", err, "enabled", w.Enabled())
		return
	}
	w.enabled.Store(state.Enabled)
}
