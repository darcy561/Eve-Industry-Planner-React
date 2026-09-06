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
// **The two writes are deliberately independent.** Each half is created only if
// that half is absent, so a planner whose membership row has been deleted regains
// the row without the planner being touched, and the reverse. Collapsing them into
// one guarded block — "if the planner exists, do nothing" — would read as a tidier
// version of the same thing and would silently stop repairing the other half.
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

	planner := models.Planner{
		SchemaVersion: models.PlannerSchemaCurrent,
		Name:          DefaultAccountPlannerName,
		MemberCount:   1,
		CreatedBy:     accountID,
	}
	planner.MetaData.Owner = owner
	planner.MetaData.LastModified = now.UTC()
	if err := insertIfAbsent(ctx, m.Planners, plannerID, planner); err != nil {
		return fmt.Errorf("write planner for %s: %w", accountID, err)
	}

	membership := models.PlannerMembership{
		SchemaVersion: models.PlannerMembershipSchemaCurrent,
		PlannerID:     plannerID,
		AccountID:     accountID,
		JoinedAt:      now.UTC(),
		JoinMethod:    models.JoinMethod{Self: &models.SelfJoin{}},
	}
	if err := membership.JoinMethod.Validate(); err != nil {
		return fmt.Errorf("membership for %s: %w", accountID, err)
	}
	if err := insertIfAbsent(ctx, m.PlannerMemberships, models.PlannerMembershipID(plannerID, accountID), membership); err != nil {
		return fmt.Errorf("write membership for %s: %w", accountID, err)
	}
	return nil
}

// insertIfAbsent writes doc under docID only when no document holds that id.
//
// The document is marshalled from its model rather than assembled as a map, so
// the stored shape cannot drift from the struct that reads it back. `_id` is
// dropped from the payload because the filter already carries it, and Mongo
// refuses an update that names the id twice.
func insertIfAbsent(ctx context.Context, docs *Docs, docID string, doc any) error {
	coll, err := docs.requireColl()
	if err != nil {
		return err
	}
	raw, err := bson.Marshal(doc)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}
	var fields bson.M
	if err := bson.Unmarshal(raw, &fields); err != nil {
		return fmt.Errorf("unmarshal: %w", err)
	}
	delete(fields, "_id")

	_, err = coll.UpdateOne(ctx,
		bson.M{"_id": docID},
		bson.M{"$setOnInsert": fields},
		options.UpdateOne().SetUpsert(true),
	)
	return err
}

// OwnerKeysForAccount returns every owner the account holds a membership for,
// which is what a session may reach.
//
// The account's own planner is among them rather than added separately: the
// backfill and first login both write that membership row, so an account with no
// row at all is one whose documents nothing has created yet, not one that should
// be granted its own key regardless.
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
