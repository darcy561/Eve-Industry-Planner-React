package commands

import (
	"slices"
	"testing"
)

// The backfill writes the membership rows the grants repair reads, and derives a
// planner id from the owner the stamp writes. Both neighbours are positional: a
// step that drifts either side of them reads or writes nothing.
func TestAccountPlannerBackfillSitsBetweenTheOwnerStampAndTheGrantsRepair(t *testing.T) {
	t.Parallel()
	for _, rel := range releases {
		names := make([]string, 0, len(rel.steps))
		for _, step := range rel.steps {
			names = append(names, step.name)
		}
		stamp := slices.Index(names, "stamp the owner onto every scoped document")
		backfill := slices.Index(names, "give every account its planner")
		grants := slices.Index(names, "rewrite session grants as owner keys")
		if stamp < 0 || backfill < 0 || grants < 0 {
			t.Fatalf("release %s is missing one of the three steps: %v", rel.version, names)
		}
		if !(stamp < backfill && backfill < grants) {
			t.Fatalf("release %s orders them %d/%d/%d, want stamp before backfill before grants",
				rel.version, stamp, backfill, grants)
		}
	}
}
