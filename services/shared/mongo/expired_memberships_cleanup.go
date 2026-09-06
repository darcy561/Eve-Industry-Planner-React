package mongo

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// DeleteMembershipsUnconfirmedFor is how long a membership kept in step with EVE
// survives without being confirmed again.
//
// It is the abandon window of the cloud token sweep, and deliberately the same
// number: that sweep is what confirms a dormant account's memberships, and past
// its abandon window it stops touching the account and lets the refresh tokens
// die. A membership that has gone unconfirmed for longer than that has no way
// back — there is no token left to confirm it with — so it is the point at which
// the row means nothing.
//
// Anything shorter would delete rows the sweep was still maintaining. Anything
// longer would keep rows nothing can ever confirm.
const DeleteMembershipsUnconfirmedFor = 6 * 30 * 24 * time.Hour

// CleanUpExpiredMemberships deletes membership rows that EVE has not confirmed
// for long enough that nothing can confirm them again.
//
// Only the two methods EVE keeps in step are considered. An owner or invite
// membership is not confirmed by anything outside the planner, so it has no age
// at which it should go.
//
// **A row grants for as long as it exists**, so this deletion is what ends
// access rather than a separate expiry. An account that logs in keeps its rows
// current through the grants task, and a dormant one through the cloud token
// sweep, so a row this reaches belongs to an account that has stopped doing
// either.
func (m *Mongo) CleanUpExpiredMemberships(ctx context.Context, now time.Time) (int64, error) {
	if m == nil {
		return 0, fmt.Errorf("CleanUpExpiredMemberships: invalid arguments")
	}
	cutoff := now.UTC().Add(-DeleteMembershipsUnconfirmedFor)

	var deleted int64
	err := Retry(ctx, "CleanUpExpiredMemberships", func() error {
		result, err := m.PlannerMemberships.Collection().
			DeleteMany(ctx, membershipsUnconfirmedBefore(cutoff))
		if err != nil {
			return err
		}
		deleted = result.DeletedCount
		return nil
	})
	if err != nil {
		return 0, fmt.Errorf("delete memberships unconfirmed before %s: %w",
			cutoff.Format(time.RFC3339), err)
	}
	return deleted, nil
}

// membershipsUnconfirmedBefore matches rows EVE last confirmed before the cutoff.
//
// `$gt: zeroTime` excludes a row that has never been confirmed at all — one
// written before validation was recorded, or by a path that forgot to stamp it.
// Such a row holds the zero time, which is older than any cutoff, so deleting on
// age alone would remove it before a reconcile could ever confirm it. It waits
// instead, and the next reconcile either confirms it or removes it outright.
func membershipsUnconfirmedBefore(cutoff time.Time) bson.M {
	unconfirmed := func(field string) bson.M {
		return bson.M{field: bson.M{"$lt": cutoff, "$gt": time.Time{}}}
	}
	return bson.M{"$or": []bson.M{
		unconfirmed("joinMethod.entityMember.validatedAt"),
		unconfirmed("joinMethod.accessList.validatedAt"),
	}}
}
