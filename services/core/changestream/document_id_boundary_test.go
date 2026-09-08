package changestream

import (
	"testing"

	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"
)

// The stored id carries its owner; the id on the wire does not. A browser sends
// and receives the bare id — it is what a URL carries and what the job store
// keys on — and the owner travels beside it as OwnerKey.
func TestDocIDOnTheWireIsTheBareID(t *testing.T) {
	t.Parallel()
	owner := models.CorporationOwner("corp_ref")

	stored := eipmongo.OwnerScopedDocumentID(owner, "job-1")
	if stored == "job-1" {
		t.Fatal("the stored id did not take the owner")
	}
	if got := eipmongo.BareDocumentID(stored); got != "job-1" {
		t.Fatalf("wire docID = %q, want job-1", got)
	}
}

// Account singletons are keyed by the account id alone and predate owner
// scoping, so the same conversion must leave them untouched.
func TestDocIDOnTheWireLeavesASingletonAlone(t *testing.T) {
	t.Parallel()

	if got := eipmongo.BareDocumentID("acct-1"); got != "acct-1" {
		t.Fatalf("wire docID = %q, want acct-1", got)
	}
}

// A delete with no preimage states no owner, and the stored id is what recovers
// it — which is why the conversion keeps the stored form to read from.
func TestADeletedPlannerDocumentsOwnerIsReadableFromItsID(t *testing.T) {
	t.Parallel()
	owner := models.CorporationOwner("corp_ref")

	got, err := eipmongo.OwnerFromDocumentID(eipmongo.OwnerScopedDocumentID(owner, "job-1"))
	if err != nil {
		t.Fatalf("OwnerFromDocumentID: %v", err)
	}
	if got != owner {
		t.Fatalf("owner = %v, want %v", got, owner)
	}
}
