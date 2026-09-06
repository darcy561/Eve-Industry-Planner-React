package helper_test

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/api/helper"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"
	eipmongo "eve-industry-planner/shared/mongo"
	"eve-industry-planner/testing/mongolive"

	"go.mongodb.org/mongo-driver/v2/bson"
)

const loginScratchAccount = "eip-parity-login-account"

// accountDocumentPresence reports which of the documents a first login creates
// exist, and what each is keyed by. A document added to the login path belongs
// here, or nothing checks that a new account receives it.
func accountDocumentPresence(ctx context.Context, mongo *eipmongo.Mongo, accountID string) (map[string]bool, error) {
	owner := models.AccountOwner(accountID)
	present := map[string]bool{}
	for _, target := range []struct {
		name   string
		docs   *eipmongo.Docs
		filter bson.M
	}{
		{"user", mongo.Users, bson.M{"_id": accountID}},
		{"account settings", mongo.ApplicationSettings, bson.M{"_id": accountID}},
		{"planner", mongo.Planners, bson.M{"_id": owner.Key()}},
		{"membership", mongo.PlannerMemberships,
			bson.M{"_id": planner.MembershipID(owner.Key(), accountID)}},
		{"planner settings", mongo.PlannerSettings, bson.M{"_id": owner.Key()}},
	} {
		count, err := target.docs.Collection().CountDocuments(ctx, target.filter)
		if err != nil {
			return nil, err
		}
		present[target.name] = count > 0
	}
	return present, nil
}

// A new account arrives with nothing and leaves with the whole set. Each document
// is created by its own code path, so only a test of the sequence catches one
// that is never reached.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_login_givesANewAccountEveryDocument(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	account := loginScratchAccount + "-new"
	mongolive.ScratchAccount(t, mongo, account)

	resolution, err := helper.ResolveUserDocumentsForLogin(ctx, mongo, account)
	if err != nil {
		t.Fatalf("ResolveUserDocumentsForLogin: %v", err)
	}
	if !resolution.FirstLogin {
		t.Error("an account with no documents did not report as a first login")
	}

	present, err := accountDocumentPresence(ctx, mongo, account)
	if err != nil {
		t.Fatalf("read documents: %v", err)
	}
	for name, found := range present {
		if !found {
			t.Errorf("a new account has no %s document", name)
		}
	}

	// Anything the change stream delivers needs a cursor and an owner; a document
	// without them is dropped by the SPA rather than degraded.
	settings, found, err := mongo.LoadPlannerSettings(ctx, models.AccountOwner(account))
	if err != nil {
		t.Fatalf("LoadPlannerSettings: %v", err)
	}
	if !found {
		t.Fatal("planner settings absent after a first login")
	}
	if settings.MetaData.LastModified.IsZero() || settings.MetaData.Owner.IsZero() {
		t.Errorf("planner settings _meta = %+v, want a cursor and an owner", settings.MetaData)
	}
}

// Login runs on every refresh, not only the first, so resolving again must leave
// what the account has changed alone.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_login_leavesAnEstablishedAccountAlone(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	account := loginScratchAccount + "-repeat"
	owner := models.AccountOwner(account)
	mongolive.ScratchAccount(t, mongo, account)

	if _, err := helper.ResolveUserDocumentsForLogin(ctx, mongo, account); err != nil {
		t.Fatalf("first resolve: %v", err)
	}

	// The account renames its planner and changes a setting it owns.
	if _, err := mongo.Planners.Collection().UpdateOne(ctx,
		bson.M{"_id": owner.Key()},
		bson.M{"$set": bson.M{"name": "Renamed by its owner"}}); err != nil {
		t.Fatalf("rename planner: %v", err)
	}
	if _, err := mongo.PlannerSettings.Collection().UpdateOne(ctx,
		bson.M{"_id": owner.Key()},
		bson.M{"$set": bson.M{"defaultMaterialEfficiencyValue": 7}}); err != nil {
		t.Fatalf("change planner settings: %v", err)
	}

	resolution, err := helper.ResolveUserDocumentsForLogin(ctx, mongo, account)
	if err != nil {
		t.Fatalf("second resolve: %v", err)
	}
	if resolution.FirstLogin {
		t.Error("an established account reported as a first login")
	}

	var plannerDoc planner.Planner
	if err := mongo.Planners.Collection().
		FindOne(ctx, bson.M{"_id": owner.Key()}).Decode(&plannerDoc); err != nil {
		t.Fatalf("read planner: %v", err)
	}
	if plannerDoc.Name != "Renamed by its owner" {
		t.Errorf("planner name = %q, want the rename to survive a later login", plannerDoc.Name)
	}

	settings, _, err := mongo.LoadPlannerSettings(ctx, owner)
	if err != nil {
		t.Fatalf("LoadPlannerSettings: %v", err)
	}
	if settings.DefaultMaterialEfficiencyValue != 7 {
		t.Errorf("ME = %d, want the value the account set to survive a later login",
			settings.DefaultMaterialEfficiencyValue)
	}
}

