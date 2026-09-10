package conversion

import "testing"

// The SPA asks the item list whether a type is a ship, and a type names only its group, so the
// join has to happen here.
func TestBuildCategoryByGroupID(t *testing.T) {
	groups := map[string]any{
		"25":  map[string]any{"categoryID": float64(6)}, // Frigate
		"18":  map[string]any{"categoryID": float64(4)}, // Mineral
		"448": map[string]any{},                         // no category stated
		"bad": map[string]any{"categoryID": float64(6)}, // not a group id
		"7":   "not an object",
	}

	byGroupID := BuildCategoryByGroupID(groups)

	if got := byGroupID[25]; got != 6 {
		t.Errorf("frigate group category = %d, want 6", got)
	}
	if got := byGroupID[18]; got != 4 {
		t.Errorf("mineral group category = %d, want 4", got)
	}
	if _, ok := byGroupID[448]; ok {
		t.Error("a group stating no category should not be mapped")
	}
	if len(byGroupID) != 2 {
		t.Errorf("mapped %d groups, want 2", len(byGroupID))
	}
}

func TestGenerateFullItemListOutputCarriesCategory(t *testing.T) {
	combined := map[string]*EVEType{
		"587": {ItemID: 587, Name: "Rifter", GroupID: 25, MarketGroupID: 61},
		"34":  {ItemID: 34, Name: "Tritanium", GroupID: 18, MarketGroupID: 1857},
		// A group the SDE did not give a category for still belongs in the list.
		"99": {ItemID: 99, Name: "Oddity", GroupID: 448, MarketGroupID: 5},
	}
	byGroupID := map[int]int{25: 6, 18: 4}

	out := GenerateFullItemListOutput(combined, map[string]any{}, byGroupID)

	if out["587"].CategoryID != 6 {
		t.Errorf("Rifter category = %d, want 6", out["587"].CategoryID)
	}
	if out["34"].CategoryID != 4 {
		t.Errorf("Tritanium category = %d, want 4", out["34"].CategoryID)
	}
	if out["99"].CategoryID != 0 {
		t.Errorf("uncategorised item = %d, want 0", out["99"].CategoryID)
	}
	if out["587"].Name != "Rifter" {
		t.Errorf("Rifter name = %q", out["587"].Name)
	}
}
