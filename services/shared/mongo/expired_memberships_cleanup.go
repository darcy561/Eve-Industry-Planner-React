package mongo

import (
	"context"
	"fmt"
	"time"

	"eve-industry-planner/shared/models/planner"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// DeleteExpiredAfter is how long a membership kept in step with EVE is kept
// after it has stopped granting.
//
// It is deliberately much longer than planner.StaleAfter, and the gap between
// them is the whole point: a row stops granting at StaleAfter, which is
// reversible — the next confirmation restores access with no rejoin — and is
// deleted at DeleteExpiredAfter, which is not. A member who lost access to a long ESI
// outage, or who was away while their token needed re-authorising, rejoins by
// logging in rather than by being invited back.
//
// Deleting at StaleAfter would collapse that distinction and make every outage
// look like leaving.
const DeleteExpiredAfter = 90 * 24 * time.Hour

// CleanUpExpiredMemberships deletes membership rows that stopped granting long
// enough ago that keeping them serves nothing.
//
// Only the two methods EVE keeps in step are considered. An owner or invite
// membership never expires — nothing outside the planner can revoke it — so
// neither has an age at which it should go.
//
// Nothing depends on the deletion: the rows it removes stopped granting at
// planner.StaleAfter and have been inert since. This is housekeeping, which is
// why it is safe to run on a schedule and safe to skip.
func (m *Mongo) CleanUpExpiredMemberships(ctx context.Context, now time.Time) (int64, error) {
	if m == nil {
		return 0, fmt.Errorf("CleanUpExpiredMemberships: invalid arguments")
	}
	cutoff := now.UTC().Add(-DeleteExpiredAfter)

	var deleted int64
	err := Retry(ctx, "CleanUpExpiredMemberships", func() error {
		// `$gt: zeroTime` excludes a row that has never been confirmed at all —
		// one written before validation was recorded, or by a path that forgot to
		// stamp it. Such a row holds the zero time, which is older than any cutoff,
		// so deleting on age alone would remove it before a reconcile could ever
		// confirm it. It stops granting, which is correct, and waits.
		aged := func(field string) bson.M {
			return bson.M{field: bson.M{"$lt": cutoff, "$gt": time.Time{}}}
		}
		result, err := m.PlannerMemberships.Collection().DeleteMany(ctx, bson.M{
			"$or": []bson.M{
				aged("joinMethod.entityMember.validatedAt"),
				aged("joinMethod.accessList.validatedAt"),
			},
		})
		if err != nil {
			return err
		}
		deleted = result.DeletedCount
		return nil
	})
	if err != nil {
		return 0, fmt.Errorf("delete memberships expired before %s: %w", cutoff.Format(time.RFC3339), err)
	}
	return deleted, nil
}

// CountStaleMemberships reports how many rows have stopped granting, whether or
// not they are old enough to delete.
//
// For the operator view rather than the deletion itself: a number that climbs says
// accounts are losing access somewhere, which a delete count alone would hide
// until DeleteExpiredAfter had passed.
func (m *Mongo) CountStaleMemberships(ctx context.Context, now time.Time) (int64, error) {
	if m == nil {
		return 0, fmt.Errorf("CountStaleMemberships: invalid arguments")
	}
	cutoff := now.UTC().Add(-planner.StaleAfter)

	var count int64
	err := Retry(ctx, "CountStaleMemberships", func() error {
		got, err := m.PlannerMemberships.Collection().CountDocuments(ctx, bson.M{
			"$or": []bson.M{
				{"joinMethod.entityMember.validatedAt": bson.M{"$lt": cutoff}},
				{"joinMethod.accessList.validatedAt": bson.M{"$lt": cutoff}},
			},
		})
		if err != nil {
			return err
		}
		count = got
		return nil
	})
	if err != nil {
		return 0, fmt.Errorf("count stale memberships: %w", err)
	}
	return count, nil
}
