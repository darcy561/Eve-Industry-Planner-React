package statistics

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"eve-industry-planner/api/helper"
	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"
)

// The path names whose statistics are read, as an owner handle: `account:{id}`
// today. A handle differs from the stored owner key only for the ESI kinds,
// whose key holds a ref rather than the raw id a client may see.

type ownerContextKey struct{}

// parseOwnerHandle reads `kind:id`; the id may contain a colon, so only the
// first separates the two.
func parseOwnerHandle(segment string) (models.Owner, error) {
	kind, id, found := strings.Cut(segment, ":")
	if !found {
		return models.Owner{}, fmt.Errorf("owner handle %q must be kind:id", segment)
	}
	if id == "" {
		return models.Owner{}, fmt.Errorf("owner handle %q names no owner", segment)
	}
	return models.Owner{Kind: models.OwnerKind(kind), ID: id}, nil
}

func withRequestOwner(r *http.Request, owner models.Owner) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), ownerContextKey{}, owner))
}

// requestOwner is the owner the path named, or the zero owner on a request that
// did not come through the router.
func requestOwner(r *http.Request) models.Owner {
	owner, _ := r.Context().Value(ownerContextKey{}).(models.Owner)
	return owner
}

// requireOwnedBySession answers true when the session may read the owner the
// path named.
//
// In the handler rather than the router: it compares against the session the
// auth middleware resolved, and rejecting earlier would answer 403 where these
// routes answer 401.
//
// The answer comes from the account's membership rows rather than from its
// session grants. Grants live as long as a session, so an account removed from a
// planner a moment ago still holds one; an authorisation that is stale in the
// permissive direction is the failure worth spending a read to avoid.
func requireOwnedBySession(ctx context.Context, w http.ResponseWriter, r *http.Request, mongo *eipmongo.Mongo, metrics *helper.RequestMetricsTracker, view, accountID string) bool {
	owner := requestOwner(r)

	// The account's own key needs no lookup: it holds that membership by
	// construction, and answering it here keeps the refusal of every other owner
	// independent of whether the database is reachable.
	if owner.Kind == models.OwnerAccount && owner.ID == accountID {
		return true
	}

	if mongo != nil {
		mayReach, err := mongo.AccountMayReach(ctx, accountID, owner)
		if err != nil {
			metrics.Error("owner_check_failed")
			helper.RespondEndpointServerError(w, r, "Failed to read statistics",
				"statistics: membership lookup failed", "statistics_owner_check_failed", view, err, nil)
			return false
		}
		if mayReach {
			return true
		}
	}

	metrics.Error("owner_forbidden")
	helper.RespondEndpointError(w, r, http.StatusForbidden, "Forbidden",
		"statistics: session may not read this owner", "statistics_owner_forbidden", view, nil,
		map[string]any{"owner_kind": string(owner.Kind)})
	return false
}
