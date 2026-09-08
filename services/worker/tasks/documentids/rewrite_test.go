package documentids

import (
	"testing"

	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// A cursor decodes a nested document as bson.D, so seeding has to walk it as
// one. Asserting a map here seeds nothing, and silently: every migrated document
// would arrive without the version a conditional write compares.
func TestSeedDocumentVersionWalksTheDecodedMetaBlock(t *testing.T) {
	t.Parallel()

	raw, err := bson.Marshal(bson.M{
		"_id":   "job-1",
		"_meta": bson.M{"owner": bson.M{"kind": "account", "id": "acct-1"}},
	})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var doc bson.M
	if err := bson.Unmarshal(raw, &doc); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	seedDocumentVersion(doc)

	meta, ok := doc["_meta"].(bson.D)
	if !ok {
		t.Fatalf("_meta = %T, want bson.D as a cursor gives it", doc["_meta"])
	}
	for _, element := range meta {
		if element.Key == eipmongo.MetaFieldVersionKey {
			if element.Value != models.InitialDocumentVersion {
				t.Fatalf("version = %v, want %d", element.Value, models.InitialDocumentVersion)
			}
			return
		}
	}
	t.Fatal("the document was not seeded with a version")
}

// A document that already counts its writes keeps the count it has.
func TestSeedDocumentVersionLeavesAnExistingCountAlone(t *testing.T) {
	t.Parallel()

	doc := bson.M{"_meta": bson.D{{Key: eipmongo.MetaFieldVersionKey, Value: int64(7)}}}
	seedDocumentVersion(doc)

	meta := doc["_meta"].(bson.D)
	if len(meta) != 1 || meta[0].Value != int64(7) {
		t.Fatalf("_meta = %v, want the existing count untouched", meta)
	}
}

// A document with no meta block at all is left as it is rather than panicking.
func TestSeedDocumentVersionToleratesAMissingMetaBlock(t *testing.T) {
	t.Parallel()

	doc := bson.M{"_id": "job-1"}
	seedDocumentVersion(doc)

	if _, present := doc["_meta"]; present {
		t.Fatal("a meta block was invented")
	}
}
