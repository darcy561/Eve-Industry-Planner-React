// Package request reads a planner session off an HTTP request: the cookie and
// header a browser presents, the session they resolve to, and the log detail a
// failure produces.
package request

import (
	"net/http"
	"strings"

	"eve-industry-planner/shared/plannersession"
)

// SessionCookieName is the legacy shared session cookie (fallback only).
// Per-tab sessions use SessionIDHeader (HTTP) or SessionIDQueryParam (WebSocket).
const SessionCookieName = "eip_session"

// SessionIDHeader is the per-tab planner session id on HTTP requests.
const SessionIDHeader = "X-Session-ID"

// SessionIDQueryParam is the per-tab planner session id on WebSocket upgrade.
const SessionIDQueryParam = "planner_session_id"

const sessionCookiePath = "/"

func SessionCookieMaxAgeSeconds() int {
	return int(plannersession.RefreshTokenTTL.Seconds())
}

func SetSessionCookie(w http.ResponseWriter, sessionID string) {
	if w == nil || sessionID == "" {
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    sessionID,
		Path:     sessionCookiePath,
		MaxAge:   SessionCookieMaxAgeSeconds(),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}

func ClearSessionCookie(w http.ResponseWriter) {
	if w == nil {
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     sessionCookiePath,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}

func ReadSessionCookie(r *http.Request) string {
	if r == nil {
		return ""
	}
	c, err := r.Cookie(SessionCookieName)
	if err != nil || c == nil {
		return ""
	}
	return strings.TrimSpace(c.Value)
}

// SessionID returns the active planner session for this request/tab.
// Priority: X-Session-ID header, planner_session_id query (WebSocket), legacy eip_session cookie.
func SessionID(r *http.Request) string {
	if r == nil {
		return ""
	}
	if sid := strings.TrimSpace(r.Header.Get(SessionIDHeader)); sid != "" {
		return sid
	}
	if r.URL != nil {
		if sid := strings.TrimSpace(r.URL.Query().Get(SessionIDQueryParam)); sid != "" {
			return sid
		}
	}
	return ReadSessionCookie(r)
}