// Login is a repair as well as a creation: each document is written only when it
// is absent, so any one of them deleted comes back without the others being
// touched. The comment on ResolveUserDocumentsForLogin claims this; nothing
// checked it.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_login_repairsAnyOneDocumentAlone(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	account := loginScratchAccount + "-repair"
	owner := models.AccountOwner(account)

	for _, target := range []struct {
		name   string
		docs   func() *eipmongo.Docs
		filter bson.M
	}{
		{"planner", func() *eipmongo.Docs { return mongo.Planners }, bson.M{"_id": owner.Key()}},
		{"membership", func() *eipmongo.Docs { return mongo.PlannerMemberships },
			bson.M{"_id": planner.MembershipID(owner.Key(), account)}},
		{"planner settings", func() *eipmongo.Docs { return mongo.PlannerSettings },
			bson.M{"_id": owner.Key()}},
		{"account settings", func() *eipmongo.Docs { return mongo.ApplicationSettings },
			bson.M{"_id": account}},
	} {
		t.Run(target.name, func(t *testing.T) {
			mongolive.ScratchAccount(t, mongo, account)
			if _, err := helper.ResolveUserDocumentsForLogin(ctx, mongo, account); err != nil {
				t.Fatalf("establish the account: %v", err)
			}
			if _, err := target.docs().Collection().DeleteOne(ctx, target.filter); err != nil {
				t.Fatalf("delete the %s document: %v", target.name, err)
			}

			if _, err := helper.ResolveUserDocumentsForLogin(ctx, mongo, account); err != nil {
				t.Fatalf("resolve after deleting the %s document: %v", target.name, err)
			}

			present, err := accountDocumentPresence(ctx, mongo, account)
			if err != nil {
				t.Fatalf("read documents: %v", err)
			}
			for name, found := range present {
				if !found {
					t.Errorf("after deleting %s and resolving, %s is missing", target.name, name)
				}
			}
		})
	}
}

// An account that has a planner but no settings for it is the state every account
// was in between the planner landing and its settings landing. The seed has to
// reach it, and a step that visits only accounts without a planner does not.
// Requires EIP_MONGO_PARITY_LIVE=1.
func TestLive_login_seedsSettingsForAPlannerThatPredatesThem(t *testing.T) {
	mongo := mongolive.Require(t)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	account := loginScratchAccount + "-partial"
	owner := models.AccountOwner(account)
	mongolive.ScratchAccount(t, mongo, account)

	if _, err := helper.ResolveUserDocumentsForLogin(ctx, mongo, account); err != nil {
		t.Fatalf("establish the account: %v", err)
	}
	// Back to the state an account was left in before planner settings existed.
	if _, err := mongo.PlannerSettings.Collection().
		DeleteOne(ctx, bson.M{"_id": owner.Key()}); err != nil {
		t.Fatalf("remove planner settings: %v", err)
	}

	if _, err := helper.ResolveUserDocumentsForLogin(ctx, mongo, account); err != nil {
		t.Fatalf("resolve: %v", err)
	}

	if _, found, err := mongo.LoadPlannerSettings(ctx, owner); err != nil {
		t.Fatalf("LoadPlannerSettings: %v", err)
	} else if !found {
		t.Fatal("an account whose planner predates its settings did not gain them")
	}
}
