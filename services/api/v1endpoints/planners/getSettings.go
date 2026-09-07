package planners

import (
	"context"
	"errors"
	"net/http"
	"time"

	"eve-industry-planner/api/helper"
	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"
	"eve-industry-planner/shared/telemetry/apimetrics"
)

// settingsResponse is a planner's settings as a client sees them. Seeded is
// false when the planner has none of its own and the defaults are answered.
type settingsResponse struct {
	Owner    string           `json:"owner"`
	Seeded   bool             `json:"seeded"`
	Settings planner.Settings `json:"settings"`
}

// GetPlannerSettingsHandler handles GET /api/v1/planners/{ownerHandle}/settings —
// the settings a planner's work is done under.
func (h *Handlers) GetPlannerSettingsHandler(w http.ResponseWriter, r *http.Request, handle string) {
	ctx := r.Context()
	m := apimetrics.GetAPIPlanners()
	metrics := helper.BeginRequestMetrics(ctx, helper.RequestMetricsHooks{
		ObserveDuration: func(ctx context.Context, ms float64) { m.Requests.Observe(ctx, ms) },
		IncRequests:     func(ctx context.Context) { m.RequestsCount.Inc(ctx) },
		IncSuccesses:    func(ctx context.Context) { m.Successes.Inc(ctx) },
		IncErrors:       func(ctx context.Context, reason string) { m.Errors.WithLabelValues(reason).Inc(ctx) },
	})
	defer metrics.Finish()

	owner, ok := h.reachableOwner(w, r, handle, metrics, "planner_settings")
	if !ok {
		return
	}

	settings, seeded, err := h.Mongo.LoadPlannerSettings(ctx, owner)
	if err != nil {
		metrics.Error("database_error")
		helper.RespondEndpointServerError(w, r, "Failed to retrieve planner settings",
			"planner settings: read failed", "planner_settings_read_failed", "planner_settings", err, nil)
		return
	}
	if !seeded {
		settings = planner.DefaultSettings(owner, time.Now().UTC())
	}

	w.WriteHeader(http.StatusOK)
	if err := helper.EncodeJSON(w, settingsResponse{
		Owner:    handle,
		Seeded:   seeded,
		Settings: settings,
	}); err != nil {
		metrics.Error("encode_error")
		helper.RespondEndpointServerError(w, r, "Internal server error",
			"planner settings: encode failed", "planner_settings_encode_failed", "planner_settings", err, nil)
		return
	}

	metrics.Success()
	logs.AttachHandlerSuccessDetail(r, "planner settings read", map[string]any{
		"owner_kind": string(owner.Kind),
		"seeded":     seeded,
	})
}

// reachableOwner resolves a handle to an owner the account holds a membership
// row for, answering the request itself when it does not.
//
// A handle with no row answers 404 rather than 403, so a leaked id reveals only
// that it is not one of theirs.
func (h *Handlers) reachableOwner(w http.ResponseWriter, r *http.Request, handle string,
	metrics *helper.RequestMetricsTracker, route string) (models.Owner, bool) {
	ctx := r.Context()

	accountID := helper.AuthenticatedAccountID(r)
	if accountID == "" {
		metrics.Error("auth_error")
		helper.RespondEndpointError(w, r, http.StatusUnauthorized, "Unauthorized",
			route+": missing account", route+"_missing_account", route, nil, nil)
		return models.Owner{}, false
	}
	if h.Mongo == nil {
		metrics.Error("mongo_client_missing")
		helper.RespondEndpointError(w, r, http.StatusServiceUnavailable, "Service unavailable",
			route+": mongo client missing", "planners_mongo_unavailable", route,
			errors.New("mongo client missing"), nil)
		return models.Owner{}, false
	}

	owner, err := models.ParseOwnerHandle(handle, h.EntityCipher)
	if err != nil {
		metrics.Error("bad_handle")
		helper.RespondEndpointError(w, r, http.StatusBadRequest, "Invalid planner",
			route+": unparseable handle", route+"_bad_handle", route, err, nil)
		return models.Owner{}, false
	}

	mayReach, err := h.Mongo.AccountMayReach(ctx, accountID, owner)
	if err != nil {
		metrics.Error("membership_check_failed")
		helper.RespondEndpointServerError(w, r, "Failed to read planner",
			route+": membership lookup failed", route+"_membership_failed", route, err, nil)
		return models.Owner{}, false
	}
	if !mayReach {
		metrics.Error("not_a_member")
		helper.RespondEndpointError(w, r, http.StatusNotFound, "Not found",
			route+": account holds no membership", route+"_not_found", route, nil,
			map[string]any{"owner_kind": string(owner.Kind)})
		return models.Owner{}, false
	}
	return owner, true
}
