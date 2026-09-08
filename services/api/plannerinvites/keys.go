// Package plannerinvites holds the invites that admit an account to a planner,
// as Redis records rather than documents.
//
// An invite is a credential with a lifetime: the key's TTL is its expiry,
// revoking is a delete, and nothing sweeps or indexes. What a membership needed
// from one is copied at join time, so the credential is free to vanish.
package plannerinvites

import "strings"

// Prefix namespaces every key this package owns. Namespace is expandable — add
// keys under it rather than widening one record.
const Prefix = "eip:planner:invite:v1:"

const (
	recordPrefix = Prefix + "id:"
	plannerIndex = Prefix + "planner:"
)

// recordKey names one invite's record, held for as long as the invite is valid.
func recordKey(inviteID string) string {
	return recordPrefix + strings.TrimSpace(inviteID)
}

// plannerKey names the set of a planner's outstanding invites, scored by expiry.
//
// A set rather than a scan: counting one planner's invites must not cost a walk
// of every invite in the application.
func plannerKey(plannerID string) string {
	return plannerIndex + strings.TrimSpace(plannerID)
}
