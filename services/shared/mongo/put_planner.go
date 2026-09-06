package mongo

import (
	"context"
	"fmt"
	"time"

	"eve-industry-planner/shared/models"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// DefaultAccountPlannerName is what an account's own planner is called until the
// account renames it.
const DefaultAccountPlannerName = "My planner"

// EnsureAccountPlanner gives an account the planner it works in, and puts the
// account in it.
//
// Written on insert only: a repeat call adds nothing and rewrites nothing, so an
// account that has renamed its planner keeps the name. That is what lets the
// release backfill and first login share one implementation without either
// undoing the other.
//
// The planner's `_id` is the account's owner key, so nothing is minted here — the
// documents the account already holds carry that same id inside `_meta.owner`.
func (m *Mongo) EnsureAccountPlanner(ctx context.Context, accountID string, now time.Time) error {
	if m == nil || accountID == "" {
		return fmt.Errorf("EnsureAccountPlanner: invalid arguments")
	}
	owner := models.AccountOwner(accountID)
	if owner.IsZero() {
		return fmt.Errorf("account id %q yields no owner", accountID)
	}
	plannerID := owner.Key()

	planner := bson.M{
		"schemaVersion": models.PlannerSchemaCurrent,
		"name":          DefaultAccountPlannerName,
		"memberCount":   1,
		"createdBy":     accountID,
		"_meta": bson.M{
			"owner":        bson.M{"kind": string(owner.Kind), "id": owner.ID},
			"lastModified": now.UTC(),
		},
	}
	if _, err := m.Planners.Collection().UpdateOne(ctx,
		bson.M{"_id": plannerID},
		bson.M{"$setOnInsert": planner},
		options.UpdateOne().SetUpsert(true),
	); err != nil {
		return fmt.Errorf("write planner for %s: %w", accountID, err)
	}

	membership := bson.M{
		"schemaVersion": models.PlannerMembershipSchemaCurrent,
		"plannerID":     plannerID,
		"accountID":     accountID,
		"joinedAt":      now.UTC(),
		"joinMethod":    bson.M{string(models.JoinKindSelf): bson.M{}},
	}
	if _, err := m.PlannerMemberships.Collection().UpdateOne(ctx,
		bson.M{"_id": models.PlannerMembershipID(plannerID, accountID)},
		bson.M{"$setOnInsert": membership},
		options.UpdateOne().SetUpsert(true),
	); err != nil {
		return fmt.Errorf("write membership for %s: %w", accountID, err)
	}
	return nil
}

// HasAccountPlanner reports whether the account's own planner exists.
func (m *Mongo) HasAccountPlanner(ctx context.Context, accountID string) (bool, error) {
	if m == nil || accountID == "" {
		return false, fmt.Errorf("HasAccountPlanner: invalid arguments")
	}
	owner := models.AccountOwner(accountID)
	if owner.IsZero() {
		return false, fmt.Errorf("account id %q yields no owner", accountID)
	}
	held, err := m.Planners.Collection().CountDocuments(ctx, bson.M{"_id": owner.Key()})
	if err != nil {
		return false, err
	}
	return held > 0, nil
}
