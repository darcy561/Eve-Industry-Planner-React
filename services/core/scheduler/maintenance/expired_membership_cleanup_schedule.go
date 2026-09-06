package maintenance

import (
	"context"
	"encoding/json"

	"eve-industry-planner/core/scheduler/contract"
	"eve-industry-planner/shared/logs"
	eipnats "eve-industry-planner/shared/nats"
)

// CleanUpExpiredMemberships enqueues a worker task that deletes membership rows kept
// in step with EVE which stopped granting long enough ago to forget.
//
// Weekly rather than more often: the rows it removes have been inert since they
// went stale, so nothing waits on this and a missed run costs only that the
// collection stays a little larger until the next one.
func CleanUpExpiredMemberships(deps contract.Dependencies, jobName string) contract.TaskHandler {
	natsHandle := deps.NATS
	return func(ctx context.Context, data json.RawMessage) error {
		_ = data
		if err := eipnats.TriggerCleanUpExpiredMemberships(ctx, natsHandle); err != nil {
			logs.ErrorCtx(ctx, "expired membership cleanup: publish failed", "component", schedulerLogComponent, "error", err)
			return err
		}
		logs.InfoCtx(ctx, "expired membership cleanup queued", "component", schedulerLogComponent)
		return nil
	}
}
