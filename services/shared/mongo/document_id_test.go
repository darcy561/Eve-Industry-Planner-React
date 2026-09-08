package mongo

import (
	"testing"

	"eve-industry-planner/shared/models"
)

func TestOwnerScopedDocumentIDCarriesTheOwner(t *testing.T) {
	t.Parallel()

	got := OwnerScopedDocumentID(models.AccountOwner("acct-1"), "job-1")
	if got != "account:acct-1|job-1" {
		t.Fatalf("id = %q, want account:acct-1|job-1", got)
	}
}

// The same bare id under two planners must produce two documents, which is the
// whole reason the owner is in the id.
func TestOwnerScopedDocumentIDSeparatesTwoOwners(t *testing.T) {
	t.Parallel()

	mine := OwnerScopedDocumentID(models.AccountOwner("acct-1"), "job-1")
	theirs := OwnerScopedDocumentID(models.CorporationOwner("corp_ref"), "job-1")
	if mine == theirs {
		t.Fatalf("two owners produced one id: %q", mine)
	}
}

// An id that cannot be scoped is empty rather than partial: a filter built from
// half an id would match the wrong document.
func TestOwnerScopedDocumentIDRefusesIncompleteInput(t *testing.T) {
	t.Parallel()

	for _, tc := range []struct {
		name  string
		owner models.Owner
		id    string
	}{
		{"no owner", models.Owner{}, "job-1"},
		{"no id", models.AccountOwner("acct-1"), ""},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			if got := OwnerScopedDocumentID(tc.owner, tc.id); got != "" {
				t.Fatalf("id = %q, want empty", got)
			}
		})
	}
}

func TestOwnerScopedDocumentIDsDropsWhatItCannotScope(t *testing.T) {
	t.Parallel()

	got := OwnerScopedDocumentIDs(models.AccountOwner("acct-1"), []string{"job-1", "", "job-2"})
	want := []string{"account:acct-1|job-1", "account:acct-1|job-2"}
	if len(got) != len(want) {
		t.Fatalf("ids = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("ids = %v, want %v", got, want)
		}
	}
}

func TestBareDocumentIDIsWhatAClientKnows(t *testing.T) {
	t.Parallel()

	if got := BareDocumentID("account:acct-1|job-1"); got != "job-1" {
		t.Fatalf("bare id = %q, want job-1", got)
	}
}

// An account's own singleton documents are keyed by the account id alone, so an
// id with no owner is already bare.
func TestBareDocumentIDLeavesAnUnscopedIDAlone(t *testing.T) {
	t.Parallel()

	if got := BareDocumentID("acct-1"); got != "acct-1" {
		t.Fatalf("bare id = %q, want acct-1", got)
	}
}

// A job id containing the separator still round-trips: only the first one
// divides the owner from the id.
func TestDocumentIDRoundTripsAnIDContainingTheSeparator(t *testing.T) {
	t.Parallel()
	owner := models.AccountOwner("acct-1")

	stored := OwnerScopedDocumentID(owner, "job|with|pipes")
	if got := BareDocumentID(stored); got != "job|with|pipes" {
		t.Fatalf("bare id = %q, want job|with|pipes", got)
	}
	got, err := OwnerFromDocumentID(stored)
	if err != nil {
		t.Fatalf("OwnerFromDocumentID: %v", err)
	}
	if got != owner {
		t.Fatalf("owner = %v, want %v", got, owner)
	}
}

func TestOwnerFromDocumentIDRefusesAnIDWithNoOwner(t *testing.T) {
	t.Parallel()

	if _, err := OwnerFromDocumentID("job-1"); err == nil {
		t.Fatal("an id carrying no owner was accepted")
	}
}

// An owner kind nothing can read is refused rather than carried, the way
// ParseOwnerKey refuses it.
func TestOwnerFromDocumentIDRefusesAnUnknownKind(t *testing.T) {
	t.Parallel()

	if _, err := OwnerFromDocumentID("wizard:merlin|job-1"); err == nil {
		t.Fatal("an unknown owner kind was accepted")
	}
}
