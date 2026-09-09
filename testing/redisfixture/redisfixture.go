// Package redisfixture gives a test a fake Redis already wrapped in the handle
// the services take, so a test does not re-type that bridge.
//
// It sits beside redisfake rather than inside it because shared/redis tests the
// handle itself and reaches for redisfake to do so — redisfake reaching back
// for the handle is an import cycle in those tests.
package redisfixture

import (
	"testing"

	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/redisfake"
)

// Redis is a fake Redis and the handle bound to it. The embedded fake still
// carries Server, for the tests that manipulate the store directly, and Client.
type Redis struct {
	*redisfake.Redis
	Handle *eipredis.Redis
}

// New starts a fake Redis and binds a handle to it; both are closed when the
// test ends.
func New(t testing.TB) *Redis {
	t.Helper()
	fake := redisfake.New(t)
	return &Redis{Redis: fake, Handle: eipredis.NewRedis(fake.Client)}
}
