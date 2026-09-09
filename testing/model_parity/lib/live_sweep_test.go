package modelparity_test

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"
	modelparity "eve-industry-planner/testing/model_parity/lib"
	"eve-industry-planner/testing/mongolive"
)

// Live coverage for the sweep itself, against whatever the stack holds.
// Requires EIP_MONGO_PARITY_LIVE=1.

func TestLive_sweepJobDocuments(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	census, err := modelparity.Sweep[models.Job](ctx, mongo.JobDocuments.Collection(), eipmongo.CollectionJobDocuments)
	if err != nil {
		t.Fatalf("sweep: %v", err)
	}
	if census.Scanned == 0 {
		t.Skip("no job documents to sweep")
	}
	if census.Failed != 0 {
		t.Errorf("%d of %d job documents were rejected by models.Job: %v", census.Failed, census.Scanned, census.DecodeErrors)
	}
	if len(census.Changed) != 0 {
		t.Errorf("models.Job did not reproduce every stored value: %v", census.Changed)
	}
}

func TestLive_corpusIsOnePerDocument(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	path := filepath.Join(t.TempDir(), "jobs.jsonl")
	written, err := modelparity.Corpus[models.Job](ctx, mongo.JobDocuments.Collection(), path)
	if err != nil {
		t.Fatalf("corpus: %v", err)
	}
	if written == 0 {
		t.Skip("no job documents to write")
	}
	contents, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read corpus: %v", err)
	}
	lines := 0
	for _, b := range contents {
		if b == '\n' {
			lines++
		}
	}
	if lines != written {
		t.Errorf("corpus holds %d lines for %d documents", lines, written)
	}
}
