package mongo

import (
	"context"
	"errors"
	"fmt"
	"maps"
	"time"

	"eve-industry-planner/shared/documentschema"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// OwnerKeysForAccount returns every owner the account holds a live membership
// for, which is what a session may reach.
//
// The account's own planner is among them rather than added separately, so this
// is the whole of what a session may reach and nothing downstream adds to it.
//
// That makes the call order matter at the sites that use it: the planner write
// has to have run first, or an account whose row is missing is handed an empty
// list for the life of that session. Both callers ensure the row before reading.
//
// **A membership kept in step with EVE stops granting once it goes unconfirmed
// for planner.StaleAfter.** A revoked token, a removed scope and an ESI outage
// all look the same to the reconcile — no answer rather than a negative one — so
// it leaves such a row alone and this is where the row stops counting. Filtering
// here rather than at each caller is deliberate: this is the one point every
// grant passes through, so a stale row cannot leak in through a path that reads
// the rows itself.
func (m *Mongo) OwnerKeysForAccount(ctx context.Context, accountID string) (models.OwnerKeys, error) {
	if m == nil || accountID == "" {
		return nil, fmt.Errorf("OwnerKeysForAccount: invalid arguments")
	}
	plannerIDs, err := m.PlannerMemberships.DistinctStrings(ctx, "plannerID",
		liveMembershipFilter(bson.M{"accountID": accountID}, time.Now()))
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

// liveMembershipFilter narrows a membership query to rows that still grant, and
// is the one definition of what that means.
//
// An owner or invite membership always grants: nothing outside the planner can
// revoke it, so there is nothing for it to go stale against. The two kept in step
// with EVE grant only while their last confirmation is recent enough.
//
// A row whose method is one of those two but which carries no confirmation at all
// does not grant: the query asks for a recent timestamp, and a missing field is
// not one. That is the same answer as an old one and deliberately so — nothing
// has vouched for it.
func liveMembershipFilter(base bson.M, now time.Time) bson.M {
	filter := bson.M{}
	maps.Copy(filter, base)
	filter["$or"] = grantingMethodClauses(now)
	return filter
}

// grantingMethodClauses is the set of join-method shapes that grant, as an $or.
//
// staleMembershipFilter is its complement, so the two are built from one place
// rather than each spelling the rule and drifting.
func grantingMethodClauses(now time.Time) []bson.M {
	cutoff := now.UTC().Add(-planner.StaleAfter)
	return []bson.M{
		{"joinMethod.entityMember": bson.M{"$exists": false},
			"joinMethod.accessList": bson.M{"$exists": false}},
		{"joinMethod.entityMember.validatedAt": bson.M{"$gte": cutoff}},
		{"joinMethod.accessList.validatedAt": bson.M{"$gte": cutoff}},
	}
}

// staleMembershipFilter matches the rows that have stopped granting: every row
// that liveMembershipFilter excludes, and no others.
//
// Expressed as the negation rather than as its own set of clauses. Written
// separately, the two drifted at once — a row with no confirmation field granted
// nothing and was counted as stale by neither, so it was invisible in both
// directions.
func staleMembershipFilter(now time.Time) bson.M {
	return bson.M{"$nor": grantingMethodClauses(now)}
}

// AccountMayReach reports whether the account holds a live membership for the
// owner.
//
// Live rather than merely present: a membership kept in step with EVE that has
// gone unconfirmed for planner.StaleAfter no longer grants. See
// OwnerKeysForAccount.
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
		liveMembershipFilter(bson.M{"_id": planner.MembershipID(owner.Key(), accountID)}, time.Now()))
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
