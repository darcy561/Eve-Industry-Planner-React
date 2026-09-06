package planners

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"eve-industry-planner/api/helper"
	"eve-industry-planner/shared/crypto/entityid"
	"eve-industry-planner/shared/esiclient/entitynames"
	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"
	"eve-industry-planner/shared/telemetry/apimetrics"
)

// PutPlannerHandler handles PUT /api/v1/planners/{ownerHandle} — naming a planner
// the account can already reach, so it has a document from then on.
//
// Insert-only and idempotent: a planner that already has a document is returned
// unchanged rather than renamed, so this is safe to call whenever a client finds
// one it wants named.
//
// It does not grant access and cannot be used to obtain any: the account must
// already hold a membership row, which is checked before anything is written.
// A handle the account has no row for answers 404 rather than 403, so an id that
// leaks reveals only that it is not one of theirs.
func (h *Handlers) PutPlannerHandler(w http.ResponseWriter, r *http.Request, handle string) {
	ctx := r.Context()
	m := apimetrics.GetAPIPlanners()
	metrics := helper.BeginRequestMetrics(ctx, helper.RequestMetricsHooks{
		ObserveDuration: func(ctx context.Context, ms float64) { m.Requests.Observe(ctx, ms) },
		IncRequests:     func(ctx context.Context) { m.RequestsCount.Inc(ctx) },
		IncSuccesses:    func(ctx context.Context) { m.Successes.Inc(ctx) },
		IncErrors:       func(ctx context.Context, reason string) { m.Errors.WithLabelValues(reason).Inc(ctx) },
	})
	defer metrics.Finish()

	accountID := helper.AuthenticatedAccountID(r)
	if accountID == "" {
		metrics.Error("auth_error")
		helper.RespondEndpointError(w, r, http.StatusUnauthorized, "Unauthorized",
			"planner create: missing account", "planner_create_missing_account", "planner_create", nil, nil)
		return
	}
	if h.Mongo == nil {
		metrics.Error("mongo_client_missing")
		helper.RespondEndpointError(w, r, http.StatusServiceUnavailable, "Service unavailable",
			"planner create: mongo client missing", "planners_mongo_unavailable", "planner_create",
			errors.New("mongo client missing"), nil)
		return
	}

	owner, err := helper.ParseOwnerHandle(handle)
	if err != nil {
		metrics.Error("bad_handle")
		helper.RespondEndpointError(w, r, http.StatusBadRequest, "Invalid planner",
			"planner create: unparseable handle", "planner_create_bad_handle", "planner_create", err, nil)
		return
	}

	// Membership first: everything below reads EVE or writes a document, and
	// neither should happen for a planner this account cannot reach.
	mayReach, err := h.Mongo.AccountMayReach(ctx, accountID, owner)
	if err != nil {
		metrics.Error("membership_check_failed")
		helper.RespondEndpointServerError(w, r, "Failed to create planner",
			"planner create: membership lookup failed", "planner_create_membership_failed", "planner_create", err, nil)
		return
	}
	if !mayReach {
		metrics.Error("not_a_member")
		helper.RespondEndpointError(w, r, http.StatusNotFound, "Not found",
			"planner create: account holds no membership", "planner_create_not_found", "planner_create", nil,
			map[string]any{"owner_kind": string(owner.Kind)})
		return
	}

	name, err := h.plannerName(ctx, owner)
	if err != nil {
		if errors.Is(err, errNPCCorporation) {
			metrics.Error("npc_corporation")
			helper.RespondEndpointError(w, r, http.StatusForbidden,
				"An NPC corporation cannot have a planner",
				"planner create: refused an NPC corporation", "planner_create_npc_corporation",
				"planner_create", nil, nil)
			return
		}
		metrics.Error("name_lookup_failed")
		helper.RespondEndpointServerError(w, r, "Failed to create planner",
			"planner create: name lookup failed", "planner_create_name_failed", "planner_create", err, nil)
		return
	}

	stored, err := h.Mongo.EnsurePlanner(ctx, owner, name, accountID, time.Now().UTC())
	if err != nil {
		metrics.Error("database_error")
		helper.RespondEndpointServerError(w, r, "Failed to create planner",
			"planner create: write failed", "planner_create_write_failed", "planner_create", err, nil)
		return
	}

	// The stored name rather than the proposed one: the write is insert-only, so a
	// planner that already had a document keeps what it was called.
	w.WriteHeader(http.StatusOK)
	if err := helper.EncodeJSON(w, listEntry{
		Owner: owner.Key(),
		Kind:  string(owner.Kind),
		Name:  stored.Name,
		Named: true,
	}); err != nil {
		metrics.Error("encode_error")
		helper.RespondEndpointServerError(w, r, "Internal server error",
			"planner create: encode failed", "planner_create_encode_failed", "planner_create", err, nil)
		return
	}

	metrics.Success()
	logs.AttachHandlerSuccessDetail(r, "planner named", map[string]any{
		"owner_kind": string(owner.Kind),
	})
}

// errNPCCorporation refuses a planner for one of EVE's own corporations.
//
// Nobody administers such a corporation, and every character who has not joined
// a player one is in it — so its planner would be shared by strangers with no way
// to manage it. The membership reconcile already excludes these, so reaching here
// means an account holds a row written before that exclusion existed.
var errNPCCorporation = errors.New("planner: NPC corporations cannot have a planner")

// plannerName is what to call a planner, by kind.
//
// An account's is named by its owner and needs no lookup. A corporation's or
// alliance's is the entity's own name, read from EVE rather than taken from the
// client: a name the server stores is a fact about the planner, and one the
// client supplies is one it can supply wrongly.
func (h *Handlers) plannerName(ctx context.Context, owner models.Owner) (string, error) {
	switch owner.Kind {
	case models.OwnerAccount:
		// Reached only by a planner whose document was lost: login writes it, and
		// the name it writes is the one to restore.
		return eipmongo.DefaultAccountPlannerName, nil

	case models.OwnerCorporation:
		id, err := h.entityID(entityid.KindCorp, owner.ID)
		if err != nil {
			return "", err
		}
		if models.IsNPCCorporation(id) {
			return "", errNPCCorporation
		}
		corp, err := entitynames.LookupCorporation(ctx, h.ESI, id)
		if err != nil {
			return "", err
		}
		return strings.TrimSpace(corp.Name), nil

	case models.OwnerAlliance:
		id, err := h.entityID(entityid.KindAlliance, owner.ID)
		if err != nil {
			return "", err
		}
		alliance, err := entitynames.LookupAlliance(ctx, h.ESI, id)
		if err != nil {
			return "", err
		}
		return strings.TrimSpace(alliance.Name), nil

	default:
		return "", fmt.Errorf("planner: %q has no naming rule", owner.Kind)
	}
}

// entityID reads the EVE id back out of a ref, which is the only place the raw
// id exists on this path.
func (h *Handlers) entityID(kind, ref string) (int64, error) {
	if h.EntityCipher == nil {
		return 0, errors.New("planner: no entity cipher")
	}
	return h.EntityCipher.DecryptKind(kind, ref)
}
