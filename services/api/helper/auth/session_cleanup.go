package auth

import (
	"context"
	"os"
	"strings"
	"time"

	"eve-industry-planner/shared/logs"

	eipredis "eve-industry-planner/shared/redis"
)

// SessionCleanupOptions configures orphan/session maintenance sweeps.
type SessionCleanupOptions struct {
	// DryRun increments stats only; no Redis deletes.
	DryRun bool
}

// SessionCleanupStats summarizes one maintenance pass.
type SessionCleanupStats struct {
	AccountsScanned             int
	OrphanSessionIndexesFound   int
	OrphanSessionIndexesRemoved int
	OrphanRefreshTokensFound    int
	OrphanRefreshTokensRemoved  int
	DryRun                      bool
}

// SessionCleanupOptionsFromEnv reads AUTH_SESSION_CLEANUP_DRY_RUN (true/1/yes).
func SessionCleanupOptionsFromEnv() SessionCleanupOptions {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("AUTH_SESSION_CLEANUP_DRY_RUN")))
	return SessionCleanupOptions{
		DryRun: v == "true" || v == "1" || v == "yes",
	}
}

// PruneAllAccountSessionsRecords scans account_sessions:* and loads each record so
// expired session rows and their session_index keys are pruned (existing API behaviour).
func PruneAllAccountSessionsRecords(ctx context.Context, redisClient *eipredis.Redis) (int, error) {
	if redisClient.Driver() == nil {
		return 0, nil
	}
	store := NewSessionStore(redisClient)

	var scanned int
	err := store.EachAccountSessionsKey(ctx, func(accountIDs []string) error {
		for _, accountID := range accountIDs {
			// Reading is what prunes: the record's expired sessions go, and
			// their indexes with them.
			if _, err := store.LiveAccountSessions(ctx, accountID); err != nil {
				logs.WarnCtx(ctx, "auth session prune: load account_sessions failed",
					"account_id", accountID, "error", err)
				continue
			}
			scanned++
		}
		return nil
	})
	return scanned, err
}

// CleanupOrphanSessionIndexes removes session_index:* entries with no matching account_sessions row.
func CleanupOrphanSessionIndexes(ctx context.Context, redisClient *eipredis.Redis, opts SessionCleanupOptions) (int, error) {
	if redisClient.Driver() == nil {
		return 0, nil
	}
	store := NewSessionStore(redisClient)

	var found int
	err := store.EachSessionIndexKey(ctx, func(sessionIDs []string) error {
		for _, sessionID := range sessionIDs {
			if _, err := loadAccountSessionRow(ctx, redisClient, sessionID); err == nil {
				continue
			}
			found++
			if opts.DryRun {
				continue
			}
			if err := store.DeleteSessionIndexes(ctx, sessionID); err != nil {
				logs.WarnCtx(ctx, "auth session cleanup: delete orphan index failed",
					"session_id", sessionID, "error", err)
			}
		}
		return nil
	})
	return found, err
}

// CleanupOrphanRefreshTokens removes refresh_token:* rows whose session_id is not present under account_sessions.
func CleanupOrphanRefreshTokens(ctx context.Context, redisClient *eipredis.Redis, opts SessionCleanupOptions) (int, error) {
	if redisClient.Driver() == nil {
		return 0, nil
	}
	store := NewSessionStore(redisClient)

	var found int
	err := store.EachRefreshTokenKey(ctx, func(tokens []string) error {
		for _, token := range tokens {
			data, ok, err := store.RefreshToken(ctx, token)
			if err != nil {
				logs.WarnCtx(ctx, "auth session cleanup: load refresh_token failed", "error", err)
				continue
			}
			if !ok {
				continue
			}
			sid := strings.TrimSpace(data.SessionID)
			if sid == "" {
				continue
			}
			if err := VerifyAccountSessionPersisted(ctx, redisClient, data.AccountID, sid); err == nil {
				continue
			}
			found++
			if opts.DryRun {
				continue
			}
			RevokeRefreshTokenBestEffort(ctx, redisClient, token)
		}
		return nil
	})
	return found, err
}

// RunAuthSessionMaintenance runs account_sessions prune plus orphan index/refresh_token cleanup.
func RunAuthSessionMaintenance(ctx context.Context, redisClient *eipredis.Redis, opts SessionCleanupOptions) (SessionCleanupStats, error) {
	stats := SessionCleanupStats{DryRun: opts.DryRun}
	if redisClient.Driver() == nil {
		return stats, nil
	}
	scanned, err := PruneAllAccountSessionsRecords(ctx, redisClient)
	stats.AccountsScanned = scanned
	if err != nil {
		return stats, err
	}
	indexFound, err := CleanupOrphanSessionIndexes(ctx, redisClient, opts)
	stats.OrphanSessionIndexesFound = indexFound
	if opts.DryRun {
		stats.OrphanSessionIndexesRemoved = 0
	} else {
		stats.OrphanSessionIndexesRemoved = indexFound
	}
	if err != nil {
		return stats, err
	}
	refreshFound, err := CleanupOrphanRefreshTokens(ctx, redisClient, opts)
	stats.OrphanRefreshTokensFound = refreshFound
	if opts.DryRun {
		stats.OrphanRefreshTokensRemoved = 0
	} else {
		stats.OrphanRefreshTokensRemoved = refreshFound
	}
	if err != nil {
		return stats, err
	}
	return stats, nil
}

// RunAuthSessionMaintenanceLoop runs maintenance on start and every interval until ctx is cancelled.
func RunAuthSessionMaintenanceLoop(ctx context.Context, redisClient *eipredis.Redis, interval time.Duration, opts SessionCleanupOptions) error {
	if interval <= 0 {
		interval = time.Hour
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		stats, err := RunAuthSessionMaintenance(ctx, redisClient, opts)
		if err != nil && ctx.Err() == nil {
			logs.WarnCtx(ctx, "auth session maintenance pass failed", "error", err, "dry_run", opts.DryRun)
		} else {
			logs.InfoCtx(ctx, "auth session maintenance pass complete",
				"dry_run", stats.DryRun,
				"accounts_scanned", stats.AccountsScanned,
				"orphan_session_indexes", stats.OrphanSessionIndexesFound,
				"orphan_session_indexes_removed", stats.OrphanSessionIndexesRemoved,
				"orphan_refresh_tokens", stats.OrphanRefreshTokensFound,
				"orphan_refresh_tokens_removed", stats.OrphanRefreshTokensRemoved,
			)
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}
