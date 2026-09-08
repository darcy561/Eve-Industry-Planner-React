package apimetrics

import (
	"context"
	"time"

	eipredis "eve-industry-planner/shared/redis"
)

// DistinctSeries counts how many distinct things were seen over a rolling
// window, by keeping one HyperLogLog per UTC hour and merging the hours a
// question asks for.
type DistinctSeries struct {
	prefix    string
	retention time.Duration
}

var (
	// authSessionAccounts counts accounts starting sessions; asked for 24h,
	// 168h and 720h, so it keeps a little over 30 days.
	authSessionAccounts = DistinctSeries{
		prefix:    "apimetrics:auth_sessions_distinct:hll:",
		retention: 35 * 24 * time.Hour,
	}
	// ssoRefreshCharacters counts characters refreshing SSO tokens; asked for
	// 24h and 168h, so it keeps a little over 7 days.
	ssoRefreshCharacters = DistinctSeries{
		prefix:    "apimetrics:sso_refresh_distinct:hll:",
		retention: 8 * 24 * time.Hour,
	}
)

// hourKey names the bucket an instant falls in.
func (s DistinctSeries) hourKey(at time.Time) string {
	return s.prefix + at.UTC().Truncate(time.Hour).Format("2006010215")
}

// hourKeys names the buckets covering the numHours ending at the current hour.
func (s DistinctSeries) hourKeys(now time.Time, numHours int) []string {
	hour := now.UTC().Truncate(time.Hour)
	keys := make([]string, 0, numHours)
	for i := range numHours {
		keys = append(keys, s.hourKey(hour.Add(-time.Duration(i)*time.Hour)))
	}
	return keys
}

// Record adds a value to the current hour's bucket.
func (s DistinctSeries) Record(ctx context.Context, r *eipredis.Redis, value string) error {
	if value == "" {
		return nil
	}
	return r.AddDistinct(ctx, s.hourKey(time.Now()), s.retention, value)
}

// Count estimates the distinct values seen in the last numHours.
func (s DistinctSeries) Count(ctx context.Context, r *eipredis.Redis, numHours int) (uint64, error) {
	if numHours <= 0 {
		return 0, nil
	}
	return r.CountDistinct(ctx, s.hourKeys(time.Now(), numHours)...)
}
