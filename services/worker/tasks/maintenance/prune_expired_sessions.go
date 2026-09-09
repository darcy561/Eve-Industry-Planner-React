package maintenance

import (
	"context"
	"time"

	"eve-industry-planner/shared/plannersession"
	sessionmaint "eve-industry-planner/shared/plannersession/maintenance"
	"eve-industry-planner/worker/taskrun"

	"eve-industry-planner/shared/logs"
)

// PruneExpiredAccountSessions runs planner session maintenance: prune expired rows in
// account_sessions, remove orphan session_index keys, and revoke refresh_token rows
// whose session_id is missing from account_sessions.
func PruneExpiredAccountSessions(ctx context.Context, deps *taskrun.Dependencies) error {
	if deps == nil || deps.Redis == nil {
		return nil
	}
	stats, err := sessionmaint.Run(ctx, plannersession.NewStore(deps.Redis), sessionmaint.OptionsFromEnv())
	if err != nil {
		return err
	}
	logs.InfoCtx(ctx, "prune expired account sessions task finished",
		"dry_run", stats.DryRun,
		"accounts_scanned", stats.AccountsScanned,
		"orphan_session_indexes", stats.OrphanSessionIndexesFound,
		"orphan_session_indexes_removed", stats.OrphanSessionIndexesRemoved,
		"orphan_refresh_tokens", stats.OrphanRefreshTokensFound,
		"orphan_refresh_tokens_removed", stats.OrphanRefreshTokensRemoved,
	)
	// Small delay to avoid hammering Redis during tight scheduler loops.
	time.Sleep(100 * time.Millisecond)
	return nil
}
