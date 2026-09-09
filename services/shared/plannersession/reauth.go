package plannersession

import "time"

// ReauthDeadlineFromSessionStart is when periodic full SSO is required for this
// planner session chain. It is anchored at login/bootstrap SessionStart and must
// not move on rotate/bootstrap.
func ReauthDeadlineFromSessionStart(sessionStart time.Time) time.Time {
	if sessionStart.IsZero() {
		return time.Time{}
	}
	return sessionStart.UTC().Add(RefreshTokenTTL)
}

// reauthDeadline is the effective periodic-SSO deadline. When both a session
// start and a stored reauth_required_at are set the earlier applies, so rows
// that disagree resolve to the stricter of the two.
func reauthDeadline(sessionStart, reauthRequiredAt time.Time) time.Time {
	fromStart := ReauthDeadlineFromSessionStart(sessionStart)
	if reauthRequiredAt.IsZero() {
		return fromStart
	}
	r := reauthRequiredAt.UTC()
	if fromStart.IsZero() {
		return r
	}
	if r.Before(fromStart) {
		return r
	}
	return fromStart
}

// ReauthRequiredAtUnix is the API-facing unix seconds for reauth_required_at (0 when unknown).
func ReauthRequiredAtUnix(sessionStart, reauthRequiredAt time.Time) int64 {
	d := reauthDeadline(sessionStart, reauthRequiredAt)
	if d.IsZero() {
		return 0
	}
	return d.Unix()
}

// IsReauthExpired reports whether now is past the effective reauth deadline
// (After, not >=).
func IsReauthExpired(sessionStart, reauthRequiredAt, now time.Time) bool {
	deadline := reauthDeadline(sessionStart, reauthRequiredAt)
	if deadline.IsZero() {
		return false
	}
	return now.UTC().After(deadline)
}
