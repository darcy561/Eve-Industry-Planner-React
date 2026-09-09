package cloudstoredesi

import (
	"testing"

	"eve-industry-planner/shared/models"
)

func userWith(hashes ...string) *models.UserAccountDocument {
	doc := &models.UserAccountDocument{}
	for _, hash := range hashes {
		doc.RefreshTokens = append(doc.RefreshTokens, models.RefreshToken{CharacterHash: hash})
	}
	return doc
}

func hashesOf(rows []requestedRow) []string {
	out := make([]string, 0, len(rows))
	for _, row := range rows {
		out = append(out, row.hash)
	}
	return out
}

// Which rows a request resolves to. This decides how many EVE SSO exchanges a call makes, and a
// token spent twice is a token lost, so it runs without Mongo rather than only behind the live gate.
func TestRequestedRows(t *testing.T) {
	t.Run("no hashes means every stored row", func(t *testing.T) {
		rows := requestedRows(userWith("a", "b"), nil)

		if got := hashesOf(rows); len(got) != 2 || got[0] != "a" || got[1] != "b" {
			t.Fatalf("hashes = %v, want [a b]", got)
		}
		for _, row := range rows {
			if row.row == nil {
				t.Errorf("%s resolved to no row", row.hash)
			}
		}
	})

	t.Run("a row with no character hash is not addressable", func(t *testing.T) {
		if got := hashesOf(requestedRows(userWith("a", ""), nil)); len(got) != 1 {
			t.Fatalf("hashes = %v, want the blank row left out", got)
		}
	})

	t.Run("asked-for order is preserved", func(t *testing.T) {
		got := hashesOf(requestedRows(userWith("a", "b"), []string{"b", "a"}))
		if len(got) != 2 || got[0] != "b" || got[1] != "a" {
			t.Fatalf("hashes = %v, want [b a]", got)
		}
	})

	// A second exchange would spend the refresh token the first just rotated.
	t.Run("a hash asked for twice resolves once", func(t *testing.T) {
		got := hashesOf(requestedRows(userWith("a"), []string{"a", "a", "A"}))
		if len(got) != 1 {
			t.Fatalf("hashes = %v, want one entry", got)
		}
	})

	// Stored spelling is matched case-insensitively, as every other reader of this array does.
	t.Run("a differently cased hash finds its row", func(t *testing.T) {
		rows := requestedRows(userWith("AbC"), []string{"abc"})
		if len(rows) != 1 || rows[0].row == nil {
			t.Fatalf("rows = %+v, want the stored row matched", rows)
		}
	})

	t.Run("an unlinked character resolves to no row", func(t *testing.T) {
		rows := requestedRows(userWith("a"), []string{"not-linked"})
		if len(rows) != 1 || rows[0].row != nil {
			t.Fatalf("rows = %+v, want one entry carrying no row", rows)
		}
	})

	t.Run("blank and whitespace hashes are dropped", func(t *testing.T) {
		if got := hashesOf(requestedRows(userWith("a"), []string{"", "   ", "a"})); len(got) != 1 {
			t.Fatalf("hashes = %v, want only the real one", got)
		}
	})
}
