package mongo

import (
	"context"
	"fmt"
	"time"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ReconcileESIMemberships makes an account's ESI-sourced membership rows match
// the entities EVE currently reports it in.
//
// Membership is what grants access, so this is the whole of what following a
// corporation or an alliance means: a row appears when the derived set gains an
// entity and goes when it loses one. Nothing above it asks how a row came to
// exist.
//
// Only the rows this account holds by ESI are considered. A membership it holds
// by invite into the same planner is a separate row with a different join method
// and is never removed here — leaving a corporation does not revoke an invitation
// somebody issued.
//
// The caller must pass the entities it actually resolved. A lookup that failed
// is not an empty set: removing every row on a bad ESI response would revoke a
// member's access for the length of an outage, so the caller reconciles only
// what it can vouch for.
func (m *Mongo) ReconcileESIMemberships(ctx context.Context, accountID string, owners []models.Owner, now time.Time) (added, removed int, err error) {
	if m == nil || accountID == "" {
		return 0, 0, fmt.Errorf("ReconcileESIMemberships: invalid arguments")
	}

	want := make(map[string]models.Owner, len(owners))
	for _, owner := range owners {
		if owner.IsZero() {
			continue
		}
		if owner.Kind != models.OwnerCorporation && owner.Kind != models.OwnerAlliance {
			// An account's own planner is not ESI's to grant or revoke.
			return 0, 0, fmt.Errorf("ReconcileESIMemberships: %s is not an ESI-sourced kind", owner.Kind)
		}
		want[owner.Key()] = owner
	}

	held, err := m.esiMembershipPlannerIDs(ctx, accountID)
	if err != nil {
		return 0, 0, err
	}

	for key, owner := range want {
		if _, alreadyHeld := held[key]; alreadyHeld {
			continue
		}
		membership := planner.Membership{
			SchemaVersion: planner.MembershipSchemaCurrent,
			PlannerID:     key,
			AccountID:     accountID,
			JoinedAt:      now.UTC(),
			JoinMethod:    planner.JoinMethod{ESI: &planner.ESIJoin{EntityRef: owner.ID}},
		}
		membership.MetaData.Owner = owner
		membership.MetaData.LastModified = now.UTC()
		if err := insertIfAbsent(ctx, m.PlannerMemberships,
			planner.MembershipID(key, accountID), membership); err != nil {
			return added, 0, fmt.Errorf("write ESI membership %s for %s: %w", key, accountID, err)
		}
		added++
	}

	for key := range held {
		if _, stillWanted := want[key]; stillWanted {
			continue
		}
		// Scoped to the ESI branch so a row held by another join method into the
		// same planner survives.
		result, err := m.PlannerMemberships.Collection().DeleteOne(ctx, bson.M{
			"_id":            planner.MembershipID(key, accountID),
			"joinMethod.esi": bson.M{"$exists": true},
		})
		if err != nil {
			return added, removed, fmt.Errorf("remove ESI membership %s for %s: %w", key, accountID, err)
		}
		removed += int(result.DeletedCount)
	}

	return added, removed, nil
}

// esiMembershipPlannerIDs is the set of planners this account is in by ESI.
func (m *Mongo) esiMembershipPlannerIDs(ctx context.Context, accountID string) (map[string]struct{}, error) {
	plannerIDs, err := m.PlannerMemberships.DistinctStrings(ctx, "plannerID", bson.M{
		"accountID":      accountID,
		"joinMethod.esi": bson.M{"$exists": true},
	})
	if err != nil {
		return nil, fmt.Errorf("list ESI memberships for %s: %w", accountID, err)
	}
	held := make(map[string]struct{}, len(plannerIDs))
	for _, id := range plannerIDs {
		held[id] = struct{}{}
	}
	return held, nil
}
