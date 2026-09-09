// Package maintenance revokes refresh tokens whose session no longer exists.
//
// It is deliberately the only sweep. The rest of the planner session keyspace
// looks after itself — see [Run] for why an orphaned refresh token does not.
package maintenance

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"eve-industry-planner/shared/plannersession"
)

// VerifySessionPersisted confirms a session id is present under the account
// record it claims to belong to.
func VerifySessionPersisted(ctx context.Context, store *plannersession.Store, accountID, sessionID string) error {
	acc := strings.TrimSpace(accountID)
	sid := strings.TrimSpace(sessionID)
	if acc == "" || sid == "" {
		return errors.New("session verify failed: account id and session id are required")
	}

	resolvedAccount, session, err := store.ResolveSession(ctx, sid)
	if err != nil {
		return fmt.Errorf("session verify failed: %w", err)
	}
	if strings.TrimSpace(resolvedAccount) != acc {
		return errors.New("session verify failed: account mismatch")
	}
	if session == nil {
		return errors.New("session verify failed: session missing")
	}
	if session.RevokedAt != nil {
		return errors.New("session verify failed: session revoked")
	}
	return nil
}

// RevokeTokenBestEffort deletes a refresh token row when present, for a rollback
// path that must not fail over a token that was already gone.
func RevokeTokenBestEffort(ctx context.Context, store *plannersession.Store, token string) {
	if strings.TrimSpace(token) == "" {
		return
	}
	_ = store.DeleteRefreshToken(ctx, token)
}
