package commands

import (
	"context"
	"flag"
	"fmt"
	"time"

	"eve-industry-planner/shared/lifecycle"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/stackservices"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// runPlanners reports which accounts hold a planner and a membership row.
//
// Read-only. The backfill and first login both create the pair, so an account
// missing either has not been through one of them — which is what this answers
// for an operator who cannot query the database directly.
func runPlanners(ctx context.Context, args []string) error {
	fs := flag.NewFlagSet("planners", flag.ContinueOnError)
	fs.Usage = func() {
		fmt.Fprintf(fs.Output(), "Usage: tasks planners [-account id]\n\n")
		fmt.Fprintf(fs.Output(), "Reports each account's planner and membership row.\n")
		fs.PrintDefaults()
	}
	account := fs.String("account", "", "report one account rather than every account")
	if err := fs.Parse(args); err != nil {
		return err
	}

	clients, stopDeps, err := stackservices.Connect(ctx, stackservices.Services{Mongo: true})
	if err != nil {
		return err
	}
	defer lifecycle.RunCleanups(5*time.Second, stopDeps)

	ctxRun, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	mongo := clients.Mongo

	accountIDs := []string{*account}
	if *account == "" {
		accountIDs, err = mongo.Users.DistinctStrings(ctxRun, "_id", bson.M{})
		if err != nil {
			return fmt.Errorf("list accounts: %w", err)
		}
	}

	var complete, partial int
	for _, accountID := range accountIDs {
		owner := models.AccountOwner(accountID)
		if owner.IsZero() {
			fmt.Printf("%-24s no owner can be derived from this id\n", accountID)
			partial++
			continue
		}

		planners, err := mongo.Planners.Collection().CountDocuments(ctxRun, bson.M{"_id": owner.Key()})
		if err != nil {
			return fmt.Errorf("count planner for %s: %w", accountID, err)
		}
		granted, err := mongo.OwnerKeysForAccount(ctxRun, accountID)
		if err != nil {
			return fmt.Errorf("read grants for %s: %w", accountID, err)
		}

		switch {
		case planners > 0 && granted.Has(owner):
			complete++
			extra := ""
			if len(granted) > 1 {
				extra = fmt.Sprintf(", and %d shared", len(granted)-1)
			}
			fmt.Printf("%-24s planner and membership%s\n", accountID, extra)
		case planners > 0:
			partial++
			fmt.Printf("%-24s planner, but no membership row: it reaches nothing\n", accountID)
		case granted.Has(owner):
			partial++
			fmt.Printf("%-24s membership row, but no planner document\n", accountID)
		default:
			partial++
			fmt.Printf("%-24s neither: it has not logged in since the backfill\n", accountID)
		}
	}

	fmt.Printf("\n%d complete, %d incomplete, of %d account(s)\n", complete, partial, len(accountIDs))
	return nil
}
