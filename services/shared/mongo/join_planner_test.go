package mongo

import (
	"context"
	"errors"
	"testing"
	"time"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"
)

// The kind is checked before anything is read, so a join into a planner whose
// roster is not decided by invites is refused without a database.
//
// Checked here as well as at the handler because a row written for a corporation
// would survive the reconcile that no longer sees the account in it, granting
// access the game has taken away.
func TestJoinRefusesAPlannerThatTakesNoInvites(t *testing.T) {
	t.Parallel()
	var m *Mongo

	for _, owner := range []models.Owner{
		models.AccountOwner("acct-1"),
		{Kind: models.OwnerCorporation, ID: "corp_ref"},
		{Kind: models.OwnerAlliance, ID: "alliance_ref"},
	} {
		_, err := m.JoinPlannerByInvite(context.Background(), owner, "acct-2",
			planner.InviteRedemption{InvitedBy: "acct-1", IssuedAt: time.Now().UTC()},
			time.Now().UTC())
		if !errors.Is(err, ErrKindAdmitsNoInvite) {
			t.Errorf("join into a %s planner = %v, want the refusal", owner.Kind, err)
		}
	}
}

// A zero owner names no kind, so it is refused by the same check rather than
// needing one of its own.
func TestJoinRefusesAZeroOwner(t *testing.T) {
	t.Parallel()
	var m *Mongo

	_, err := m.JoinPlannerByInvite(context.Background(), models.Owner{}, "acct-2",
		planner.InviteRedemption{}, time.Now().UTC())
	if !errors.Is(err, ErrKindAdmitsNoInvite) {
		t.Fatalf("join with no owner = %v, want the refusal", err)
	}
}
