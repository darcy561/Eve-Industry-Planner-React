package mongo

import (
	"context"
	"time"
)

// MembershipIsStaleForTest reports whether one row is in the set
// CountStaleMemberships counts.
//
// Exported for the test that asserts granting and stale are exact complements,
// which has to ask about a single row: the count itself is collection-wide, and
// a live database holds rows that have nothing to do with the test.
func (m *Mongo) MembershipIsStaleForTest(ctx context.Context, membershipID string, now time.Time) (bool, error) {
	filter := staleMembershipFilter(now)
	filter["_id"] = membershipID
	count, err := m.PlannerMemberships.Collection().CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
