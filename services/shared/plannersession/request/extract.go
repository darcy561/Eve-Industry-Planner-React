package request

import (
	"context"
	"errors"
	"strings"

	"net/http"

	"eve-industry-planner/shared/plannersession"
)

type contextKey string

const (
	accountIDContextKey contextKey = "plannersession.account_id"
	sessionIDContextKey contextKey = "plannersession.session_id"
)

// Identity is the account and session a request was authenticated as.
type Identity struct {
	AccountID string
	SessionID string
	Session   plannersession.Session
}

func WithIdentity(ctx context.Context, accountID, sessionID string) context.Context {
	if ctx == nil {
		ctx = context.Background()
	}
	ctx = context.WithValue(ctx, accountIDContextKey, strings.TrimSpace(accountID))
	ctx = context.WithValue(ctx, sessionIDContextKey, strings.TrimSpace(sessionID))
	return ctx
}

func AccountIDFromContext(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	v, _ := ctx.Value(accountIDContextKey).(string)
	return strings.TrimSpace(v)
}

func SessionIDFromContext(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	v, _ := ctx.Value(sessionIDContextKey).(string)
	return strings.TrimSpace(v)
}

// ExtractSession resolves the planner session a request presents.
//
// Every failure is a *SessionError carrying the code the client is told and the
// reason logged beside it. The reason distinguishes a session id nothing indexes
// from one whose account record no longer holds it, because those are different
// faults: the first is an expired or forged id, the second a record that lost a
// row an index still names.
func ExtractSession(ctx context.Context, r *http.Request, store *plannersession.Store) (*Identity, error) {
	// Before the request is judged: a store with no connection cannot say
	// whether a session exists, and answering "no session" would report an
	// outage as the caller's fault.
	if err := store.Available(); err != nil {
		return nil, err
	}

	sessionID := SessionID(r)
	if sessionID == "" {
		return nil, &SessionError{Code: "session_missing", Reason: reasonSessionAbsent}
	}

	accountID, session, err := store.ResolveSession(ctx, sessionID)
	if err != nil || session == nil {
		sessErr := &SessionError{
			Code:      "session_missing",
			SessionID: sessionID,
			AccountID: strings.TrimSpace(accountID),
		}
		switch {
		case sessErr.AccountID != "":
			sessErr.Reason = reasonSessionRowMissing
		case errors.Is(err, plannersession.ErrSessionNotFound):
			sessErr.Reason = reasonSessionIndexMissing
		default:
			sessErr.Reason = reasonRedisError
		}
		return nil, sessErr
	}
	// No reauth-deadline check here. Reading the record prunes every session past
	// its deadline, so an elapsed one is gone before this point and arrives as
	// session_missing. Pruning is the single enforcement point: a change that
	// stops it removing expired sessions has to put a check back here.
	if session.RevokedAt != nil {
		return nil, &SessionError{Code: "session_revoked", AccountID: accountID, SessionID: sessionID}
	}
	return &Identity{AccountID: accountID, SessionID: sessionID, Session: *session}, nil
}

// TryExtractSession is ExtractSession for callers that treat every failure the
// same way.
func TryExtractSession(ctx context.Context, r *http.Request, store *plannersession.Store) (*Identity, bool) {
	identity, err := ExtractSession(ctx, r, store)
	if err != nil || identity == nil {
		return nil, false
	}
	return identity, true
}
