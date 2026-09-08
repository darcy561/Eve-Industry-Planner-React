package singleton

import (
	"testing"

	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/shared/stackservices"
)

// A handle and a connection are separate things: Connect always pairs them, but
// NewRedis(nil) does not, and the jobs below hand the driver to code that takes
// a raw client.
func TestStartRefusesAHandleWithNoConnection(t *testing.T) {
	if _, err := Start(&stackservices.Clients{Redis: eipredis.NewRedis(nil)}); err == nil {
		t.Fatal("Start accepted a handle with no connection")
	}
}

func TestAuthSessionMaintenanceSkipsAHandleWithNoConnection(t *testing.T) {
	job := AuthSessionMaintenanceJob(&stackservices.Clients{Redis: eipredis.NewRedis(nil)})
	if err := job.Run(t.Context()); err != nil {
		t.Fatalf("job.Run = %v, want nil", err)
	}
}
