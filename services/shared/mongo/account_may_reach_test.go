package mongo

import (
	"context"
	"testing"

	"eve-industry-planner/shared/models"
)

// An account holds its own planner's membership by construction, so the answer
// does not wait on the database — which is what keeps a statistics read of your
// own figures working while Mongo is unreachable.
func TestAccountMayReachAnswersItsOwnPlannerWithoutAHandle(t *testing.T) {
	t.Parallel()

	var absent *Mongo
	mayReach, err := absent.AccountMayReach(context.Background(), "acct-1",
		models.AccountOwner("acct-1"))
	if err != nil {
		t.Fatalf("AccountMayReach: %v", err)
	}
	if !mayReach {
		t.Error("an account was refused its own planner")
	}
}

// Every other owner needs the rows, so a missing handle is an error rather than a
// refusal: the two mean different things to a caller.
func TestAccountMayReachNeedsAHandleForEveryOtherOwner(t *testing.T) {
	t.Parallel()

	var absent *Mongo
	for _, owner := range []models.Owner{
		models.AccountOwner("someone-else"),
		models.CorporationOwner("corp_56_J_DzQdPpjXwi9Xtp3C8bri9Bfi0Z94qUulkbKCac"),
	} {
		mayReach, err := absent.AccountMayReach(context.Background(), "acct-1", owner)
		if err == nil {
			t.Errorf("%s was answered without a handle", owner.Key())
		}
		if mayReach {
			t.Errorf("%s was granted without a handle", owner.Key())
		}
	}
}

// A zero owner addresses nothing, so it is refused rather than errored: nothing
// was asked about.
func TestAccountMayReachRefusesTheZeroOwner(t *testing.T) {
	t.Parallel()

	var absent *Mongo
	mayReach, err := absent.AccountMayReach(context.Background(), "acct-1", models.Owner{})
	if err != nil {
		t.Fatalf("AccountMayReach: %v", err)
	}
	if mayReach {
		t.Error("the zero owner was granted")
	}
}
