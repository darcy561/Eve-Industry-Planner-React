package modelparity

import (
	"testing"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestNormalisePathCollapsesInstanceKeys(t *testing.T) {
	cases := map[string]string{
		"build.setup.41332276-a09b-9a6a-b1d6-10db2791cfff.ME":        "build.setup.{id}.ME",
		"build.childJobs.job-05f22f4c-f504-b686-2833-294266e356f5[]": "build.childJobs.{id}[]",
		"layout.materialPriceOverrides.34":                           "layout.materialPriceOverrides.{id}",
		"build.materials[].typeID":                                   "build.materials[].typeID",
		"_meta.owner.kind":                                           "_meta.owner.kind",
	}
	for in, want := range cases {
		if got := NormalisePath(in); got != want {
			t.Errorf("NormalisePath(%q) = %q, want %q", in, got, want)
		}
	}
}

// A field named for a thing rather than an instance must survive: collapsing it
// would merge unrelated findings into one row.
func TestNormalisePathKeepsNamedFields(t *testing.T) {
	for _, path := range []string{"schemaVersion", "build.costs.extrasTotal", "apiJobs[]"} {
		if got := NormalisePath(path); got != path {
			t.Errorf("NormalisePath(%q) = %q, want it unchanged", path, got)
		}
	}
}

func TestDocumentFlattensNestedD(t *testing.T) {
	raw := bson.M{
		"_meta": bson.D{{Key: "owner", Value: bson.D{{Key: "kind", Value: "account"}}}},
		"rows":  bson.A{bson.D{{Key: "typeID", Value: int32(34)}}},
	}
	got := Document(raw)
	meta, ok := got["_meta"].(bson.M)
	if !ok {
		t.Fatalf("_meta is %T, want bson.M", got["_meta"])
	}
	owner, ok := meta["owner"].(bson.M)
	if !ok {
		t.Fatalf("_meta.owner is %T, want bson.M", meta["owner"])
	}
	if owner["kind"] != "account" {
		t.Errorf("owner.kind = %v", owner["kind"])
	}
	rows, ok := got["rows"].(bson.A)
	if !ok || len(rows) != 1 {
		t.Fatalf("rows is %T", got["rows"])
	}
	if _, ok := rows[0].(bson.M); !ok {
		t.Errorf("rows[0] is %T, want bson.M", rows[0])
	}
}
