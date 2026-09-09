package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"eve-industry-planner/shared/plannersession"
	sessionreq "eve-industry-planner/shared/plannersession/request"
	eipredis "eve-industry-planner/shared/redis"
)

// ErrRefreshTokenGenerate indicates GenerateRefreshToken failed inside MintAndStoreRefreshToken.
var ErrRefreshTokenGenerate = errors.New("refresh token generate failed")

// PresentedRefreshResult is the resolved planner refresh credential for rotate/bootstrap.
type PresentedRefreshResult struct {
	Token               string
	Data                *plannersession.RefreshTokenData
	RecoveredViaSession bool
}

// ResolvePresentedRefreshToken loads refresh_token:<presented>. When that row is missing and
// sessionID refers to an active account session, it resolves the current refresh row for that session.
func ResolvePresentedRefreshToken(ctx context.Context, redisClient *eipredis.Redis, presentedToken, sessionID string) (PresentedRefreshResult, error) {
	presentedToken = strings.TrimSpace(presentedToken)
	out := PresentedRefreshResult{Token: presentedToken}

	store := plannersession.NewStore(redisClient)
	data, found, err := store.RefreshToken(ctx, presentedToken)
	if err != nil {
		return PresentedRefreshResult{}, err
	}
	if found {
		out.Data = data
		return out, nil
	}

	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return PresentedRefreshResult{}, plannersession.ErrRefreshTokenNotFound
	}
	resolvedToken, resolvedData, recErr := store.ResolveTokenForValidSession(ctx, sid)
	if recErr != nil {
		return PresentedRefreshResult{}, recErr
	}
	return PresentedRefreshResult{
		Token:               resolvedToken,
		Data:                resolvedData,
		RecoveredViaSession: true,
	}, nil
}

// ResolvePresentedRefreshTokenFromRequest is ResolvePresentedRefreshToken with sessionID from eip_session.
func ResolvePresentedRefreshTokenFromRequest(ctx context.Context, redisClient *eipredis.Redis, presentedToken string, r *http.Request) (PresentedRefreshResult, error) {
	sessionID := ""
	if r != nil {
		sessionID = sessionreq.SessionID(r)
	}
	return ResolvePresentedRefreshToken(ctx, redisClient, presentedToken, sessionID)
}

// MintAndStoreRefreshToken generates a new opaque planner refresh token and persists it in Redis.
func MintAndStoreRefreshToken(ctx context.Context, redisClient *eipredis.Redis, data plannersession.RefreshTokenData) (string, error) {
	token, err := plannersession.GenerateRefreshToken()
	if err != nil {
		return "", fmt.Errorf("%w: %w", ErrRefreshTokenGenerate, err)
	}
	if err := plannersession.NewStore(redisClient).PutRefreshToken(ctx, token, data); err != nil {
		return "", err
	}
	return token, nil
}

// RevokeSupersededRefreshToken removes the refresh token that was presented or recovered for rotation.
func RevokeSupersededRefreshToken(ctx context.Context, redisClient *eipredis.Redis, supersededToken string) error {
	return plannersession.NewStore(redisClient).DeleteRefreshToken(ctx, supersededToken)
}
