package esiclient

import (
	"strings"
	"testing"

	"eve-industry-planner/testing/redisfake"

	"github.com/redis/go-redis/v9"
)

// The ledger's field grammar is written by the Lua and read by both languages.
// Two readings of one format is the failure this guards: if they ever disagree
// about where a class ends, "is this the sync field?" answers wrongly and
// silently, and the reconciled difference is counted as ordinary spend.
//
// These run the shipped slotRules fragment rather than a copy of it, so the Lua
// under test is the Lua that ships.

// luaParse calls the script's own parse_field and returns what it saw.
func luaParse(t *testing.T, field string) (slot, class, endpoint string, matched bool) {
	t.Helper()
	fake := redisfake.New(t)
	script := redis.NewScript(slotRules + `
local slot, class, endpoint = parse_field(ARGV[1])
if slot == nil then return {} end
return { slot, class, endpoint }
`)
	raw, err := script.Run(t.Context(), fake.Client, []string{}, field).Result()
	if err != nil {
		t.Fatalf("run parse_field on %q: %v", field, err)
	}
	parts, ok := raw.([]any)
	if !ok {
		t.Fatalf("parse_field returned %T", raw)
	}
	if len(parts) == 0 {
		return "", "", "", false
	}
	if len(parts) != 3 {
		t.Fatalf("parse_field returned %d parts for %q, want 3", len(parts), field)
	}
	return parts[0].(string), parts[1].(string), parts[2].(string), true
}

func TestLuaAndGoReadAFieldTheSameWay(t *testing.T) {
	cases := []ledgerField{
		{Slot: "357740896", Class: "0", Endpoint: "/markets/{region_id}/orders/"},
		{Slot: "357740896", Class: SyncMember, Endpoint: SyncMember},
		{Slot: "0", Class: "3", Endpoint: "-"},
		// An endpoint carrying the separator. No pattern in the config has one,
		// but the two sides must not disagree about it: Lua's endpoint capture
		// is greedy and Go's takes the remainder, and this is what pins them.
		{Slot: "12", Class: "1", Endpoint: "/a/|/b/"},
		{Slot: "12", Class: "1", Endpoint: ""},
	}

	for _, want := range cases {
		field := want.String()

		got, ok := parseLedgerField(field)
		if !ok {
			t.Errorf("Go could not parse %q, which it had just written", field)
			continue
		}
		if got != want {
			t.Errorf("Go read %q as %+v, want %+v", field, got, want)
		}

		slot, class, endpoint, matched := luaParse(t, field)
		if !matched {
			t.Errorf("the Lua could not parse %q, which it writes itself", field)
			continue
		}
		if slot != want.Slot || class != want.Class || endpoint != want.Endpoint {
			t.Errorf("the Lua read %q as slot=%q class=%q endpoint=%q, but Go read %+v",
				field, slot, class, endpoint, got)
		}
	}
}

// A field that does not carry the grammar must not be read as a class. Returning
// an empty class on a miss would make the sync marker's absence indistinguishable
// from a field belonging to no class.
func TestAFieldWithoutTheGrammarIsRejectedBySides(t *testing.T) {
	for _, field := range []string{"", "nogrammar", "onlyone|part"} {
		if _, ok := parseLedgerField(field); ok {
			t.Errorf("Go parsed %q, which does not carry the grammar", field)
		}
		if _, _, _, matched := luaParse(t, field); matched {
			t.Errorf("the Lua parsed %q, which does not carry the grammar", field)
		}
	}
}

// The sync marker is what the walk keys on, so the two sides must agree it is
// the sync field and agree that ordinary spend is not.
func TestBothSidesAgreeOnTheSyncMarker(t *testing.T) {
	sync := ledgerField{Slot: "1", Class: SyncMember, Endpoint: SyncMember}
	if !sync.IsSync() {
		t.Error("Go does not recognise the sync marker it just built")
	}
	if _, class, _, _ := luaParse(t, sync.String()); class != SyncMember {
		t.Errorf("the Lua read the sync field's class as %q, want %q", class, SyncMember)
	}

	spend := ledgerField{Slot: "1", Class: "0", Endpoint: "/status/"}
	if spend.IsSync() {
		t.Error("ordinary spend was read as the sync marker")
	}
	if _, class, _, _ := luaParse(t, spend.String()); class == SyncMember {
		t.Error("the Lua read ordinary spend as the sync marker")
	}
}

// The bucket key is the ledger field's neighbour: a second two-part format whose
// writer and reader sat in different files. Same trap, so the same round trip.
func TestABucketKeyRoundTrips(t *testing.T) {
	cases := []Bucket{
		{Group: "market-order", User: AnonymousUser},
		{Group: "character", User: "char:90000001"},
		{Group: "unknown:/markets/10000002/orders/", User: AnonymousUser},
		{Group: "", User: ""},
	}
	for _, want := range cases {
		got, ok := bucketFromKey(want.Key())
		if !ok {
			t.Errorf("could not read back %q, which Key just wrote", want.Key())
			continue
		}
		if got != want {
			t.Errorf("read %q as %+v, want %+v", want.Key(), got, want)
		}
	}

	if _, ok := bucketFromKey("nogrammar"); ok {
		t.Error("a segment without the separator was read as a bucket")
	}
}

// The separator is interpolated straight into a Lua pattern, where several
// characters mean something other than themselves. Go's strings.Cut would take
// such a separator literally and the Lua would not, so the two sides would part
// company over a one-character change that looks harmless.
func TestTheSeparatorIsSafeInsideALuaPattern(t *testing.T) {
	const luaMagic = `^$()%.[]*+-?`
	if strings.ContainsAny(fieldSeparator, luaMagic) {
		t.Errorf("fieldSeparator %q is a Lua pattern metacharacter, so the script's parse_field "+
			"reads it as syntax while Go reads it literally; escape it in slotRules or choose another",
			fieldSeparator)
	}
	if fieldSeparator == "" {
		t.Error("fieldSeparator is empty, so a field cannot be split at all")
	}
}
