package mongo

import (
	"context"
	"fmt"
	"time"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// DefaultAccountPlannerName is what an account's own plannerDoc is called until the
// account renames it.
const DefaultAccountPlannerName = "My plannerDoc"

// EnsureAccountPlanner gives an account the plannerDoc it works in, and puts the
// account in it.
//
// Written on insert only: a repeat call adds nothing and rewrites nothing, so an
// account that has renamed its plannerDoc keeps the name. That is what lets the
// release backfill and first login share one implementation without either
// undoing the other.
//
// **The two writes are deliberately independent.** Each half is created only if
// that half is absent, so a plannerDoc whose membership row has been deleted regains
// the row without the plannerDoc being touched, and the reverse. Collapsing them into
// one guarded block — "if the plannerDoc exists, do nothing" — would read as a tidier
// version of the same thing and would silently stop repairing the other half.
//
// The plannerDoc's `_id` is the account's owner key, so nothing is minted here — the
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

	plannerDoc := planner.Planner{
		SchemaVersion: planner.SchemaCurrent,
		Name:          DefaultAccountPlannerName,
		MemberCount:   1,
		CreatedBy:     accountID,
	}
	plannerDoc.MetaData.Owner = owner
	plannerDoc.MetaData.LastModified = now.UTC()
	if err := insertIfAbsent(ctx, m.Planners, plannerID, plannerDoc); err != nil {
		return fmt.Errorf("write plannerDoc for %s: %w", accountID, err)
	}

	membership := planner.Membership{
		SchemaVersion: planner.MembershipSchemaCurrent,
		PlannerID:     plannerID,
		AccountID:     accountID,
		JoinedAt:      now.UTC(),
		JoinMethod:    planner.JoinMethod{Self: &planner.SelfJoin{}},
	}
	membership.MetaData.Owner = owner
	membership.MetaData.LastModified = now.UTC()
	if err := membership.JoinMethod.Validate(); err != nil {
		return fmt.Errorf("membership for %s: %w", accountID, err)
	}
	if err := insertIfAbsent(ctx, m.PlannerMemberships, planner.MembershipID(plannerID, accountID), membership); err != nil {
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
