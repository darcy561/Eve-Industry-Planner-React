package request

import (
	"errors"
	"maps"
	"net/http"
	"strings"

	"eve-industry-planner/shared/dependency"
)

// SessionError carries the client-facing auth failure code from ExtractSession.
// Error() returns the API code. ExtractSession produces session_missing and
// session_revoked; reauth_required belongs to the same vocabulary but is raised
// by the rotate endpoint, which reads the deadline off the refresh-token row.
type SessionError struct {
	Code      string
	AccountID string
	SessionID string
	Reason    string
}

func (e *SessionError) Error() string {
	if e == nil {
		return ""
	}
	return e.Code
}

const (
	reasonSessionAbsent       = "session_absent"
	reasonSessionIndexMissing = "session_index_not_found"
	reasonSessionRowMissing   = "session_row_missing"
	reasonRedisError          = "redis_error"
)

// IsInfrastructureError reports auth/session failures caused by Redis being unreachable
// rather than a missing or invalid session.
func IsInfrastructureError(err error) bool {
	if err == nil {
		return false
	}
	var sessErr *SessionError
	if errors.As(err, &sessErr) && sessErr != nil && sessErr.Reason == reasonRedisError {
		return true
	}
	return dependency.IsUnavailable(err)
}

// FailureDetail is safe diagnostic context for invalid session logs (no secrets beyond ids).
type FailureDetail struct {
	Code                      string
	AccountID                 string
	SessionID                 string
	HasEipSessionCookie       bool
	HasPlannerSessionIDHeader bool
	Reason                    string
}

// FailureDetailFromError builds log context from a session validation error.
func FailureDetailFromError(err error, r *http.Request) FailureDetail {
	d := FailureDetail{
		HasEipSessionCookie:       strings.TrimSpace(ReadSessionCookie(r)) != "",
		HasPlannerSessionIDHeader: strings.TrimSpace(r.Header.Get(SessionIDHeader)) != "",
	}
	var sessErr *SessionError
	if errors.As(err, &sessErr) && sessErr != nil {
		d.Code = sessErr.Code
		d.AccountID = sessErr.AccountID
		d.SessionID = sessErr.SessionID
		d.Reason = sessErr.Reason
		return d
	}
	if err != nil {
		d.Code = err.Error()
	}
	return d
}

// ClientFailureMessage returns the consolidated access-log message for request logging middleware.
func (d FailureDetail) ClientFailureMessage() string {
	switch d.Code {
	case "session_missing":
		return "auth session missing or invalid"
	case "session_revoked":
		return "auth session revoked"
	case "reauth_required":
		return "auth session reauth required"
	default:
		return "auth session validation failed"
	}
}

// ClientFailureDetail returns structured fields for consolidated 4xx request logging.
func (d FailureDetail) ClientFailureDetail(extra map[string]any) map[string]any {
	out := map[string]any{
		"failure_class":                 failureClass(d.Code),
		"code":                          d.Code,
		"has_eip_session_cookie":        d.HasEipSessionCookie,
		"has_planner_session_id_header": d.HasPlannerSessionIDHeader,
	}
	if d.AccountID != "" {
		out["account_id"] = d.AccountID
	}
	if d.SessionID != "" {
		out["session_id"] = d.SessionID
	}
	if d.Reason != "" {
		out["reason"] = d.Reason
	}
	maps.Copy(out, extra)
	return out
}

func failureClass(code string) string {
	switch code {
	case "session_missing":
		return "auth_session_missing"
	case "session_revoked":
		return "auth_session_revoked"
	case "reauth_required":
		return "auth_reauth_required"
	default:
		return "auth_session_invalid"
	}
}

// LogFields returns structured key/value pairs for direct WarnCtx (e.g. websocket without access logging).
func (d FailureDetail) LogFields(extra ...any) []any {
	fields := make([]any, 0, 8+len(extra))
	fields = append(fields,
		"code", d.Code,
		"has_eip_session_cookie", d.HasEipSessionCookie,
	)
	if d.AccountID != "" {
		fields = append(fields, "account_id", d.AccountID)
	}
	if d.SessionID != "" {
		fields = append(fields, "session_id", d.SessionID)
	}
	if d.Reason != "" {
		fields = append(fields, "reason", d.Reason)
	}
	return append(fields, extra...)
}
