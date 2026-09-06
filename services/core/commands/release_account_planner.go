package commands

import (
	"context"
	"fmt"
	"time"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/stackservices"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// backfillAccountPlanners gives every existing account the planner it works in.
//
// The write itself is Mongo.EnsureAccountPlanner, which first login also calls:
// one implementation, so an account created after this step runs gets the same
// pair of documents rather than a second version of them.
//
// Only new documents are written, which is what lets this run either side of
// traffic returning, and a repeat run adds nothing.
func backfillAccountPlanners(ctx context.Context, clients *stackservices.Clients, dryRun bool) (string, error) {
	mongo := clients.Mongo

	accountIDs, err := mongo.Users.DistinctStrings(ctx, "_id", bson.M{})
	if err != nil {
		return "", fmt.Errorf("list accounts: %w", err)
	}
	if len(accountIDs) == 0 {
		return "no accounts", nil
	}

	missing := make([]string, 0, len(accountIDs))
	for _, accountID := range accountIDs {
		if models.AccountOwner(accountID).IsZero() {
			// Named rather than skipped: an account whose id yields no owner holds
			// documents nothing can address either.
			return "", fmt.Errorf("account id %q yields no owner", accountID)
		}
		held, err := mongo.HasAccountPlanner(ctx, accountID)
		if err != nil {
			return "", err
		}
		if !held {
			missing = append(missing, accountID)
		}
	}

	if len(missing) == 0 {
		return fmt.Sprintf("%d account(s), all with a planner", len(accountIDs)), nil
	}
	if dryRun {
		return fmt.Sprintf("%d of %d account(s) would gain a planner", len(missing), len(accountIDs)), nil
	}

	now := time.Now().UTC()
	written := 0
	for _, accountID := range missing {
		if err := mongo.EnsureAccountPlanner(ctx, accountID, now); err != nil {
			return "", err
		}
		written++
	}
	return fmt.Sprintf("%d of %d account(s) gained a planner", written, len(accountIDs)), nil
}
