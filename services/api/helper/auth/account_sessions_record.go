package auth

import (
	"strings"
	"time"
)

// The rules an account's sessions record carries with it, wherever it is read
// or written: what a well-formed record looks like, and which of its sessions
// have aged out. They belong with the record rather than with any one way of
// storing it.

func normalizeAccountSessionsRecord(rec *AccountSessionsRecord, accountID string) {
	if rec == nil {
		return
	}
	acc := strings.TrimSpace(accountID)
	if rec.AccountID == "" {
		rec.AccountID = acc
	}
	if rec.Sessions == nil {
		rec.Sessions = map[string]AccountSession{}
	}
	rec.Grants.OwnerKeys = rec.Grants.OwnerKeys.Normalized()
}

func pruneExpiredSessions(rec *AccountSessionsRecord, now time.Time) (removed []string, changed bool) {
	if rec == nil || len(rec.Sessions) == 0 {
		return nil, false
	}
	for sessionID, session := range rec.Sessions {
		if session.ReauthRequiredAt.IsZero() {
			session.ReauthRequiredAt = ReauthDeadlineFromSessionStart(session.StartedAt)
			rec.Sessions[sessionID] = session
			changed = true
		}
		if IsReauthExpired(session.StartedAt, session.ReauthRequiredAt, now) {
			delete(rec.Sessions, sessionID)
			removed = append(removed, sessionID)
			changed = true
		}
	}
	return removed, changed
}
