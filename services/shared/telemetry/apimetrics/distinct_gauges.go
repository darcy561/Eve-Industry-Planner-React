package apimetrics

import (
	"context"
	"sync"

	"eve-industry-planner/shared/logs"
	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/shared/telemetry"

	"go.opentelemetry.io/otel/metric"
)

// distinctGauge is one rolling window published as a gauge.
type distinctGauge struct {
	hours       int
	name        string
	unit        string
	description string
}

// registerDistinct publishes one gauge per window, each answered by merging
// that many hourly HyperLogLogs.
func registerDistinct(r *eipredis.Redis, series DistinctSeries, gauges []distinctGauge) {
	if r.Driver() == nil {
		return
	}
	m := telemetry.Meter("api")

	observables := make([]metric.Float64ObservableGauge, 0, len(gauges))
	windows := make([]int, 0, len(gauges))
	for _, g := range gauges {
		obs, err := m.Float64ObservableGauge(g.name,
			metric.WithUnit(g.unit),
			metric.WithDescription(g.description))
		if err != nil {
			logs.ErrorCtx(context.Background(), "apimetrics: observable gauge", "metric", g.name, "error", err)
			return
		}
		observables = append(observables, obs)
		windows = append(windows, g.hours)
	}

	instruments := make([]metric.Observable, len(observables))
	for i, obs := range observables {
		instruments[i] = obs
	}

	_, err := m.RegisterCallback(func(ctx context.Context, o metric.Observer) error {
		// The merge is a Redis round trip per window; tracing it would emit a
		// span every collection interval.
		ctx = telemetry.WithoutTracing(ctx)
		for i, obs := range observables {
			count, err := series.Count(ctx, r, windows[i])
			if err != nil {
				logs.WarnCtx(ctx, "apimetrics: distinct merge", "metric", gauges[i].name, "error", err)
				count = 0
			}
			o.ObserveFloat64(obs, float64(count))
		}
		return nil
	}, instruments...)
	if err != nil {
		logs.ErrorCtx(context.Background(), "apimetrics: register distinct gauges", "error", err)
	}
}

var registerAuthSessionDistinctOnce sync.Once

// RegisterAuthSessionDistinctGauges publishes distinct-account counts over
// rolling 24h, 7d and 30d windows. Values are approximate: HLL's typical error
// is around 0.81%.
func RegisterAuthSessionDistinctGauges(r *eipredis.Redis) {
	registerAuthSessionDistinctOnce.Do(func() {
		registerDistinct(r, authSessionAccounts, []distinctGauge{
			{24, "api.auth_sessions.distinct_accounts_last_24h", "{accounts}",
				"Approximate distinct account IDs that started auth sessions in the rolling prior 24 UTC hours (Redis HLL merge)."},
			{168, "api.auth_sessions.distinct_accounts_last_168h", "{accounts}",
				"Approximate distinct account IDs that started auth sessions in the rolling prior 168 UTC hours (7d; Redis HLL merge)."},
			{720, "api.auth_sessions.distinct_accounts_last_720h", "{accounts}",
				"Approximate distinct account IDs that started auth sessions in the rolling prior 720 UTC hours (30d; Redis HLL merge)."},
		})
	})
}

var registerSSORefreshDistinctOnce sync.Once

// RegisterSSORefreshDistinctGauges publishes distinct-character counts over
// rolling 24h and 7d windows. The windows are fixed rather than following
// Grafana's time picker.
func RegisterSSORefreshDistinctGauges(r *eipredis.Redis) {
	registerSSORefreshDistinctOnce.Do(func() {
		registerDistinct(r, ssoRefreshCharacters, []distinctGauge{
			{24, "api.eve_sso_token_refresh.distinct_characters_last_24h", "{characters}",
				"Approximate distinct character hashes with ≥1 successful EVE OAuth token refresh in the rolling prior 24 UTC hours (Redis HLL merge)."},
			{168, "api.eve_sso_token_refresh.distinct_characters_last_168h", "{characters}",
				"Approximate distinct character hashes with ≥1 successful EVE OAuth token refresh in the rolling prior 168 UTC hours (7d; Redis HLL merge)."},
		})
	})
}

// RecordAuthSessionDistinctAccount notes an account starting a session.
func RecordAuthSessionDistinctAccount(ctx context.Context, r *eipredis.Redis, accountID string) {
	if err := authSessionAccounts.Record(ctx, r, accountID); err != nil {
		logs.WarnCtx(ctx, "apimetrics: record distinct account", "error", err)
	}
}

// RecordSSORefreshDistinctCharacter notes a character refreshing an SSO token.
func RecordSSORefreshDistinctCharacter(ctx context.Context, r *eipredis.Redis, characterHash string) {
	if err := ssoRefreshCharacters.Record(ctx, r, characterHash); err != nil {
		logs.WarnCtx(ctx, "apimetrics: record distinct character", "error", err)
	}
}
