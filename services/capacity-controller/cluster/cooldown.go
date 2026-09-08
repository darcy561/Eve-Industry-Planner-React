package cluster

import (
	"context"
	"time"

	"eve-industry-planner/shared/logs"
	eipredis "eve-industry-planner/shared/redis"
)

const cooldownTTLFloor = time.Hour

// cooldownTTL derives a stamp's lifetime from the window rather than fixing it,
// because the window is operator-configured with no upper bound.
func cooldownTTL(window time.Duration) time.Duration {
	return max(window*2, cooldownTTLFloor)
}

// Cooldowns records when each service was last scaled, so a replacement
// controller does not re-scale inside a window the previous one started.
//
// Losing a stamp costs at most one early scaling action, so Redis failures are
// logged and read as "no cooldown recorded" rather than stopping the loop.
type Cooldowns struct{ redis *eipredis.Redis }

// NewCooldowns binds the store to a Redis handle. A nil handle records nothing
// and reports no cooldown, which is how the controller runs without Redis.
func NewCooldowns(r *eipredis.Redis) *Cooldowns { return &Cooldowns{redis: r} }

type cooldownBlob struct {
	LastApplyAt time.Time `json:"last_apply_at"`
}

// usable reports whether there is a store to reach. A controller runs without
// Redis, so this is a normal state rather than a fault.
func (c *Cooldowns) usable() bool { return c != nil && c.redis != nil }

// Record stores when svc was last scaled. window is the configured cooldown,
// which decides how long the stamp is kept.
func (c *Cooldowns) Record(ctx context.Context, svc Service, at time.Time, window time.Duration) {
	if !c.usable() {
		return
	}
	blob := cooldownBlob{LastApplyAt: at.UTC()}
	if err := c.redis.PutJSON(ctx, CooldownRedisKey(svc), blob, cooldownTTL(window)); err != nil {
		logs.WarnCtx(ctx, "capacity cooldown record failed",
			"service", string(svc), "error", err)
	}
}

// State reports when svc was last scaled. A zero LastApplyAt means no cooldown
// applies, whether because none was recorded or because it could not be read.
func (c *Cooldowns) State(ctx context.Context, svc Service) CooldownState {
	var state CooldownState
	if !c.usable() {
		return state
	}

	var blob cooldownBlob
	if err := c.redis.GetJSON(ctx, CooldownRedisKey(svc), &blob); err != nil {
		return state
	}
	state.LastApplyAt = blob.LastApplyAt
	return state
}
