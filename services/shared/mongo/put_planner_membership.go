package mongo

import (
	"context"
	"fmt"
	"time"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ReconcileEntityMemberships makes an account's entity-member rows match the
// corporations and alliances EVE currently reports it in.
//
// Membership is what grants access, so this is the whole of what being in a
// corporation means: a row appears when the derived set gains an entity and goes
// when it loses one. Nothing above it asks how a row came to exist.
//
// **Every row in the set is restamped, including one that changes nothing.** A
// membership kept in step with EVE stops granting once it goes unconfirmed for
// planner.StaleAfter, so "still a member" is the answer that matters most and the
// one the reconcile is usually delivering.
//
// Only entity-member rows are considered. A membership held by invite into the
// same planner is a separate row with a different method and is never removed
// here — leaving a corporation does not revoke an invitation somebody issued.
//
// The caller must pass the entities it actually resolved. A lookup that failed is
// not an empty set: removing every row on a bad ESI response would revoke access
// for the length of an outage, so the caller reconciles only what it can vouch
// for, and a row it could not confirm expires on its own.
func (m *Mongo) ReconcileEntityMemberships(ctx context.Context, accountID string, owners []models.Owner, now time.Time) (added, removed int, err error) {
	if m == nil || accountID == "" {
		return 0, 0, fmt.Errorf("ReconcileEntityMemberships: invalid arguments")
	}

	want := make(map[string]models.Owner, len(owners))
	for _, owner := range owners {
		if owner.IsZero() {
			continue
		}
		if owner.Kind != models.OwnerCorporation && owner.Kind != models.OwnerAlliance {
			// An account's own planner is not ESI's to grant or revoke.
			return 0, 0, fmt.Errorf("ReconcileEntityMemberships: %s is not a corporation or alliance", owner.Kind)
		}
		want[owner.Key()] = owner
	}

	held, err := m.entityMemberPlannerIDs(ctx, accountID)
	if err != nil {
		return 0, 0, err
	}

	for key, owner := range want {
		if _, alreadyHeld := held[key]; alreadyHeld {
			// Confirmed rather than rewritten: the row already says everything but
			// when EVE last vouched for it, which is the whole point of the check.
			if _, err := m.PlannerMemberships.Collection().UpdateOne(ctx,
				bson.M{"_id": planner.MembershipID(key, accountID),
					"joinMethod.entityMember": bson.M{"$exists": true}},
				bson.M{"$set": bson.M{
					"joinMethod.entityMember.validatedAt": now.UTC(),
					"_meta.lastModified":                  now.UTC(),
				}}); err != nil {
				return added, 0, fmt.Errorf("confirm membership %s for %s: %w", key, accountID, err)
			}
			continue
		}
		membership := planner.Membership{
			SchemaVersion: planner.MembershipSchemaCurrent,
			PlannerID:     key,
			AccountID:     accountID,
			JoinedAt:      now.UTC(),
			JoinMethod: planner.JoinMethod{Membership: &planner.EntityMember{
				EntityRef:   owner.ID,
				ValidatedAt: now.UTC(),
			}},
		}
		membership.MetaData.Owner = owner
		membership.MetaData.LastModified = now.UTC()
		if err := insertIfAbsent(ctx, m.PlannerMemberships,
			planner.MembershipID(key, accountID), membership); err != nil {
			return added, 0, fmt.Errorf("write membership %s for %s: %w", key, accountID, err)
		}
		added++
	}

	for key := range held {
		if _, stillWanted := want[key]; stillWanted {
			continue
		}
		// Scoped to the branch so a row held by another method into the same
		// planner survives.
		result, err := m.PlannerMemberships.Collection().DeleteOne(ctx, bson.M{
			"_id":                     planner.MembershipID(key, accountID),
			"joinMethod.entityMember": bson.M{"$exists": true},
		})
		if err != nil {
			return added, removed, fmt.Errorf("remove membership %s for %s: %w", key, accountID, err)
		}
		removed += int(result.DeletedCount)
	}

	return added, removed, nil
}

// entityMemberPlannerIDs is the set of planners this account is in by being in
// the corporation or alliance that owns them.
func (m *Mongo) entityMemberPlannerIDs(ctx context.Context, accountID string) (map[string]struct{}, error) {
	plannerIDs, err := m.PlannerMemberships.DistinctStrings(ctx, "plannerID", bson.M{
		"accountID":               accountID,
		"joinMethod.entityMember": bson.M{"$exists": true},
	})
	if err != nil {
		return nil, fmt.Errorf("list entity memberships for %s: %w", accountID, err)
	}
	held := make(map[string]struct{}, len(plannerIDs))
	for _, id := range plannerIDs {
		held[id] = struct{}{}
	}
	return held, nil
}
