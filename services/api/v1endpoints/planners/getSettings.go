package planners

import (
	"context"
	"net/http"
	"time"

	"eve-industry-planner/api/helper"
	"eve-industry-planner/shared/logs"
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

	owner, ok := helper.PlannerOwnerFromHandle(w, r, handle, h.Mongo, h.EntityCipher, metrics, "planner_settings")
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
