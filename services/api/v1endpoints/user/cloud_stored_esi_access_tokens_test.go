package user

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// The batch request's own validation, which answers before anything reaches Mongo or EVE SSO.
func TestServerStoredEsiAccessTokensHandlerValidation(t *testing.T) {
	h := New(nil)

	post := func(body string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(http.MethodPost, "/api/v1/esi/characters/access-tokens/server",
			strings.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		h.ServerStoredEsiAccessTokensHandler(w, r)
		return w
	}

	t.Run("a request naming no character is refused", func(t *testing.T) {
		if got := post(`{"character_hashes":[]}`).Code; got != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400", got)
		}
	})

	t.Run("blank hashes do not count as characters", func(t *testing.T) {
		if got := post(`{"character_hashes":["","  "]}`).Code; got != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400", got)
		}
	})

	// The cap is what stops a malformed or hostile body asking for an unbounded number of EVE SSO
	// exchanges in one request.
	t.Run("more characters than the cap is refused", func(t *testing.T) {
		hashes := make([]string, 0, maxAccessTokenBatch+1)
		for i := 0; i <= maxAccessTokenBatch; i++ {
			hashes = append(hashes, `"hash"`)
		}
		body := `{"character_hashes":[` + strings.Join(hashes, ",") + `]}`

		if got := post(body).Code; got != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400", got)
		}
	})

	t.Run("a malformed body is refused", func(t *testing.T) {
		if got := post(`not json`).Code; got != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400", got)
		}
	})

	t.Run("only POST is accepted", func(t *testing.T) {
		r := httptest.NewRequest(http.MethodGet, "/api/v1/esi/characters/access-tokens/server", nil)
		w := httptest.NewRecorder()
		h.ServerStoredEsiAccessTokensHandler(w, r)
		if w.Code == http.StatusOK {
			t.Fatal("a GET was accepted")
		}
	})
}
