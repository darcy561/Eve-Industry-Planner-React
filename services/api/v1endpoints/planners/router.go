package planners

import (
	"net/http"
	"strings"

	"eve-industry-planner/api/helper"
)

// Router routes /api/v1/planners. Runs after the private middleware (rate limit,
// auth); see each handler for status codes.
func (h *Handlers) Router(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	switch {
	case path == "/api/v1/planners" || path == "/api/v1/planners/":
		if r.Method != http.MethodGet {
			helper.RespondEndpointError(w, r, http.StatusMethodNotAllowed,
				"Method not allowed. Use GET /api/v1/planners",
				"invalid method for planners endpoint", "method_not_allowed", "planners", nil,
				map[string]any{"method": r.Method})
			return
		}
		h.GetPlannersHandler(w, r)

	case strings.HasPrefix(path, "/api/v1/planners/"):
		// The handle is the rest of the path rather than one segment: an owner
		// key is `kind:id`, and the id of an entity kind is a ref that carries no
		// slash but is not worth assuming a shape for.
		rest := strings.TrimSuffix(strings.TrimPrefix(path, "/api/v1/planners/"), "/")

		if handle, found := strings.CutSuffix(rest, "/settings"); found {
			if handle == "" || strings.Contains(handle, "/") {
				helper.RespondEndpointError(w, r, http.StatusNotFound, "Not found",
					"planners route not found", "planners_not_found", "planners", nil,
					map[string]any{"path": path})
				return
			}
			if r.Method != http.MethodGet {
				helper.RespondEndpointError(w, r, http.StatusMethodNotAllowed,
					"Method not allowed. Use GET /api/v1/planners/{owner}/settings",
					"invalid method for planner settings endpoint", "method_not_allowed", "planners", nil,
					map[string]any{"method": r.Method})
				return
			}
			h.GetPlannerSettingsHandler(w, r, handle)
			return
		}

		if rest == "" || strings.Contains(rest, "/") {
			helper.RespondEndpointError(w, r, http.StatusNotFound, "Not found",
				"planners route not found", "planners_not_found", "planners", nil,
				map[string]any{"path": path})
			return
		}
		if r.Method != http.MethodPut {
			helper.RespondEndpointError(w, r, http.StatusMethodNotAllowed,
				"Method not allowed. Use PUT /api/v1/planners/{owner}",
				"invalid method for planner endpoint", "method_not_allowed", "planners", nil,
				map[string]any{"method": r.Method})
			return
		}
		h.PutPlannerHandler(w, r, rest)

	default:
		helper.RespondEndpointError(w, r, http.StatusNotFound, "Not found",
			"planners route not found", "planners_not_found", "planners", nil,
			map[string]any{"path": path})
	}
}
