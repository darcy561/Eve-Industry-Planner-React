package redis

import (
	"context"
	"time"

	"eve-industry-planner/shared/logs"
)

// Bounds how long a refresher that died holding the lock blocks the next one.
// A clean finish releases explicitly, so this is the crash path.
const ttlRefreshLock = 300 * time.Second

func (d Dataset) refreshLockKey() string { return "esi:" + string(d) + ":refresh_lock" }

// AcquireRefresh takes the refresh lock for a dataset, so only one task
// refreshes it at a time.
//
// held false means someone else is refreshing and the caller should return
// without treating it as an error. When held is true the caller must defer
// release.
func (r *Redis) AcquireRefresh(ctx context.Context, d Dataset) (release func(), held bool) {
	key := d.refreshLockKey()
	holder := LeaseInstanceID()

	acquired, err := r.PutIfAbsent(ctx, key, holder, ttlRefreshLock)
	if err != nil {
		logs.WarnCtx(ctx, "failed to acquire refresh lock", "error", err, "dataset", string(d))
		return nil, false
	}
	if !acquired {
		logs.InfoCtx(ctx, "skipping refresh, another refresh in progress", "dataset", string(d))
		return nil, false
	}

	return func() {
		// Detached from ctx: a release is owed whatever became of the work.
		releaseCtx := context.WithoutCancel(ctx)
		// Releasing by holder id leaves a lock alone once it has lapsed and
		// been taken by someone else.
		if err := ReleaseIfMine(releaseCtx, r, key, holder); err != nil {
			logs.WarnCtx(releaseCtx, "failed to release refresh lock", "error", err, "dataset", string(d))
		}
	}, true
}
