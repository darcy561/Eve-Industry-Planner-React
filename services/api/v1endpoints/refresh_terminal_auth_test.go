package v1endpoints

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"eve-industry-planner/api/helper/auth"
	sessionreq "eve-industry-planner/shared/plannersession/request"
)

// A rotate failure the client cannot retry out of must carry a code; an uncoded 401 is
// indistinguishable from a transient one and leaves the SPA retrying a dead credential.
func TestRespondSessionRefreshTerminalAuthErrorCarriesCode(t *testing.T) {
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/sessions/rotate", nil)

	respondSessionRefreshTerminalAuthError(w, r, auth.RefreshCredentialLogDetail{},
		sessionreq.CodeSessionRevoked, "planner refresh token not found in Redis",
		"auth_refresh_token_not_found", nil)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
	if got := w.Header().Get("Content-Type"); got != "application/json" {
		t.Fatalf("content-type = %q, want application/json", got)
	}

	var body struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("body is not JSON: %v (%q)", err, w.Body.String())
	}
	if body.Code != sessionreq.CodeSessionRevoked {
		t.Fatalf("code = %q, want %q", body.Code, sessionreq.CodeSessionRevoked)
	}
}
