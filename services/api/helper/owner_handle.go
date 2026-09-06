package helper

import (
	"fmt"
	"strings"

	"eve-industry-planner/shared/models"
)

// ParseOwnerHandle reads the `kind:id` a path uses to name an owner.
//
// A handle differs from the stored owner key only for the entity kinds, whose
// key holds a ref rather than the raw id — and a ref is what a client is told
// about an entity anyway, so the two are the same string.
//
// Only the first colon separates the two: an account id may contain one, and
// everything after the kind belongs to the id.
func ParseOwnerHandle(segment string) (models.Owner, error) {
	kind, id, found := strings.Cut(segment, ":")
	if !found {
		return models.Owner{}, fmt.Errorf("owner handle %q must be kind:id", segment)
	}
	if id == "" {
		return models.Owner{}, fmt.Errorf("owner handle %q names no owner", segment)
	}
	return models.Owner{Kind: models.OwnerKind(kind), ID: id}, nil
}
