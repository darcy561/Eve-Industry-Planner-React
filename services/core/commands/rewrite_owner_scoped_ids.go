package commands

import (
	"context"
	"flag"
	"fmt"
	"slices"
	"strings"
	"time"

	"eve-industry-planner/shared/lifecycle"
	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"
	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/shared/stackservices"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type rewriteOwnerScopedIDsOptions struct {
	collections []string
	limit       int
	dryRun      bool
}

// runRewriteOwnerScopedIDs fans out one task per owner holding documents whose
// id does not yet carry it.
//
// The command only enumerates; workers do the writing. Re-running is safe and is
// how progress is measured: with --dry-run the queued count is the work
// remaining, because an owner whose documents are all moved is not selected.
func runRewriteOwnerScopedIDs(ctx context.Context, args []string) error {
	opts, err := parseRewriteOwnerScopedIDsOptions(args)
	if err != nil {
		return err
	}

	clients, stopDeps, err := stackservices.Connect(ctx, stackservices.Services{Mongo: true, NATS: true})
	if err != nil {
		return err
	}
	defer lifecycle.RunCleanups(5*time.Second, stopDeps)

	if _, err := clients.NATS.Tasks.Ensure(ctx); err != nil {
		return fmt.Errorf("failed to ensure worker task stream: %w", err)
	}

	batch := clients.NATS.Batching()
	queued := 0
	for _, collection := range opts.collections {
		owners, err := ownersNeedingScopedIDs(ctx, clients.Mongo, collection)
		if err != nil {
			return err
		}
		if opts.limit > 0 && len(owners) > opts.limit {
			owners = owners[:opts.limit]
		}

		for _, owner := range owners {
			if err := eipnats.PublishRewriteOwnerScopedIDs(ctx, batch, owner.Key(), collection, opts.dryRun); err != nil {
				return fmt.Errorf("publish rewriteOwnerScopedIDs for %s/%s: %w", collection, owner.Key(), err)
			}
			queued++
		}
		fmt.Printf("%s: %d owner(s) hold documents to move\n", collection, len(owners))
	}

	if err := batch.Wait(ctx); err != nil {
		return fmt.Errorf("queue rewriteOwnerScopedIDs tasks: %w", err)
	}

	fmt.Printf("Queued %d rewriteOwnerScopedIDs tasks on subject %q (dry_run=%t)\n",
		queued, eipnats.RewriteOwnerScopedIDs.Subject, opts.dryRun)
	return nil
}

// ownersNeedingScopedIDs lists the owners holding at least one document in the
// collection whose id does not name them.
//
// The selector is the id's own shape: an id holding no separator has not been
// rewritten. That is what makes the enumeration shrink as the work is done,
// rather than needing a progress record of its own.
func ownersNeedingScopedIDs(ctx context.Context, m *eipmongo.Mongo, collection string) ([]models.Owner, error) {
	coll := m.Coll(collection)
	if coll == nil {
		return nil, fmt.Errorf("collection %q is not available", collection)
	}

	cursor, err := coll.Aggregate(ctx, []bson.M{
		{"$match": bson.M{"_id": bson.M{"$type": "string", "$not": bson.M{"$regex": `\|`}}}},
		{"$group": bson.M{"_id": "$" + eipmongo.FieldMetaOwner}},
	})
	if err != nil {
		return nil, fmt.Errorf("enumerate owners in %s: %w", collection, err)
	}
	defer cursor.Close(ctx)

	var owners []models.Owner
	for cursor.Next(ctx) {
		var row struct {
			Owner models.Owner `bson:"_id"`
		}
		if err := cursor.Decode(&row); err != nil {
			return nil, fmt.Errorf("decode owner in %s: %w", collection, err)
		}
		// A document with no owner is left for the owner stamp to fix; it cannot
		// be given an id naming one that is not there.
		if row.Owner.IsZero() {
			continue
		}
		owners = append(owners, row.Owner)
	}
	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("enumerate owners in %s: %w", collection, err)
	}
	return owners, nil
}

func parseRewriteOwnerScopedIDsOptions(args []string) (rewriteOwnerScopedIDsOptions, error) {
	opts := rewriteOwnerScopedIDsOptions{}
	var collection string

	fs := flag.NewFlagSet("rewriteOwnerScopedIDs", flag.ContinueOnError)
	fs.StringVar(&collection, "collection", "", "limit to one collection (default: every collection holding owner-scoped ids)")
	fs.IntVar(&opts.limit, "limit", 0, "queue at most this many owners per collection")
	fs.BoolVar(&opts.dryRun, "dry-run", false, "report what would be moved without writing")
	if err := fs.Parse(args); err != nil {
		return opts, err
	}

	collection = strings.TrimSpace(collection)
	if collection == "" {
		opts.collections = eipmongo.OwnerScopedIDCollections()
		return opts, nil
	}
	if !slices.Contains(eipmongo.OwnerScopedIDCollections(), collection) {
		return opts, fmt.Errorf("--collection=%s holds no owner-scoped ids %v",
			collection, eipmongo.OwnerScopedIDCollections())
	}
	opts.collections = []string{collection}
	return opts, nil
}
