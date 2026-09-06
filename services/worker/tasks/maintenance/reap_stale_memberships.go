package maintenance

import (
	"context"
	"fmt"
	"time"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/worker/taskrun"
)

// ReapStaleMemberships deletes membership rows that stopped granting long enough
// ago that keeping them serves nothing.
//
// The rows it removes have been inert since they went stale, so nothing depends
// on this running — it keeps the collection from growing without bound and
// nothing else. The stale count is logged beside the delete count because the
// two answer different questions: how many accounts have lost access, and how
// many rows were old enough to forget.
func ReapStaleMemberships(ctx context.Context, deps *taskrun.Dependencies) error {
	if deps == nil || deps.Mongo == nil {
		return fmt.Errorf("mongo client is required")
	}
	now := time.Now().UTC()

	stale, err := deps.Mongo.CountStaleMemberships(ctx, now)
	if err != nil {
		return err
	}
	deleted, err := deps.Mongo.ReapStaleMemberships(ctx, now)
	if err != nil {
		return err
	}

	logs.InfoCtx(ctx, "reap stale memberships task finished",
		"stale_rows", stale,
		"deleted_rows", deleted,
	)
	return nil
}
