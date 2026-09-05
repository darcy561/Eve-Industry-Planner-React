package models

import (
	"slices"
	"testing"
)

func TestOwnerKeysAddSkipsWhatTheVocabularyRefuses(t *testing.T) {
	t.Parallel()
	keys := OwnerKeys(nil).Add(
		AccountOwner("acct-1"),
		Owner{Kind: OwnerCorporation, ID: "not-a-ref"},
		Owner{Kind: "nonsense", ID: "x"},
	)
	if want := (OwnerKeys{"account:acct-1"}); !slices.Equal(keys, want) {
		t.Fatalf("keys = %v, want %v", keys, want)
	}
}

// An empty ceiling must permit nothing: a session with no grants reaches no owner.
func TestOwnerKeysWithinAnEmptyCeilingIsEmpty(t *testing.T) {
	t.Parallel()
	asked := OwnerKeys{"account:a", "account:b"}
	if got := asked.Within(nil); len(got) != 0 {
		t.Fatalf("Within(empty) = %v, want nothing", got)
	}
}

func TestOwnerKeysWithinKeepsOnlyWhatTheCeilingHolds(t *testing.T) {
	t.Parallel()
	asked := OwnerKeys{"account:a", "account:b", " account:c "}
	ceiling := OwnerKeys{"account:a", "account:c"}
	want := OwnerKeys{"account:a", "account:c"}
	if got := asked.Within(ceiling); !slices.Equal(got, want) {
		t.Fatalf("Within = %v, want %v", got, want)
	}
}

// Union widens: the repair adds an account's own key to what a record already
// held, and must not drop the rest.
func TestOwnerKeysUnionKeepsWhatIsHeld(t *testing.T) {
	t.Parallel()
	held := OwnerKeys{"account:a"}
	got := held.Union(OwnerKeys{"account:a", "account:b", "", "  "})
	want := OwnerKeys{"account:a", "account:b"}
	if !slices.Equal(got, want) {
		t.Fatalf("Union = %v, want %v", got, want)
	}
	if !slices.Equal(held, OwnerKeys{"account:a"}) {
		t.Fatalf("Union mutated its receiver: %v", held)
	}
}

func TestOwnerKeysNormalizedSortsAndDeduplicates(t *testing.T) {
	t.Parallel()
	got := OwnerKeys{"account:b", "account:a", "account:b", " ", ""}.Normalized()
	want := OwnerKeys{"account:a", "account:b"}
	if !slices.Equal(got, want) {
		t.Fatalf("Normalized = %v, want %v", got, want)
	}
	if got := OwnerKeys(nil).Normalized(); got == nil || len(got) != 0 {
		t.Fatalf("Normalized(nil) = %v, want an empty non-nil set", got)
	}
}

// A key names its kind, so one kind's id cannot answer for another's.
func TestOwnerKeysHasDistinguishesKinds(t *testing.T) {
	t.Parallel()
	corp := CorporationOwner(validCorpRef)
	keys := OwnerKeys(nil).Add(corp)
	if !keys.Has(corp) {
		t.Fatalf("keys = %v, want the corporation", keys)
	}
	if keys.Has(Owner{Kind: OwnerAlliance, ID: corp.ID}) {
		t.Fatal("a corporation key must not answer for the alliance of the same id")
	}
	if keys.Has(Owner{}) {
		t.Fatal("the zero owner must never be granted")
	}
}

func TestOwnerKeysAddRefsKeepsOnlyWellFormedRefs(t *testing.T) {
	t.Parallel()
	keys := NewOwnerKeys().AddRefs(OwnerCorporation, []string{
		validCorpRef,
		"  " + validCorpRef + "  ",
		"not-a-ref",
		"",
	})
	want := OwnerKeys{
		CorporationOwner(validCorpRef).Key(),
		CorporationOwner(validCorpRef).Key(),
	}
	if !slices.Equal(keys, want) {
		t.Fatalf("AddRefs = %v, want %v", keys, want)
	}
}

// A raw EVE id is not a ref, and must never become a key: the org kinds address
// refs, so an id slipping through would key a pool nothing else can address.
func TestOwnerKeysAddRefsRefusesRawEntityIDs(t *testing.T) {
	t.Parallel()
	if keys := NewOwnerKeys().AddRefs(OwnerAlliance, []string{"99000001"}); len(keys) != 0 {
		t.Fatalf("AddRefs(raw id) = %v, want nothing", keys)
	}
}

func TestOwnerKeysIDsForKindReturnsOneKindsIDs(t *testing.T) {
	t.Parallel()
	keys := NewOwnerKeys().Add(
		AccountOwner("acct-1"),
		CorporationOwner(validCorpRef),
		AllianceOwner(validAllianceRef),
	)
	if got, want := keys.IDsForKind(OwnerCorporation), []string{validCorpRef}; !slices.Equal(got, want) {
		t.Fatalf("IDsForKind(corporation) = %v, want %v", got, want)
	}
	if got, want := keys.IDsForKind(OwnerAccount), []string{"acct-1"}; !slices.Equal(got, want) {
		t.Fatalf("IDsForKind(account) = %v, want %v", got, want)
	}
	if got := keys.IDsForKind(OwnerPlanner); len(got) != 0 {
		t.Fatalf("IDsForKind(planner) = %v, want nothing", got)
	}
}

// A key the vocabulary cannot parse belongs to no kind, so it must not be
// reported as one rather than crashing the read.
func TestOwnerKeysIDsForKindSkipsUnparseableKeys(t *testing.T) {
	t.Parallel()
	keys := OwnerKeys{"not-a-key", "account:acct-1"}
	if got, want := keys.IDsForKind(OwnerAccount), []string{"acct-1"}; !slices.Equal(got, want) {
		t.Fatalf("IDsForKind = %v, want %v", got, want)
	}
}

func TestNewOwnerKeysStartsEmpty(t *testing.T) {
	t.Parallel()
	if got := NewOwnerKeys(); len(got) != 0 {
		t.Fatalf("NewOwnerKeys() = %v, want empty", got)
	}
}
