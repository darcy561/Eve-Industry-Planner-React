package mongo

import (
	"context"
	"fmt"

	"eve-industry-planner/shared/models"

	"go.mongodb.org/mongo-driver/v2/bson"
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
func (m *Mongo) OwnerKeysForAccount(ctx context.Context, accountID string) (models.OwnerKeys, error) {
	if m == nil || accountID == "" {
		return nil, fmt.Errorf("OwnerKeysForAccount: invalid arguments")
	}
	plannerIDs, err := m.PlannerMemberships.DistinctStrings(ctx, "plannerID", bson.M{"accountID": accountID})
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
func (m *Mongo) AccountMayReach(ctx context.Context, accountID string, owner models.Owner) (bool, error) {
	if m == nil || accountID == "" {
		return false, fmt.Errorf("AccountMayReach: invalid arguments")
	}
	if owner.IsZero() {
		return false, nil
	}
	held, err := m.PlannerMemberships.Collection().CountDocuments(ctx,
		bson.M{"_id": models.PlannerMembershipID(owner.Key(), accountID)})
	if err != nil {
		return false, fmt.Errorf("read membership for %s: %w", accountID, err)
	}
	return held > 0, nil
}
