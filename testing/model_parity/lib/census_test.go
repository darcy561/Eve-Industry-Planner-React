package modelparity

import (
	"bytes"
	"strings"
	"testing"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func newCensus() *Census {
	return &Census{DecodeErrors: Finding{}, Changed: Finding{}, Orphans: Finding{}}
}

func TestCompareFindsOrphanFields(t *testing.T) {
	census := newCensus()
	Compare(
		bson.M{"jobID": "j1", "apiJobs": bson.A{}, "build": bson.M{"totalSale": int32(5)}},
		bson.M{"jobID": "j1", "build": bson.M{}},
		census,
	)
	if census.Orphans["apiJobs"] != 1 {
		t.Errorf("apiJobs orphan count = %d, want 1", census.Orphans["apiJobs"])
	}
	if census.Orphans["build.totalSale"] != 1 {
		t.Errorf("build.totalSale orphan count = %d, want 1", census.Orphans["build.totalSale"])
	}
	if len(census.Changed) != 0 {
		t.Errorf("changed = %v, want empty", census.Changed)
	}
}

// A field the model widened from int32 to float64 holds the same number, so the
// sweep must not report it — otherwise every numeric field in the corpus is a
// finding and the real ones are lost in it.
func TestCompareIgnoresNumericWidening(t *testing.T) {
	census := newCensus()
	Compare(
		bson.M{"volume": int32(3000), "cost": int64(12), "tax": 0.25},
		bson.M{"volume": 3000.0, "cost": 12.0, "tax": 0.25},
		census,
	)
	if len(census.Changed) != 0 {
		t.Errorf("changed = %v, want empty", census.Changed)
	}
}

func TestCompareFindsChangedValues(t *testing.T) {
	census := newCensus()
	Compare(
		bson.M{"category": "", "volume": int32(10)},
		bson.M{"category": "0", "volume": int32(11)},
		census,
	)
	if census.Changed["category"] != 1 {
		t.Errorf("category change count = %d, want 1", census.Changed["category"])
	}
	if census.Changed["volume"] != 1 {
		t.Errorf("volume change count = %d, want 1", census.Changed["volume"])
	}
}

func TestCompareWalksArraysOfDocuments(t *testing.T) {
	census := newCensus()
	Compare(
		bson.M{"rows": bson.A{bson.M{"id": "a", "gone": 1}, bson.M{"id": "b", "gone": 2}}},
		bson.M{"rows": bson.A{bson.M{"id": "a"}, bson.M{"id": "b"}}},
		census,
	)
	// One row per path, not per element: the census counts documents.
	if census.Orphans["rows[].gone"] != 1 {
		t.Errorf("rows[].gone = %d, want 1", census.Orphans["rows[].gone"])
	}
}

func TestCompareFindsArrayLengthChange(t *testing.T) {
	census := newCensus()
	Compare(bson.M{"skills": bson.A{1, 2}}, bson.M{"skills": bson.A{1}}, census)
	if census.Changed["skills (length)"] != 1 {
		t.Errorf("skills length change = %d, want 1", census.Changed["skills (length)"])
	}
}

func TestCleanIgnoresOrphans(t *testing.T) {
	census := Census{Orphans: Finding{"apiJobs": 10}, Changed: Finding{}, DecodeErrors: Finding{}}
	if !census.Clean() {
		t.Error("a census holding only orphans should be clean")
	}
	census.Changed["volume"] = 1
	if census.Clean() {
		t.Error("a changed value should not be clean")
	}
}

func TestReportRanksByCount(t *testing.T) {
	var out bytes.Buffer
	Report(&out, Census{
		Collection:   "job_documents",
		Scanned:      100,
		DecodeErrors: Finding{},
		Changed:      Finding{},
		Orphans:      Finding{"rare": 1, "common": 90},
	})
	text := out.String()
	if !strings.Contains(text, "OK") {
		t.Errorf("expected OK status, got:\n%s", text)
	}
	if strings.Index(text, "common") > strings.Index(text, "rare") {
		t.Errorf("expected common before rare:\n%s", text)
	}
	if !strings.Contains(text, "( 90.0%)") {
		t.Errorf("expected a share of the scan, got:\n%s", text)
	}
}

func TestParsePhase(t *testing.T) {
	for _, name := range []string{"all", "census", "corpus"} {
		if _, err := ParsePhase(name); err != nil {
			t.Errorf("ParsePhase(%q): %v", name, err)
		}
	}
	if _, err := ParsePhase("nope"); err == nil {
		t.Error("expected an error for an unknown phase")
	}
}

func TestCompareIgnoresTheDocumentKey(t *testing.T) {
	census := newCensus()
	Compare(bson.M{"_id": "job-1", "jobID": "job-1"}, bson.M{"jobID": "job-1"}, census)
	if len(census.Orphans) != 0 {
		t.Errorf("orphans = %v, want empty", census.Orphans)
	}
	// A nested field genuinely named _id is a model's business, not Mongo's.
	nested := newCensus()
	Compare(bson.M{"rows": bson.A{bson.M{"_id": "r1"}}}, bson.M{"rows": bson.A{bson.M{}}}, nested)
	if nested.Orphans["rows[]._id"] != 1 {
		t.Errorf("rows[]._id = %d, want 1", nested.Orphans["rows[]._id"])
	}
}
