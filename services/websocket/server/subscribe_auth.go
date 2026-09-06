package server

import (
	"context"
	"slices"
	"strings"
	"time"

	"eve-industry-planner/shared/logs"
	eipmongo "eve-industry-planner/shared/mongo"
)

const docSubscribeMongoTimeout = 3 * time.Second

// docSubscribeAuthorized returns whether the account may subscribe or unsubscribe to docID
// in the form "{collection}.{mongoDocumentID}".
//
// Singleton collections (document id must equal accountID):
//   - accounts, account_settings, watchlist_deprecated — singleton per account; _id matches accountID (same invariant as login).
//
// Mongo ownership (_id, and _meta.owner is this account):
//   - jobs, job_documents, archived_jobs, groups, production_totals
//
// All other collection names are denied (fail closed). Public/static collections (e.g. blueprints) must not
// be subscribed via this realtime channel.
func (s *Server) docSubscribeAuthorized(ctx context.Context, docID, accountID string) bool {
	if docID == "" || accountID == "" {
		return false
	}
	parts := strings.SplitN(docID, ".", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return false
	}
	collection, id := parts[0], parts[1]

	switch {
	case slices.Contains(eipmongo.AccountOwnedCollections(), collection):
		// The account owns these wherever it is working, so the id is the answer.
		return id == accountID

	case slices.Contains(eipmongo.PlannerHeldCollections(), collection):
		if s.Stack == nil || s.Stack.Mongo == nil {
			logs.WarnCtx(context.Background(), "subscribe auth denied: mongo client unavailable",
				"collection", collection, "doc_id", id)
			return false
		}
		mongo := s.Stack.Mongo
		mctx, cancel := context.WithTimeout(ctx, docSubscribeMongoTimeout)
		defer cancel()

		// Who owns the document, then whether this account is a member of that
		// owner: two reads rather than one, because a planner-held document is no
		// longer owned by whoever may read it.
		owner, err := mongo.Docs(collection).OwnerOfDocument(mctx, id)
		if err != nil {
			logs.WarnCtx(context.Background(), "subscribe auth owner lookup failed",
				"error", err, "collection", collection, "doc_id", id, "account_id", accountID)
			return false
		}
		if owner.IsZero() {
			return false
		}
		ok, err := mongo.AccountMayReach(mctx, accountID, owner)
		if err != nil {
			logs.WarnCtx(context.Background(), "subscribe auth membership lookup failed",
				"error", err, "collection", collection, "doc_id", id, "account_id", accountID)
			return false
		}
		return ok

	default:
		return false
	}
}
