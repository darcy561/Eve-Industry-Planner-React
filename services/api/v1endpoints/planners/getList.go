package planners

import (
	"context"
	"errors"
	"net/http"

	"eve-industry-planner/api/helper"
	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/telemetry/apimetrics"
)

// listEntry is one planner as a client sees it.
//
// Owner is the handle, not the stored key — identical for the account kind, and
// for a corporation or alliance it carries the ref that already stands in for the
// entity id everywhere else a client is told about one.
//
// Name is empty when nothing has named the planner yet. That is ordinary rather
// than exceptional: a membership row is the whole of what grants access, so an
// account reaches every corporation it is in before any of them has a document.
// The client names those from what it already knows about the entity, and the
// document is written when somebody chooses to work in one.
type listEntry struct {
	Owner      string `json:"owner"`
	Kind       string `json:"kind"`
	Name       string `json:"name,omitempty"`
	Named      bool   `json:"named"`
	JoinMethod string `json:"joinMethod"`
}

type listResponse struct {
	Planners []listEntry `json:"planners"`
}

// GetPlannersHandler handles GET /api/v1/planners — every planner the session's
// account may work in.
//
// Read-only, deliberately: it writes no planner document for an owner that lacks
// one. A listing that created documents would write on a GET and would fill the
// collection with planners nobody has opened.
func (h *Handlers) GetPlannersHandler(w http.ResponseWriter, r *http.Request) {
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
			"planners list: missing account", "planners_list_missing_account", "planners_list", nil, nil)
		return
	}
	if h.Mongo == nil {
		metrics.Error("mongo_client_missing")
		helper.RespondEndpointError(w, r, http.StatusServiceUnavailable, "Service unavailable",
			"planners list: mongo client missing", "planners_mongo_unavailable", "planners_list",
			errors.New("mongo client missing"), nil)
		return
	}

	listings, err := h.Mongo.PlannersForAccount(ctx, accountID)
	if err != nil {
		metrics.Error("database_error")
		helper.RespondEndpointServerError(w, r, "Failed to retrieve planners",
			"planners list: read failed", "planners_list_read_failed", "planners_list", err, nil)
		return
	}

	entries := make([]listEntry, 0, len(listings))
	for _, listing := range listings {
		entries = append(entries, listEntry{
			Owner:      listing.Owner.Key(),
			Kind:       string(listing.Owner.Kind),
			Name:       listing.Name,
			Named:      listing.Named,
			JoinMethod: string(listing.JoinKind),
		})
	}

	w.WriteHeader(http.StatusOK)
	if err := helper.EncodeJSON(w, listResponse{Planners: entries}); err != nil {
		metrics.Error("encode_error")
		helper.RespondEndpointServerError(w, r, "Internal server error",
			"planners list: encode failed", "planners_list_encode_failed", "planners_list", err, nil)
		return
	}

	metrics.Success()
	logs.AttachHandlerSuccessDetail(r, "planners listed", map[string]any{
		"count": len(entries),
	})
}
