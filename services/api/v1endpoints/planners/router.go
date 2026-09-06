package planners

import (
	"net/http"

	"eve-industry-planner/api/helper"
)

// Router routes /api/v1/planners. Runs after the private middleware (rate limit,
// auth); see each handler for status codes.
func (h *Handlers) Router(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		helper.RespondEndpointError(w, r, http.StatusMethodNotAllowed,
			"Method not allowed. Use GET /api/v1/planners",
			"invalid method for planners endpoint", "method_not_allowed", "planners", nil,
			map[string]any{"method": r.Method})
		return
	}
	h.GetPlannersHandler(w, r)
}
