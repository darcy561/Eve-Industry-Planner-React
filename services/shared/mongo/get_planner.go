package mongo

import (
	"context"
	"errors"
	"fmt"

	"eve-industry-planner/shared/documentschema"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// OwnerKeysForAccount returns every owner the account holds a membership for,
// which is what a session may reach.
//
// The account's own planner is among them rather than added separately, so this
// is the whole of what a session may reach and nothing downstream adds to it.
//
// That makes the call order matter at the sites that use it: the planner write
// has to have run first, or an account whose row is missing is handed an empty
// list for the life of that session. Both callers ensure the row before reading.
//
// **A row grants while it exists.** Access ends when the row goes, and the row
// goes when a reconcile finds the account is no longer in the entity or when the
// maintenance sweep clears one belonging to an account that has stopped logging
// in. There is no separate expiry: an account that logs in keeps its rows current
// through the grants task on its own, so a second mechanism aging them out would
// only disagree with the reconcile that just wrote them.
func (m *Mongo) OwnerKeysForAccount(ctx context.Context, accountID string) (models.OwnerKeys, error) {
	if m == nil || accountID == "" {
		return nil, fmt.Errorf("OwnerKeysForAccount: invalid arguments")
	}
	plannerIDs, err := m.PlannerMemberships.DistinctStrings(ctx, "plannerID",
		bson.M{"accountID": accountID})
	if err != nil {
		return nil, fmt.Errorf("list memberships for %s: %w", accountID, err)
	}

	keys := make(models.OwnerKeys, 0, len(plannerIDs))
	for _, plannerID := range plannerIDs {
		// A planner id is an owner key, so a row naming one nothing can parse is
		// dropped rather than granted: it addresses no owner either way.
		if _, err := models.ParseOwnerKey(plannerID); err != nil {
			continue
		}
		keys = append(keys, plannerID)
	}
	return keys.Normalized(), nil
}

// AccountMayReach reports whether the account holds a membership for the owner.
//
// Read from the rows rather than from a session's grants: grants are a cache with
// a session's lifetime, so a membership removed a moment ago is still in one. An
// authorisation answer that can be stale in the permissive direction is the wrong
// kind of cheap, and the callers are already reading this database.
//
// An account's own planner is answered before the handle is needed: it holds that
// membership by construction, so reading its own documents does not depend on the
// database being reachable.
func (m *Mongo) AccountMayReach(ctx context.Context, accountID string, owner models.Owner) (bool, error) {
	if accountID == "" {
		return false, fmt.Errorf("AccountMayReach: invalid arguments")
	}
	if owner.IsZero() {
		return false, nil
	}
	if owner == models.AccountOwner(accountID) {
		return true, nil
	}
	if m == nil {
		return false, fmt.Errorf("AccountMayReach: no mongo handle")
	}
	held, err := m.PlannerMemberships.Collection().CountDocuments(ctx,
		bson.M{"_id": planner.MembershipID(owner.Key(), accountID)})
	if err != nil {
		return false, fmt.Errorf("read membership for %s: %w", accountID, err)
	}
	return held > 0, nil
}

// LoadPlannerSettings reads the settings a planner's work is done under.
//
// A planner with no settings document is not an error: it reports absent, and the
// caller falls back to the account's own settings, which is what resolves today.
// That keeps a planner readable before its settings have been seeded.
func (m *Mongo) LoadPlannerSettings(ctx context.Context, owner models.Owner) (planner.Settings, bool, error) {
	if m == nil || owner.IsZero() {
		return planner.Settings{}, false, fmt.Errorf("LoadPlannerSettings: invalid arguments")
	}

	var doc planner.Settings
	err := Retry(ctx, "LoadPlannerSettings", func() error {
		return m.PlannerSettings.Collection().
			FindOne(ctx, bson.M{"_id": owner.Key()}).
			Decode(&doc)
	})
	if errors.Is(err, mongo.ErrNoDocuments) {
		return planner.Settings{}, false, nil
	}
	if err != nil {
		return planner.Settings{}, false, fmt.Errorf("read settings for %s: %w", owner.Key(), err)
	}

	documentschema.Upgrader{}.PlannerSettings(&doc)
	return doc, true, nil
}
