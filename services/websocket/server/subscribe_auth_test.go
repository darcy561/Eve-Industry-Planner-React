package server

import (
	"context"
	"eve-industry-planner/shared/models"
	"slices"
	"testing"

	eipmongo "eve-industry-planner/shared/mongo"
	"eve-industry-planner/shared/stackservices"
)

func TestDocSubscribeAuthorized_singletonAccountDocs(t *testing.T) {
	s := &Server{Stack: &stackservices.Clients{}}

	if !s.docSubscribeAuthorized(context.Background(), "accounts.acc123", "acc123") {
		t.Fatal("expected accounts doc for same account")
	}
	if s.docSubscribeAuthorized(context.Background(), "accounts.other", "acc123") {
		t.Fatal("expected reject accounts doc for other account id")
	}
	if !s.docSubscribeAuthorized(context.Background(), "account_settings.acc123", "acc123") {
		t.Fatal("expected account_settings for same account")
	}
	if s.docSubscribeAuthorized(context.Background(), "account_settings.other", "acc123") {
		t.Fatal("expected reject settings for other account")
	}
}

func TestDocSubscribeAuthorized_unknownCollectionDenied(t *testing.T) {
	s := &Server{Stack: &stackservices.Clients{}}
	if s.docSubscribeAuthorized(context.Background(), "blueprints.123", "acc123") {
		t.Fatal("expected deny unknown / public collection")
	}
	if s.docSubscribeAuthorized(context.Background(), "random.foo", "acc123") {
		t.Fatal("expected deny unknown collection")
	}
}

func TestDocSubscribeAuthorized_jobsRequiresMongo(t *testing.T) {
	s := &Server{Stack: &stackservices.Clients{Mongo: nil}}
	if s.docSubscribeAuthorized(context.Background(), "jobs.any-id", "acc123") {
		t.Fatal("expected deny jobs when mongo unavailable")
	}
}

// The two collection sets are the ones the design names, and a collection in
// neither is refused. A collection added to the planner set reaches every planner
// of every kind, so what is in each list is the whole of the policy.
func TestDocSubscribeCollectionSetsMatchTheOwnerKinds(t *testing.T) {
	t.Parallel()
	account := eipmongo.CollectionsForOwnerKind(models.OwnerAccount)
	if !slices.Contains(account, eipmongo.CollectionAccountSettings) {
		t.Fatalf("account kind = %v, want the account's settings", account)
	}
	if slices.Contains(account, eipmongo.CollectionJobDocuments) {
		t.Fatalf("account kind = %v, must not carry planner-held documents", account)
	}

	// Every kind that names a planner receives the same set: the collections
	// follow from the kind being a planner, not from which planner it is.
	for _, kind := range []models.OwnerKind{models.OwnerPlanner, models.OwnerCorporation, models.OwnerAlliance} {
		got := eipmongo.CollectionsForOwnerKind(kind)
		if !slices.Equal(got, eipmongo.PlannerHeldCollections()) {
			t.Fatalf("%s = %v, want the planner-held set", kind, got)
		}
	}

	if got := eipmongo.CollectionsForOwnerKind(""); got != nil {
		t.Fatalf("the empty kind = %v, want nothing", got)
	}
}

// A planner-held document is authorised by membership, so a client with no Mongo
// cannot be granted one — the lookup is the authorisation.
func TestDocSubscribePlannerHeldNeedsAMembershipLookup(t *testing.T) {
	t.Parallel()
	s := &Server{}
	for _, collection := range eipmongo.PlannerHeldCollections() {
		if s.docSubscribeAuthorized(context.Background(), collection+".doc-1", "acct-1") {
			t.Fatalf("%s was authorised without a membership lookup", collection)
		}
	}
}
