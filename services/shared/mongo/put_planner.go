package mongo

import (
	"context"
	"errors"
	"fmt"
	"time"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
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
// **The three writes are deliberately independent.** Each is created only if that
// document is absent, so a planner whose membership row has been deleted regains
// the row without the planner being touched, and likewise for its settings.
// Collapsing them into one guarded block — "if the planner exists, do nothing" —
// would read as a tidier version of the same thing and would silently stop
// repairing the other two.
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

	plannerDoc := planner.Planner{
		SchemaVersion: planner.SchemaCurrent,
		Name:          DefaultAccountPlannerName,
		MemberCount:   1,
		CreatedBy:     accountID,
	}
	plannerDoc.MetaData.Owner = owner
	plannerDoc.MetaData.LastModified = now.UTC()
	if err := insertIfAbsent(ctx, m.Planners, plannerID, plannerDoc); err != nil {
		return fmt.Errorf("write planner for %s: %w", accountID, err)
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

	// Seeded from the account's own settings, so its planner starts as the account
	// already has it configured rather than on the shipped defaults.
	if err := m.EnsurePlannerSettings(ctx, owner, accountID, now); err != nil {
		return err
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

// EnsurePlannerSettings gives a planner the settings its work is done under.
//
// Insert-only, like the planner and membership writes above: a repeat call
// rewrites nothing, so settings the planner has since changed are kept. That is
// what lets first login, the release backfill and planner creation share one
// implementation.
//
// `seedFrom` is the account whose settings a new planner starts from, so it
// behaves as whoever created it expects. Pass an empty id to seed the defaults
// instead — a planner nobody's settings should follow.
func (m *Mongo) EnsurePlannerSettings(ctx context.Context, owner models.Owner, seedFrom string, now time.Time) error {
	if m == nil || owner.IsZero() {
		return fmt.Errorf("EnsurePlannerSettings: invalid arguments")
	}

	settings := planner.DefaultSettings(owner, now.UTC())
	if seedFrom != "" {
		account, err := m.LoadApplicationSettings(ctx, seedFrom, now)
		switch {
		case err == nil:
			settings = planner.SettingsFromAccount(owner, account, now.UTC())
		case errors.Is(err, mongo.ErrNoDocuments):
			// An account with no settings document has nothing to seed from, and
			// the defaults are what it would itself have been given. The release
			// backfill reaches accounts in that state, so this cannot be fatal.
		default:
			return fmt.Errorf("read settings to seed %s from %s: %w", owner.Key(), seedFrom, err)
		}
	}

	if err := insertIfAbsent(ctx, m.PlannerSettings, owner.Key(), settings); err != nil {
		return fmt.Errorf("write settings for %s: %w", owner.Key(), err)
	}
	return nil
}
