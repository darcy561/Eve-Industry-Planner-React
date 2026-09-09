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

// Options configures the sweep.
type Options struct {
	// DryRun counts what a pass would revoke without revoking it.
	DryRun bool
}

// Stats summarizes one pass.
type Stats struct {
	OrphanRefreshTokensFound   int
	OrphanRefreshTokensRemoved int
	DryRun                     bool
}

// OptionsFromEnv reads AUTH_SESSION_CLEANUP_DRY_RUN (true/1/yes).
func OptionsFromEnv() Options {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("AUTH_SESSION_CLEANUP_DRY_RUN")))
	return Options{DryRun: v == "true" || v == "1" || v == "yes"}
}

// A store with no Redis behind it makes the sweep a no-op rather than an error:
// a service that starts without Redis should not report a failure for a pass it
// was never going to run.
func idle(err error) bool { return errors.Is(err, plannersession.ErrNoStore) }

// Run revokes refresh tokens whose session no longer exists.
//
// This is the only part of the keyspace that does not look after itself. Expired
// sessions are dropped from a record by every read and write of it, a stranded
// session index is deleted the moment something tries to resolve it, and every
// key carries a TTL that ends it regardless. An orphaned refresh token has none
// of that. Nothing deletes it on the way past, and its lifetime is anchored
// differently from its session's: the reauth deadline runs from when the session
// started, while a rotated token gets a fresh TTL from when it was minted. So a
// session rotated late in its window is pruned on schedule while the token it
// issued stays alive for days behind it, with nothing left to resolve.
func Run(ctx context.Context, store *plannersession.Store, opts Options) (Stats, error) {
	stats := Stats{DryRun: opts.DryRun}

	found, err := revokeOrphanRefreshTokens(ctx, store, opts)
	stats.OrphanRefreshTokensFound = found
	if !opts.DryRun {
		stats.OrphanRefreshTokensRemoved = found
	}
	return stats, err
}

func revokeOrphanRefreshTokens(ctx context.Context, store *plannersession.Store, opts Options) (int, error) {
	var found int
	err := store.EachRefreshTokenKey(ctx, func(tokens []string) error {
		for _, token := range tokens {
			data, ok, err := store.RefreshToken(ctx, token)
			if err != nil {
				logs.WarnCtx(ctx, "planner session sweep: load refresh token failed", "error", err)
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
			logs.WarnCtx(ctx, "planner session sweep failed", "error", err, "dry_run", opts.DryRun)
		} else {
			logs.InfoCtx(ctx, "planner session sweep complete",
				"dry_run", stats.DryRun,
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
