package documentlock

import (
	"context"
	"strconv"
	"time"

	"eve-industry-planner/shared/logs"

	eipredis "eve-industry-planner/shared/redis"
)

// ViewerPresenceTTL is the maximum age of a viewer-presence entry without a refresh
// before it's evicted by PruneAndCountViewers.
const ViewerPresenceTTL = 5 * time.Minute

const viewerPresencePrefix = "doc_lock_viewers:"

// ViewerPresenceKey is the Redis ZSET of sessions passively viewing a doc.
func ViewerPresenceKey(accountID, collection, docID string) string {
	return viewerPresencePrefix + accountID + KeyPartSep + collection + KeyPartSep + docID
}

// AddViewer records sessionID as actively viewing the doc and returns whether the
// entry was newly created.
func AddViewer(ctx context.Context, rdb *eipredis.Redis, accountID, collection, docID, sessionID string) (newlyAdded bool, err error) {
	if rdb.Driver() == nil || sessionID == "" {
		return false, nil
	}
	score := float64(time.Now().Add(ViewerPresenceTTL).Unix())
	return rdb.AddScored(ctx, ViewerPresenceKey(accountID, collection, docID), sessionID, score, ViewerPresenceTTL)
}

// RemoveViewer drops a viewer entry; returns whether the entry was present.
func RemoveViewer(ctx context.Context, rdb *eipredis.Redis, accountID, collection, docID, sessionID string) (wasPresent bool, err error) {
	if rdb.Driver() == nil || sessionID == "" {
		return false, nil
	}
	n, err := rdb.RemoveScored(ctx, ViewerPresenceKey(accountID, collection, docID), sessionID)
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

// StripPassiveViewerOnHolderGrant removes holderSessionID from the viewer registry
// when they become the editor (e.g. waitlist promotion after passive viewing).
// When publishLeft is true and an entry was removed, emits viewer_left so other
// sessions refresh viewerCount without treating the editor as a passive viewer.
func StripPassiveViewerOnHolderGrant(
	ctx context.Context,
	d Deps,
	accountID, collection, docID, holderSessionID string,
	publishLeft bool,
) {
	if d.Redis.Driver() == nil || holderSessionID == "" || collection == "" || docID == "" {
		return
	}
	removed, err := RemoveViewer(ctx, d.Redis, accountID, collection, docID, holderSessionID)
	if err != nil {
		logs.WarnCtx(ctx, "doc lock holder grant: strip viewer failed",
			"error", err,
			"account_id", accountID,
			"collection", collection,
			"doc_id", docID,
		)
		return
	}
	if !removed || !publishLeft {
		return
	}
	_ = PublishLockEvent(ctx, d.NATS, accountID, map[string]any{
		LockPayloadEventKey: LockViewerEventLeft,
		"collection":        collection,
		"docID":             docID,
		"sessionID":         holderSessionID,
	})
}

// PruneAndCountViewers garbage-collects expired entries and returns the live viewer count.
func PruneAndCountViewers(ctx context.Context, rdb *eipredis.Redis, accountID, collection, docID string) (int64, error) {
	if rdb.Driver() == nil {
		return 0, nil
	}
	k := ViewerPresenceKey(accountID, collection, docID)
	nowScore := strconv.FormatInt(time.Now().Unix(), 10)
	pipe, err := rdb.Pipe()
	if err != nil {
		return 0, err
	}
	pipe.DropScoredRange(ctx, k, "0", nowScore)
	count := pipe.CountScored(ctx, k)
	if err := pipe.Exec(ctx); err != nil {
		return 0, err
	}
	n := count.Val()
	rec, _ := GetLock(ctx, rdb, accountID, collection, docID)
	if rec != nil && rec.HolderSessionID != "" {
		_, present, zerr := rdb.ScoreOf(ctx, k, rec.HolderSessionID)
		if zerr == nil && present {
			n--
			if n < 0 {
				n = 0
			}
		}
	}
	return n, nil
}
