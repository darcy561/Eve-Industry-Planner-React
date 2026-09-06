package maintenance

import (
	"context"
	"fmt"
	"time"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/worker/taskrun"
)

// CleanUpExpiredMemberships deletes membership rows EVE has not confirmed for
// long enough that nothing can confirm them again.
//
// A row grants while it exists, so this is what ends a dormant account's access
// rather than a separate expiry. Accounts that log in keep their rows current
// through the grants task; dormant cloud accounts through the token sweep, until
// its abandon window — which is the age this deletes at, because past it there is
// no token left to confirm with.
func CleanUpExpiredMemberships(ctx context.Context, deps *taskrun.Dependencies) error {
	if deps == nil || deps.Mongo == nil {
		return fmt.Errorf("mongo client is required")
	}

	deleted, err := deps.Mongo.CleanUpExpiredMemberships(ctx, time.Now().UTC())
	if err != nil {
		return err
	}

	logs.InfoCtx(ctx, "expired membership cleanup finished", "deleted_rows", deleted)
	return nil
}
