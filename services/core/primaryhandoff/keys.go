// Package primaryhandoff holds Redis key contracts for core primary changeover
// data that must survive process death (e.g. changestream resume tokens).
// Namespace is expandable — add more keys under Prefix, not a single JSON blob.
package primaryhandoff

import "strings"

const Prefix = "eip:core:handoff:v1:"

// resumeTokenPrefix is what every resume-token key starts with, so a scan and a
// key are built from the same string.
const resumeTokenPrefix = Prefix + "cs:resume:"

// ttlResumeToken is unset: a token must outlive the process that wrote it, and
// a retired group's key is removed by name rather than by expiry.
const ttlResumeToken = 0

// ResumeTokenKey names the Mongo change-stream resume token for one collection
// group, holding the base64-encoded bson of the event _id. The id is trimmed
// here as it is on every read and write, so the key always names what that
// group's token was stored under.
func ResumeTokenKey(groupID string) string {
	return resumeTokenPrefix + strings.TrimSpace(groupID)
}
