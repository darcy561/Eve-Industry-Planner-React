package helper

import (
	"testing"

	"eve-industry-planner/shared/models"
)

func TestParseOwnerHandle(t *testing.T) {
	t.Parallel()

	owner, err := ParseOwnerHandle("corporation:corp_56_abc")
	if err != nil {
		t.Fatalf("ParseOwnerHandle: %v", err)
	}
	if owner.Kind != models.OwnerCorporation || owner.ID != "corp_56_abc" {
		t.Errorf("owner = %+v", owner)
	}

	// An account id can hold a colon, so only the first separates kind from id.
	owner, err = ParseOwnerHandle("account:a:b")
	if err != nil {
		t.Fatalf("ParseOwnerHandle: %v", err)
	}
	if owner.ID != "a:b" {
		t.Errorf("id = %q, want the whole remainder", owner.ID)
	}

	for _, bad := range []string{"", "account", "account:"} {
		if _, err := ParseOwnerHandle(bad); err == nil {
			t.Errorf("ParseOwnerHandle(%q) was accepted", bad)
		}
	}
}
