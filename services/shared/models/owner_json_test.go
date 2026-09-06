package models

import (
	"encoding/json"
	"strings"
	"testing"
)

// Owner carries no JSON tags, so it serialises under Go field names rather than
// wire-shaped ones. That is the whole of the protection: a missed conversion
// produces conspicuous "Kind"/"ID" keys instead of a well-formed field, which is
// weaker than being impossible. What actually keeps a ref off the wire is that
// every field holding an owner is tagged `json:"-"`.
func TestOwnerSerialisesConspicuouslyRatherThanCleanly(t *testing.T) {
	t.Parallel()

	out, err := json.Marshal(Owner{Kind: OwnerCorporation, ID: "corp_ref_xyz"})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if !strings.Contains(string(out), `"Kind"`) || !strings.Contains(string(out), `"ID"`) {
		t.Fatalf("owner marshalled to %s, want unmapped Go field names", out)
	}
}
