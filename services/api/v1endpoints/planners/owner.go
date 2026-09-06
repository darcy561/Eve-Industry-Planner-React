package planners

import (
	"fmt"
	"strings"

	"eve-industry-planner/shared/models"
)

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
