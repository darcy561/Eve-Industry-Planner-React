// Package plannersession owns the planner session keyspace in Redis: the
// refresh tokens a browser holds, the per-account record of live sessions, and
// the indexes that resolve a session id without knowing whose it is.
//
// These are planner sessions, not EVE SSO or ESI OAuth material. An ESI refresh
// secret lives in Mongo and never appears here.
package plannersession

import (
	"strings"
	"time"
)

// The Redis key contract for planner sessions.
//
// Six families, and they are not independent: a session is one row under
// AccountSessionsKeyPrefix plus two indexes that point at it, and a refresh
// token is a row of its own that the session-refresh index names. Anything that
// writes one and not the others leaves a session that cannot be resolved.
const (
	// RefreshTokenKeyPrefix holds planner app session refresh tokens
	// (refresh_token:<token>). Not ESI OAuth refresh secrets, which live in
	// Mongo.
	RefreshTokenKeyPrefix = "refresh_token:"

	// AccountSessionsKeyPrefix holds every session an account has, as one row.
	AccountSessionsKeyPrefix = "account_sessions:"

	// SessionIndexKeyPrefix maps session_id -> account_id, so a session can be
	// resolved without knowing whose it is.
	SessionIndexKeyPrefix = "session_index:"

	// SessionRefreshIndexKeyPrefix maps session_id -> its current refresh
	// token, so a tab that lost its token can recover the live one.
	SessionRefreshIndexKeyPrefix = "session_refresh:"

	// CorporationKeyPrefix and AllianceKeyPrefix cache the org ids ESI reported
	// for an account.
	CorporationKeyPrefix = "custom_claims_corporations:"
	AllianceKeyPrefix    = "custom_claims_alliances:"
)

// How long each kind of key lives.
const (
	// RefreshTokenTTL bounds a planner session: a token older than this cannot
	// be exchanged, which is what forces a periodic return to EVE SSO.
	RefreshTokenTTL = 7 * 24 * time.Hour

	// SessionTTL matches RefreshTokenTTL so a session row ages out with the
	// token that keeps it alive.
	SessionTTL = RefreshTokenTTL

	// CorporationTTL outlives a session, because the org ids are a cache of
	// what ESI reported rather than part of the session itself.
	CorporationTTL = 30 * 24 * time.Hour
)

// Ids reaching these builders are trimmed at the edge rather than by each
// caller: an id that is trimmed when checked but not when used writes a key
// nothing can read back.

func refreshTokenKey(token string) string {
	return RefreshTokenKeyPrefix + strings.TrimSpace(token)
}

func accountKey(accountID string) string {
	return AccountSessionsKeyPrefix + strings.TrimSpace(accountID)
}

func sessionIndexKey(sessionID string) string {
	return SessionIndexKeyPrefix + strings.TrimSpace(sessionID)
}

func sessionRefreshIndexKey(sessionID string) string {
	return SessionRefreshIndexKeyPrefix + strings.TrimSpace(sessionID)
}

func corporationKey(accountID string) string {
	return CorporationKeyPrefix + strings.TrimSpace(accountID)
}

func allianceKey(accountID string) string {
	return AllianceKeyPrefix + strings.TrimSpace(accountID)
}

// accountKeyForScanned names the record key for an id a scan returned.
//
// A scan reports the id as stored, which is not always what a builder would
// produce from it: an id carrying whitespace was written under that key, and
// rebuilding it would address a different one.
func accountKeyForScanned(accountID string) string {
	return AccountSessionsKeyPrefix + accountID
}
