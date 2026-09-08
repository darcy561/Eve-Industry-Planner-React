package helper

import (
	"context"
	"net/http"
	"strings"

	"eve-industry-planner/shared/crypto/entityid"
	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"
)

// PlannerOwnerHeader carries the planner a request is working in, as an owner
// handle (`kind:id`).
const PlannerOwnerHeader = "X-Planner-Owner"

// MembershipReader answers whether an account may work in a planner.
type MembershipReader interface {
	AccountMayReach(ctx context.Context, accountID string, owner models.Owner) (bool, error)
}

// ExtractPlannerOwnerHandle returns the trimmed planner owner handle, or empty
// when the request names none.
func ExtractPlannerOwnerHandle(r *http.Request) string {
	if r == nil {
		return ""
	}
	return strings.TrimSpace(r.Header.Get(PlannerOwnerHeader))
}

// RequestPlannerOwner resolves the planner a request is working in, refusing one
// the account holds no membership row for.
//
// A request naming no planner resolves to the account's own, which is the planner
// every account has. That default is temporary: it exists while the SPA is wired
// around, and the owner becomes required when the live planner cuts over.
//
// The second return is false when the request has been answered.
func RequestPlannerOwner(w http.ResponseWriter, r *http.Request, memberships MembershipReader,
	cipher *entityid.Cipher, metrics *RequestMetricsTracker, route string) (models.Owner, bool) {
	accountID := AuthenticatedAccountID(r)
	if accountID == "" {
		metrics.Error("auth_error")
		RespondEndpointError(w, r, http.StatusUnauthorized, "Unauthorized",
			route+": missing account", route+"_missing_account", route, nil, nil)
		return models.Owner{}, false
	}

	handle := ExtractPlannerOwnerHandle(r)
	if handle == "" {
		return models.AccountOwner(accountID), true
	}
	return PlannerOwnerFromHandle(w, r, handle, memberships, cipher, metrics, route)
}

// PlannerOwnerFromHandle resolves a handle a request named to a planner the
// account may work in, answering the request itself when it may not. Unlike
// [RequestPlannerOwner] there is no default: the handle is required.
func PlannerOwnerFromHandle(w http.ResponseWriter, r *http.Request, handle string, memberships MembershipReader,
	cipher *entityid.Cipher, metrics *RequestMetricsTracker, route string) (models.Owner, bool) {
	accountID := AuthenticatedAccountID(r)
	if accountID == "" {
		metrics.Error("auth_error")
		RespondEndpointError(w, r, http.StatusUnauthorized, "Unauthorized",
			route+": missing account", route+"_missing_account", route, nil, nil)
		return models.Owner{}, false
	}

	owner, err := models.ParseOwnerHandle(handle, cipher)
	if err != nil {
		metrics.Error("bad_planner_owner")
		RespondEndpointError(w, r, http.StatusBadRequest, "Invalid planner",
			route+": unparseable planner owner", route+"_bad_planner_owner", route, err, nil)
		return models.Owner{}, false
	}
	if owner == models.AccountOwner(accountID) {
		return owner, true
	}

	if membershipReaderMissing(memberships) {
		metrics.Error("mongo_client_missing")
		RespondEndpointError(w, r, http.StatusServiceUnavailable, "Service unavailable",
			route+": membership reader missing", route+"_membership_unavailable", route, nil, nil)
		return models.Owner{}, false
	}

	mayReach, err := memberships.AccountMayReach(r.Context(), accountID, owner)
	if err != nil {
		metrics.Error("membership_check_failed")
		RespondEndpointServerError(w, r, "Failed to resolve planner",
			route+": membership lookup failed", route+"_membership_failed", route, err, nil)
		return models.Owner{}, false
	}
	if !mayReach {
		// 404 rather than 403, so a leaked id reveals only that it is not theirs.
		metrics.Error("not_a_member")
		RespondEndpointError(w, r, http.StatusNotFound, "Not found",
			route+": account holds no membership", route+"_planner_not_found", route, nil,
			map[string]any{"owner_kind": string(owner.Kind)})
		return models.Owner{}, false
	}
	return owner, true
}

// membershipReaderMissing is true for no reader and for a nil *eipmongo.Mongo,
// which satisfies the interface while holding nothing to read from.
func membershipReaderMissing(memberships MembershipReader) bool {
	if memberships == nil {
		return true
	}
	m, isMongo := memberships.(*eipmongo.Mongo)
	return isMongo && m == nil
}
