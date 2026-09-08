package metrics

import (
	"context"

	"eve-industry-planner/core/metrics/appconfig"
	"eve-industry-planner/core/metrics/esi"
	"eve-industry-planner/core/metrics/sde"
	"eve-industry-planner/core/metrics/users"
	eipappconfig "eve-industry-planner/shared/appconfig"
	"eve-industry-planner/shared/esiclient"
	"eve-industry-planner/shared/logs"
	eipnats "eve-industry-planner/shared/nats"

	eipmongo "eve-industry-planner/shared/mongo"
	eipredis "eve-industry-planner/shared/redis"
)

// RegisterAll wires core service metric groups.
func RegisterAll(r *eipredis.Redis, mongoHandle *eipmongo.Mongo, natsHandle *eipnats.NATS) []func(context.Context) {
	cleanups := make([]func(context.Context), 0, 1)
	esi.Register(esiclient.NewStore(r, esiclient.DefaultConfig()))
	users.Register(mongoHandle)
	sde.Register()
	appconfig.Register(eipappconfig.NewMaintenanceFlag(r))
	if natsHandle != nil {
		stop, err := eipnats.SubscribeSDEBuildUpdated(natsHandle, func(u eipnats.SDECurrentBuildUpdate) {
			sde.SetCurrentVersion(u.BuildNumber, u.Version)
		})
		if err != nil {
			logs.WarnCtx(context.Background(), "failed to subscribe to SDE build update subject", "error", err)
		} else {
			cleanups = append(cleanups, func(context.Context) { stop() })
		}
	}
	return cleanups
}
