package commands

import (
	"context"
	"strings"
	"testing"
	"time"

	"eve-industry-planner/testing/mongolive"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// The round trip a backup exists for: copy, damage, revert, compare. Run on a
// scratch collection under a scratch release name, so it never copies or
// restores anything the stack is using. Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_backupThenRevert_restoresWhatWasCopied(t *testing.T) {
	m := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	const (
		release    = "parity-backup-test"
		collection = "eip_parity_backup_scratch"
	)
	live := m.Coll(collection)
	cleanup := func() {
		cctx, c := context.WithTimeout(context.Background(), 30*time.Second)
		defer c()
		_, _ = dropBackups(cctx, m, release, false)
		_ = live.Drop(cctx)
	}
	cleanup()
	t.Cleanup(cleanup)

	seed := []any{
		bson.M{"_id": "a", "n": 1},
		bson.M{"_id": "b", "n": 2},
		bson.M{"_id": "c", "n": 3},
	}
	if _, err := live.InsertMany(ctx, seed); err != nil {
		t.Fatalf("seed: %v", err)
	}

	report, err := backupCollections(ctx, m, release, []string{collection}, false)
	if err != nil {
		t.Fatalf("backup: %v", err)
	}
	if !strings.Contains(report, "3 copied") {
		t.Fatalf("backup report = %q, want three documents copied", report)
	}

	// Damage the live collection the way a migration would: rewrite one, drop
	// another, add a stranger.
	if _, err := live.UpdateOne(ctx, bson.M{"_id": "a"}, bson.M{"$set": bson.M{"n": 100}}); err != nil {
		t.Fatalf("mutate: %v", err)
	}
	if _, err := live.DeleteOne(ctx, bson.M{"_id": "b"}); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if _, err := live.InsertOne(ctx, bson.M{"_id": "z", "n": 26}); err != nil {
		t.Fatalf("insert: %v", err)
	}

	// A second backup after the damage must not replace the copy.
	if _, err := backupCollections(ctx, m, release, []string{collection}, false); err != nil {
		t.Fatalf("second backup: %v", err)
	}

	if _, err := revertCollections(ctx, m, release, false); err != nil {
		t.Fatalf("revert: %v", err)
	}

	var got []bson.M
	cursor, err := live.Find(ctx, bson.M{}, nil)
	if err != nil {
		t.Fatalf("read after revert: %v", err)
	}
	if err := cursor.All(ctx, &got); err != nil {
		t.Fatalf("decode after revert: %v", err)
	}
	if len(got) != 3 {
		t.Fatalf("%d documents after revert, want the 3 that were copied", len(got))
	}
	byID := map[string]any{}
	for _, doc := range got {
		byID[doc["_id"].(string)] = doc["n"]
	}
	if byID["a"] != int32(1) || byID["b"] != int32(2) || byID["c"] != int32(3) {
		t.Fatalf("documents after revert = %v, want the copied values", byID)
	}
	if _, stranger := byID["z"]; stranger {
		t.Fatal("a document added after the copy survived the revert")
	}

	// The copy is kept for a second revert; dropping it is its own action.
	if held, _ := m.Coll(collection+backupSuffix(release)).CountDocuments(ctx, bson.M{}); held != 3 {
		t.Fatalf("the copy holds %d after revert, want it kept", held)
	}
	if _, err := dropBackups(ctx, m, release, false); err != nil {
		t.Fatalf("drop backups: %v", err)
	}
	if held, _ := m.Coll(collection+backupSuffix(release)).CountDocuments(ctx, bson.M{}); held != 0 {
		t.Fatalf("the copy holds %d after drop, want none", held)
	}
}

// A collection that was empty when copied is emptied by a revert, which is the
// case a manifest exists for: there is no copy to show for it.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_revert_emptiesACollectionThatWasEmpty(t *testing.T) {
	m := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	const (
		release    = "parity-backup-empty-test"
		collection = "eip_parity_backup_empty_scratch"
	)
	live := m.Coll(collection)
	cleanup := func() {
		cctx, c := context.WithTimeout(context.Background(), 30*time.Second)
		defer c()
		_, _ = dropBackups(cctx, m, release, false)
		_ = live.Drop(cctx)
	}
	cleanup()
	t.Cleanup(cleanup)

	if _, err := backupCollections(ctx, m, release, []string{collection}, false); err != nil {
		t.Fatalf("backup: %v", err)
	}
	if _, err := live.InsertOne(ctx, bson.M{"_id": "written-after"}); err != nil {
		t.Fatalf("insert: %v", err)
	}
	if _, err := revertCollections(ctx, m, release, false); err != nil {
		t.Fatalf("revert: %v", err)
	}
	if held, _ := live.CountDocuments(ctx, bson.M{}); held != 0 {
		t.Fatalf("%d documents after revert, want the collection empty as it was copied", held)
	}
}

// Reverting a release that recorded nothing is refused rather than dropping
// what is there. Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_revert_refusesWithoutARecord(t *testing.T) {
	m := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if _, err := revertCollections(ctx, m, "parity-release-never-backed-up", false); err == nil {
		t.Fatal("a revert with no backups recorded was allowed")
	}
}
