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
)

// MaxMembersPerPlanner caps how many accounts one planner holds.
const MaxMembersPerPlanner = 100

// ErrPlannerFull refuses a join that would pass [MaxMembersPerPlanner].
var ErrPlannerFull = fmt.Errorf("planner already holds %d members", MaxMembersPerPlanner)

// ErrAlreadyAMember reports that the account is in the planner already.
var ErrAlreadyAMember = errors.New("account is already a member")

// ErrNoSuchPlanner reports that nothing holds the planner an invite named. An
// invite outlives the planner it was issued for, so this is an ordinary answer
// rather than a fault.
var ErrNoSuchPlanner = errors.New("planner does not exist")

// ErrKindAdmitsNoInvite refuses a join into a planner whose roster is not
// decided by invites.
var ErrKindAdmitsNoInvite = errors.New("planner does not take invites")

// JoinPlannerByInvite puts an account in a planner it was invited to, and
// returns the planner it joined.
//
// The membership row records the invite it came in on rather than pointing at
// it: the credential is meant to vanish, and what the row needed from it is
// copied here.
func (m *Mongo) JoinPlannerByInvite(ctx context.Context, owner models.Owner, accountID string,
	redemption planner.InviteRedemption, now time.Time) (planner.Planner, error) {
	// Checked before the arguments: an invite issued before this rule existed, or
	// through any other caller, must not write a row the reconcile would leave in
	// place — and that answer does not depend on holding a handle.
	if !owner.AdmitsByInvite() {
		return planner.Planner{}, ErrKindAdmitsNoInvite
	}
	if m == nil || accountID == "" {
		return planner.Planner{}, fmt.Errorf("JoinPlannerByInvite: invalid arguments")
	}
	plannerID := owner.Key()

	var stored planner.Planner
	if err := m.Planners.Collection().
		FindOne(ctx, bson.M{"_id": plannerID}).Decode(&stored); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return planner.Planner{}, ErrNoSuchPlanner
		}
		return planner.Planner{}, fmt.Errorf("read planner %s: %w", plannerID, err)
	}

	members, err := m.PlannerMemberships.Collection().
		CountDocuments(ctx, bson.M{"plannerID": plannerID})
	if err != nil {
		return planner.Planner{}, fmt.Errorf("count members of %s: %w", plannerID, err)
	}
	if members >= MaxMembersPerPlanner {
		return planner.Planner{}, ErrPlannerFull
	}

	membership := planner.Membership{
		SchemaVersion: planner.MembershipSchemaCurrent,
		PlannerID:     plannerID,
		AccountID:     accountID,
		JoinedAt:      now.UTC(),
		JoinMethod:    planner.JoinMethod{Invite: &redemption},
	}
	membership.MetaData.Owner = owner
	membership.MetaData.LastModified = now.UTC()
	if err := membership.JoinMethod.Validate(); err != nil {
		return planner.Planner{}, fmt.Errorf("membership for %s: %w", accountID, err)
	}

	membershipID := planner.MembershipID(plannerID, accountID)
	existing, err := m.PlannerMemberships.Collection().
		CountDocuments(ctx, bson.M{"_id": membershipID})
	if err != nil {
		return planner.Planner{}, fmt.Errorf("check membership of %s: %w", plannerID, err)
	}
	if existing > 0 {
		return stored, ErrAlreadyAMember
	}
	if err := insertIfAbsent(ctx, m.PlannerMemberships, membershipID, membership); err != nil {
		return planner.Planner{}, fmt.Errorf("write membership for %s: %w", accountID, err)
	}

	// Counted from the rows rather than incremented, so a count that has drifted
	// is corrected by the next join instead of drifting further.
	fresh, err := m.PlannerMemberships.Collection().
		CountDocuments(ctx, bson.M{"plannerID": plannerID})
	if err != nil {
		return planner.Planner{}, fmt.Errorf("recount members of %s: %w", plannerID, err)
	}
	if _, err := m.Planners.Collection().UpdateOne(ctx,
		bson.M{"_id": plannerID},
		bson.M{"$set": bson.M{
			"memberCount":        fresh,
			"_meta.lastModified": now.UTC(),
		}},
	); err != nil {
		return planner.Planner{}, fmt.Errorf("update member count of %s: %w", plannerID, err)
	}

	stored.MemberCount = int(fresh)
	return stored, nil
}
