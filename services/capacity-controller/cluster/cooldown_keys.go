package cluster

// The Redis key contract for capacity cooldowns.

const cooldownKeyPrefix = "eip:capacity:cooldown:v1:"

// CooldownRedisKey returns the Redis key for one service's Apply hysteresis.
func CooldownRedisKey(svc Service) string {
	return cooldownKeyPrefix + string(svc)
}
