package changestream

import (
	"strings"
	"testing"

	eipmongo "eve-industry-planner/shared/mongo"
)

func TestValidateCollectionGroups_ok(t *testing.T) {
	groups := []CollectionGroup{
		Group("a", eipmongo.CollectionAccounts),
		Group("b", eipmongo.CollectionJobs),
	}
	if err := validateCollectionGroups(groups); err != nil {
		t.Fatal(err)
	}
}

func TestValidateCollectionGroups_duplicateCollection(t *testing.T) {
	groups := []CollectionGroup{
		Group("a", eipmongo.CollectionAccounts),
		Group("b", eipmongo.CollectionAccounts),
	}
	err := validateCollectionGroups(groups)
	if err == nil || !strings.Contains(err.Error(), eipmongo.CollectionAccounts) {
		t.Fatalf("expected duplicate collection error, got %v", err)
	}
}

func TestValidateCollectionGroups_emptyGroup(t *testing.T) {
	err := validateCollectionGroups([]CollectionGroup{{ID: "x", Collections: nil}})
	if err == nil {
		t.Fatal("expected error for empty collections")
	}
}

// A collection a client may subscribe to but nothing watches is one whose changes
// never arrive: the subscription is authorised, the delivery silently absent. The
// two lists are maintained in different packages, so nothing but this pairs them.
func TestEverySubscribableCollectionIsWatched(t *testing.T) {
	t.Parallel()

	watched := map[string]struct{}{}
	for _, group := range CollectionGroups() {
		for _, collection := range group.Collections {
			watched[collection] = struct{}{}
		}
	}

	subscribable := append(
		append([]string{}, eipmongo.AccountOwnedCollections()...),
		eipmongo.PlannerHeldCollections()...,
	)
	for _, collection := range subscribable {
		if _, found := watched[collection]; !found {
			t.Errorf("%s can be subscribed to but no change stream watches it", collection)
		}
	}
}
