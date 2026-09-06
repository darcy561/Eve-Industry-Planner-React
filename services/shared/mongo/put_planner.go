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
