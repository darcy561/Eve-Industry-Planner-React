package mongo

import "eve-industry-planner/shared/models"

// OwnerScopedIDCollections hold documents whose _id carries the owner.
//
// A planner-held document's id must state its owner, because _id is unique
// across a collection: a bare id could exist only once, so the same job id in two
// planners would collide. See [OwnerScopedDocumentID].
//
// The account's own singleton documents are not here. Their _id is the account
// id, which already names the only owner they can have.
func OwnerScopedIDCollections() []string {
	return []string{
		CollectionJobDocuments,
		CollectionJobGroups,
		CollectionArchivedJobs,
		CollectionGroupTemplatePayloads,
	}
}

// NeedsOwnerScopedID reports whether a stored id in one of these collections has
// yet to be rewritten.
//
// The test is the id itself rather than a flag: an id that already names its
// owner is done, which is what makes the rewrite idempotent and its remaining
// work countable.
func NeedsOwnerScopedID(storedID string) bool {
	_, err := OwnerFromDocumentID(storedID)
	return err != nil
}

// RewrittenDocumentID is the id a document moves to, or empty when it is already
// there.
func RewrittenDocumentID(owner models.Owner, storedID string) string {
	if !NeedsOwnerScopedID(storedID) {
		return ""
	}
	return OwnerScopedDocumentID(owner, storedID)
}
