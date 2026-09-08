package mongo

import (
	"fmt"
	"strings"

	"eve-industry-planner/shared/models"
)

// documentIDSeparator divides the owner key from the id it scopes. The owner key
// separates its own halves with ":", so the two never collide.
const documentIDSeparator = "|"

// OwnerScopedDocumentID is the stored _id of a document belonging to one planner:
// {ownerKey}|{id}.
//
// `_id` is unique across a collection, so a bare id could exist only once and an
// upsert filtered on owner and id would insert a duplicate rather than update the
// document it meant. The owner in the id is what keeps the two in step.
//
// The bare id is what a client sends and receives; compose here and split with
// [BareDocumentID] at the boundary.
func OwnerScopedDocumentID(owner models.Owner, id string) string {
	if owner.IsZero() || id == "" {
		return ""
	}
	return owner.Key() + documentIDSeparator + id
}

// OwnerScopedDocumentIDs is [OwnerScopedDocumentID] over a list, dropping ids it
// cannot scope so a filter is never built from a partial one.
func OwnerScopedDocumentIDs(owner models.Owner, ids []string) []string {
	if owner.IsZero() || len(ids) == 0 {
		return nil
	}
	scoped := make([]string, 0, len(ids))
	for _, id := range ids {
		if scopedID := OwnerScopedDocumentID(owner, id); scopedID != "" {
			scoped = append(scoped, scopedID)
		}
	}
	return scoped
}

// BareDocumentID is the id a client knows, taken back out of a stored one.
//
// An id carrying no owner is returned unchanged: documents an account owns
// wherever it works are keyed by the account id alone, and so are the collections
// that predate owner scoping.
func BareDocumentID(storedID string) string {
	_, bare, found := strings.Cut(storedID, documentIDSeparator)
	if !found {
		return storedID
	}
	return bare
}

// OwnerFromDocumentID reads the owner out of a stored id.
//
// The error names the id rather than assuming a caller can, because an id that
// does not parse is a document nothing can route.
func OwnerFromDocumentID(storedID string) (models.Owner, error) {
	key, _, found := strings.Cut(storedID, documentIDSeparator)
	if !found {
		return models.Owner{}, fmt.Errorf("document id %q carries no owner", storedID)
	}
	return models.ParseOwnerKey(key)
}
