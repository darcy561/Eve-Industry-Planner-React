package documentlock

import (
	eipmongo "eve-industry-planner/shared/mongo"
	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/shared/stackservices"

	eipredis "eve-industry-planner/shared/redis"
)

// Deps holds infrastructure used by document-lock operations (HTTP, WebSocket, subscribers).
type Deps struct {
	Redis *eipredis.Redis
	Mongo *eipmongo.Mongo
	NATS  *eipnats.NATS
}

// DepsFromClients maps the shared stack-service clients into Deps.
func DepsFromClients(c *stackservices.Clients) Deps {
	if c == nil {
		return Deps{}
	}
	return Deps{
		Redis: c.Redis,
		Mongo: c.Mongo,
		NATS:  c.NATS,
	}
}
