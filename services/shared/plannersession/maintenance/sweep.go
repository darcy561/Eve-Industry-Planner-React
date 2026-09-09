package maintenance

import (
	"context"
	"errors"
	"os"
	"strings"
	"time"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/plannersession"
)

// Options configures the orphan and expiry sweeps.
type Options struct {
	// DryRun counts what a pass would remove without removing it.
	DryRun bool
}

// Stats summarizes one maintenance pass.
type Stats struct {
	AccountsScanned             int
	OrphanSessionIndexesFound   int
	OrphanSessionIndexesRemoved int
	OrphanRefreshTokensFound    int
	OrphanRefreshTokensRemoved  int
	DryRun                      bool
}

// OptionsFromEnv reads AUTH_SESSION_CLEANUP_DRY_RUN (true/1/yes).
func OptionsFromEnv() Options {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("AUTH_SESSION_CLEANUP_DRY_RUN")))
	return Options{DryRun: v == "true" || v == "1" || v == "yes"}
}

// A store with no Redis behind it makes every sweep a no-op rather than an
// error: a service that starts without Redis should not report maintenance
// failures it was never going to run.
func idle(err error) bool { return errors.Is(err, plannersession.ErrNoStore) }

// PruneAccountRecords loads every account record so expired sessions and their
// indexes are dropped. Reading is what prunes.
func PruneAccountRecords(ctx context.Context, store *plannersession.Store) (int, error) {
	var scanned int
	err := store.EachAccountKey(ctx, func(accountIDs []string) error {
		for _, accountID := range accountIDs {
			if _, err := store.LiveAccountRecord(ctx, accountID); err != nil {
				logs.WarnCtx(ctx, "planner session prune: load account record failed",
					"account_id", accountID, "error", err)
				continue
			}
			scanned++
		}
		return nil
	})
	if idle(err) {
		return 0, nil
	}
	return scanned, err
}

// CleanupOrphanIndexes removes session indexes with no matching account record.
func CleanupOrphanIndexes(ctx context.Context, store *plannersession.Store, opts Options) (int, error) {
	var found int
	err := store.EachSessionIndexKey(ctx, func(sessionIDs []string) error {
		for _, sessionID := range sessionIDs {
			if _, err := store.SessionRow(ctx, sessionID); err == nil {
				continue
			}
			found++
			if opts.DryRun {
				continue
			}
			if err := store.DeleteSessionIndexes(ctx, sessionID); err != nil {
				logs.WarnCtx(ctx, "planner session cleanup: delete orphan index failed",
					"session_id", sessionID, "error", err)
			}
		}
		return nil
	})
	if idle(err) {
		return 0, nil
	}
	return found, err
}

// CleanupOrphanRefreshTokens removes refresh tokens whose session is no longer
// held by the account record they name.
func CleanupOrphanRefreshTokens(ctx context.Context, store *plannersession.Store, opts Options) (int, error) {
	var found int
	err := store.EachRefreshTokenKey(ctx, func(tokens []string) error {
		for _, token := range tokens {
			data, ok, err := store.RefreshToken(ctx, token)
			if err != nil {
				logs.WarnCtx(ctx, "planner session cleanup: load refresh token failed", "error", err)
				continue
			}
			if !ok {
				continue
			}
			sid := strings.TrimSpace(data.SessionID)
			if sid == "" {
				continue
			}
			if err := VerifySessionPersisted(ctx, store, data.AccountID, sid); err == nil {
				continue
			}
			found++
			if opts.DryRun {
				continue
			}
			RevokeTokenBestEffort(ctx, store, token)
		}
		return nil
	})
	if idle(err) {
		return 0, nil
	}
	return found, err
}

// Run performs one pass: prune account records, then remove orphan indexes and
// orphan refresh tokens.
func Run(ctx context.Context, store *plannersession.Store, opts Options) (Stats, error) {
	stats := Stats{DryRun: opts.DryRun}

	scanned, err := PruneAccountRecords(ctx, store)
	stats.AccountsScanned = scanned
	if err != nil {
		return stats, err
	}

	indexFound, err := CleanupOrphanIndexes(ctx, store, opts)
	stats.OrphanSessionIndexesFound = indexFound
	if !opts.DryRun {
		stats.OrphanSessionIndexesRemoved = indexFound
	}
	if err != nil {
		return stats, err
	}

	refreshFound, err := CleanupOrphanRefreshTokens(ctx, store, opts)
	stats.OrphanRefreshTokensFound = refreshFound
	if !opts.DryRun {
		stats.OrphanRefreshTokensRemoved = refreshFound
	}
	return stats, err
}

// RunLoop runs a pass on start and every interval until ctx is cancelled.
func RunLoop(ctx context.Context, store *plannersession.Store, interval time.Duration, opts Options) error {
	if interval <= 0 {
		interval = time.Hour
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		stats, err := Run(ctx, store, opts)
		if err != nil && ctx.Err() == nil {
			logs.WarnCtx(ctx, "planner session maintenance pass failed", "error", err, "dry_run", opts.DryRun)
		} else {
			logs.InfoCtx(ctx, "planner session maintenance pass complete",
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
