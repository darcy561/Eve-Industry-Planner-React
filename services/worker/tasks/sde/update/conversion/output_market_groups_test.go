package conversion

import "testing"

func marketGroupsFixture() map[string]any {
	return map[string]any{
		// A root: the source gives it no parentGroupID at all.
		"4": map[string]any{"name": map[string]any{"en": "Ships"}},
		"5": map[string]any{
			"name":          map[string]any{"en": "Frigates"},
			"parentGroupID": float64(4),
		},
		// A parent the source names but does not carry.
		"9": map[string]any{
			"name":          map[string]any{"en": "Orphan"},
			"parentGroupID": float64(404),
		},
		// A root stated as zero rather than left out. Real data never does this,
		// but the walk stops on zero, so nothing may reach it by another route.
		"11": map[string]any{
			"name":          map[string]any{"en": "Stated Root"},
			"parentGroupID": float64(0),
		},
	}
}

func TestMarketGroupsCarryTheirParent(t *testing.T) {
	groups := GenerateMarketGroupsOutput(marketGroupsFixture())

	frigates, ok := groups["5"]
	if !ok {
		t.Fatal("frigates missing")
	}
	if frigates.Name != "Frigates" || frigates.ParentID != 4 {
		t.Fatalf("frigates = %+v", frigates)
	}
}

// A walk has to stop somewhere, and 0 is the only signal it gets.
func TestMarketGroupsRootHasNoParent(t *testing.T) {
	groups := GenerateMarketGroupsOutput(marketGroupsFixture())

	if got := groups["4"]; got.ParentID != 0 {
		t.Fatalf("ships = %+v, want no parent", got)
	}
}

// A parent that is not in the file would send the walk somewhere that does not
// exist, so the group is kept as a root rather than pointed at nothing.
func TestMarketGroupsDropAParentThatIsNotThere(t *testing.T) {
	groups := GenerateMarketGroupsOutput(marketGroupsFixture())

	orphan, ok := groups["9"]
	if !ok {
		t.Fatal("a group with a missing parent should still be named")
	}
	if orphan.ParentID != 0 {
		t.Fatalf("orphan = %+v, want no parent", orphan)
	}
}

func TestMarketGroupsTreatAStatedZeroAsARoot(t *testing.T) {
	groups := GenerateMarketGroupsOutput(marketGroupsFixture())

	if got := groups["11"]; got.ParentID != 0 {
		t.Fatalf("stated root = %+v, want no parent", got)
	}
}

func TestMarketGroupsSkipWhatItCannotName(t *testing.T) {
	groups := GenerateMarketGroupsOutput(map[string]any{
		"1": map[string]any{"name": map[string]any{"de": "Nur Deutsch"}},
		"2": map[string]any{"parentGroupID": float64(4)},
		"3": "not a group",
		// An empty name is no name: a picker showing it would offer a blank row
		// the player cannot tell from any other.
		"4": map[string]any{"name": map[string]any{"en": ""}},
	})

	if len(groups) != 0 {
		t.Fatalf("groups = %+v, want none", groups)
	}
}
