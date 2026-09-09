package v1endpoints

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"eve-industry-planner/api/apideps"
	"eve-industry-planner/api/helper/auth"
	"eve-industry-planner/shared/plannersession"
	sessionreq "eve-industry-planner/shared/plannersession/request"
	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/evessofake"
	"eve-industry-planner/testing/keys"
	"eve-industry-planner/testing/redislive"
)

const (
	rotationTestClientID     = "test-eve-client-id"
	rotationTestCharacterID  = "91316135"
	rotationTestCharacterHsh = "rotation-owner-hash"
	rotationTestAccountID    = "rotation-account"
)

// rotationHarness wires the real rotate handler to a real Redis and a real signed SSO token, so a
// test exercises token storage, the reuse check and the response body the SPA actually parses.
type rotationHarness struct {
	handlers *Handlers
	redis    *eipredis.Redis
	sso      *evessofake.Server
}

func newRotationHarness(t *testing.T) *rotationHarness {
	t.Helper()

	client := redislive.Require(t)
	redislive.Clean(t, client, plannersession.RefreshTokenKeyPrefix+"*")
	store := eipredis.NewRedis(client)

	sso := evessofake.Start(t, rotationTestClientID)
	sso.SetCharacter(evessofake.Character{
		ID:   rotationTestCharacterID,
		Name: "Rotation Pilot",
		Hash: rotationTestCharacterHsh,
	})

	t.Setenv("EVE_CLIENT_ID", rotationTestClientID)
	t.Setenv("EVE_CLIENT_SECRET", "test-eve-client-secret")
	t.Setenv("REFRESH_TOKEN_AES_KEY", keys.EntityID)
	keys.SetEntityID(t)

	return &rotationHarness{
		handlers: New(&apideps.Deps{Redis: store, EntityCipher: keys.EntityCipher(t)}),
		redis:    store,
		sso:      sso,
	}
}

// seedSession stores a planner session refresh token the way a completed login would.
func (h *rotationHarness) seedSession(t *testing.T) string {
	t.Helper()
	now := time.Now().UTC()
	token, err := auth.MintAndStoreRefreshToken(context.Background(), h.redis, plannersession.RefreshTokenData{
		CharacterHash: rotationTestCharacterHsh,
		AccountID:     rotationTestAccountID,
		SessionID:     "rotation-session",
		SessionStart:  now,
		SessionSeenAt: now,
	})
	if err != nil {
		t.Fatalf("seed refresh token: %v", err)
	}
	return token
}

// rotate posts one rotate request and returns the recorder.
func (h *rotationHarness) rotate(t *testing.T, refreshToken string) *httptest.ResponseRecorder {
	t.Helper()
	body, err := json.Marshal(RefreshRequest{
		RefreshToken: refreshToken,
		EveToken:     h.sso.AccessToken(),
	})
	if err != nil {
		t.Fatalf("marshal rotate body: %v", err)
	}
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/sessions/rotate", bytes.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.handlers.RotateHandler(w, r)
	return w
}

func decodeRotateResponse(t *testing.T, w *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var out map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &out); err != nil {
		t.Fatalf("rotate answered %d with a non-JSON body %q — a client cannot read a code out of "+
			"this, so it cannot tell a dead credential from a transient failure", w.Code, w.Body.String())
	}
	return out
}

// The stuck-session defect, end to end. Rotation is single-use, so a client that never stores the
// replacement — a lost response, or a duplicated tab whose sessionStorage was copied — is left
// holding a revoked token. That second presentation must come back coded, because an uncoded 401 is
// indistinguishable from a transient failure and the SPA retries it on every private request forever.
func TestPresentingARotatedRefreshTokenIsTerminal(t *testing.T) {
	h := newRotationHarness(t)
	original := h.seedSession(t)

	first := h.rotate(t, original)
	if first.Code != http.StatusOK {
		t.Fatalf("first rotate = %d %q, want 200", first.Code, first.Body.String())
	}
	replacement, _ := decodeRotateResponse(t, first)["refresh_token"].(string)
	if replacement == "" || replacement == original {
		t.Fatalf("rotate did not issue a new refresh token (got %q)", replacement)
	}

	second := h.rotate(t, original)
	if second.Code != http.StatusUnauthorized {
		t.Fatalf("reusing a rotated token = %d %q, want 401", second.Code, second.Body.String())
	}
	if code, _ := decodeRotateResponse(t, second)["code"].(string); code != sessionreq.CodeSessionRevoked {
		t.Fatalf("code = %q, want %q — the SPA needs this to stop retrying and start a full login",
			code, sessionreq.CodeSessionRevoked)
	}
}

// The replacement must still work after the original is dead, or the fix would strand every session
// rather than only the reused ones.
func TestTheReplacementRefreshTokenStillRotates(t *testing.T) {
	h := newRotationHarness(t)

	first := h.rotate(t, h.seedSession(t))
	if first.Code != http.StatusOK {
		t.Fatalf("first rotate = %d %q, want 200", first.Code, first.Body.String())
	}
	replacement, _ := decodeRotateResponse(t, first)["refresh_token"].(string)

	second := h.rotate(t, replacement)
	if second.Code != http.StatusOK {
		t.Fatalf("rotating the replacement = %d %q, want 200", second.Code, second.Body.String())
	}
}

// The other terminal answer: the session's 7-day reauth deadline is anchored to when it started, so
// no amount of rotating extends it. The client must be told to start a full login rather than retry.
func TestARotateAfterTheReauthDeadlineIsTerminal(t *testing.T) {
	h := newRotationHarness(t)

	started := time.Now().UTC().Add(-(plannersession.RefreshTokenTTL + time.Hour))
	token, err := auth.MintAndStoreRefreshToken(context.Background(), h.redis, plannersession.RefreshTokenData{
		CharacterHash: rotationTestCharacterHsh,
		AccountID:     rotationTestAccountID,
		SessionID:     "expired-session",
		SessionStart:  started,
		SessionSeenAt: started,
	})
	if err != nil {
		t.Fatalf("seed refresh token: %v", err)
	}

	w := h.rotate(t, token)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("rotate past the deadline = %d %q, want 401", w.Code, w.Body.String())
	}
	if code, _ := decodeRotateResponse(t, w)["code"].(string); code != sessionreq.CodeReauthRequired {
		t.Fatalf("code = %q, want %q", code, sessionreq.CodeReauthRequired)
	}
}

// A token that was never issued is the same terminal answer as a revoked one — the client cannot
// retry its way out of either.
func TestAnUnknownRefreshTokenIsTerminal(t *testing.T) {
	h := newRotationHarness(t)

	w := h.rotate(t, "a-token-that-was-never-issued")
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("unknown token = %d %q, want 401", w.Code, w.Body.String())
	}
	if code, _ := decodeRotateResponse(t, w)["code"].(string); code != sessionreq.CodeSessionRevoked {
		t.Fatalf("code = %q, want %q", code, sessionreq.CodeSessionRevoked)
	}
}
