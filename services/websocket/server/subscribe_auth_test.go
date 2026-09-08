package server

import (
	"slices"
	"testing"

	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"
)

func clientWithScopes(accountID string, owners ...models.Owner) *Client {
	return &Client{AccountID: accountID, Scopes: models.NewOwnerKeys().Add(owners...).Normalized()}
}

func TestDocSubscribeAuthorized_singletonAccountDocs(t *testing.T) {
	t.Parallel()
	s := &Server{}
	client := clientWithScopes("acc123", models.AccountOwner("acc123"))

	if !s.docSubscribeAuthorized("accounts.acc123", client) {
		t.Fatal("expected accounts doc for same account")
	}
	if s.docSubscribeAuthorized("accounts.other", client) {
		t.Fatal("expected reject accounts doc for other account id")
	}
	if !s.docSubscribeAuthorized("account_settings.acc123", client) {
		t.Fatal("expected account_settings for same account")
	}
	if s.docSubscribeAuthorized("account_settings.other", client) {
		t.Fatal("expected reject settings for other account")
	}
}

func TestDocSubscribeAuthorized_unknownCollectionDenied(t *testing.T) {
	t.Parallel()
	s := &Server{}
	client := clientWithScopes("acc123", models.AccountOwner("acc123"), models.CorporationOwner("corp_ref"))
	if s.docSubscribeAuthorized("blueprints.123", client) {
		t.Fatal("expected deny unknown / public collection")
	}
	if s.docSubscribeAuthorized("random.foo", client) {
		t.Fatal("expected deny unknown collection")
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

// A planner-held document is authorised by the connection's scopes, which
// already say which planner it reads for. The id a client sends is bare and is
// resolved within them; it never has to carry an owner.
func TestDocSubscribePlannerHeldFollowsTheConnectionsScopes(t *testing.T) {
	t.Parallel()
	s := &Server{}

	inPlanner := clientWithScopes("acct-1", models.AccountOwner("acct-1"), models.CorporationOwner("corp_ref"))
	ownOnly := clientWithScopes("acct-1", models.AccountOwner("acct-1"))
	noScopes := &Client{AccountID: "acct-1"}

	for _, collection := range eipmongo.PlannerHeldCollections() {
		docID := collection + ".job-1"
		if !s.docSubscribeAuthorized(docID, inPlanner) {
			t.Errorf("%s: refused for a connection whose scopes hold a planner", collection)
		}
		// The account kind's set holds no planner-held collection, so an
		// account's own planner alone grants nothing here.
		if s.docSubscribeAuthorized(docID, ownOnly) {
			t.Errorf("%s: granted on the account's own scope alone", collection)
		}
		if s.docSubscribeAuthorized(docID, noScopes) {
			t.Errorf("%s: granted with no scopes at all", collection)
		}
	}
}

func TestDocSubscribeRefusesAMalformedID(t *testing.T) {
	t.Parallel()
	s := &Server{}
	client := clientWithScopes("acct-1", models.CorporationOwner("corp_ref"))
	for _, docID := range []string{"", "job_documents", ".job-1", "job_documents."} {
		if s.docSubscribeAuthorized(docID, client) {
			t.Errorf("%q was authorised", docID)
		}
	}
	if s.docSubscribeAuthorized("job_documents.job-1", nil) {
		t.Error("a nil client was authorised")
	}
}
