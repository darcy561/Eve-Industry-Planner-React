package auth

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/shared/plannersession"
	"eve-industry-planner/testing/redisfixture"
)

func TestResolvePresentedRefreshToken_RecoversFromSession(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	rdb := redisfixture.New(t).Handle
	sessions := plannersession.NewStore(rdb)

	const (
		accountID    = "acct-presented-resolve"
		sessionID    = "sess-presented-resolve"
		staleToken   = "00000000-0000-4000-8000-000000000099"
		currentToken = "33333333-3333-4333-8333-333333333333"
	)
	now := time.Now().UTC()
	rec := &plannersession.AccountRecord{
		AccountID: accountID,
		Sessions: map[string]plannersession.Session{
			sessionID: {
				SessionID:        sessionID,
				CharacterHash:    "hash3",
				StartedAt:        now,
				LastSeenAt:       now,
				ReauthRequiredAt: plannersession.ReauthDeadlineFromSessionStart(now),
			},
		},
	}
	if err := sessions.SaveAccountRecord(ctx, rec); err != nil {
		t.Fatalf("SaveAccountRecord: %v", err)
	}
	if err := sessions.PutSessionIndex(ctx, sessionID, accountID); err != nil {
		t.Fatalf("put session index: %v", err)
	}
	data := plannersession.RefreshTokenData{
		AccountID:     accountID,
		CharacterHash: "hash3",
		SessionID:     sessionID,
		SessionStart:  now,
		SessionSeenAt: now,
	}
	if err := sessions.PutRefreshToken(ctx, currentToken, data); err != nil {
		t.Fatalf("PutRefreshToken: %v", err)
	}

	got, err := ResolvePresentedRefreshToken(ctx, rdb, staleToken, sessionID)
	if err != nil {
		t.Fatalf("ResolvePresentedRefreshToken: %v", err)
	}
	if !got.RecoveredViaSession {
		t.Fatal("expected RecoveredViaSession")
	}
	if got.Token != currentToken {
		t.Fatalf("token = %q, want %q", got.Token, currentToken)
	}
	if got.Data == nil || got.Data.AccountID != accountID {
		t.Fatalf("unexpected data: %+v", got.Data)
	}
}

func TestMintAndStoreRefreshToken(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	rdb := redisfixture.New(t).Handle
	sessions := plannersession.NewStore(rdb)

	const sessionID = "sess-mint-store"
	now := time.Now().UTC()
	data := plannersession.RefreshTokenData{
		AccountID:     "acct-mint",
		CharacterHash: "hash-mint",
		SessionID:     sessionID,
		SessionStart:  now,
		SessionSeenAt: now,
	}
	token, err := MintAndStoreRefreshToken(ctx, rdb, data)
	if err != nil {
		t.Fatalf("MintAndStoreRefreshToken: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
	loaded, found, err := sessions.RefreshToken(ctx, token)
	if err != nil || !found {
		t.Fatalf("read back minted token: found=%v err=%v", found, err)
	}
	if loaded.SessionID != sessionID {
		t.Fatalf("SessionID = %q, want %q", loaded.SessionID, sessionID)
	}
}
