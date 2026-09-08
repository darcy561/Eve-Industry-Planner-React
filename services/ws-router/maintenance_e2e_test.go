package main

import (
	"context"
	"net/http"
	"testing"
	"time"

	"eve-industry-planner/shared/appconfig"
	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/testing/natsfake"
	"eve-industry-planner/testing/redisfake"
	"eve-industry-planner/testing/wait"

	eipredis "eve-industry-planner/shared/redis"
)

// The whole path in one test: core holds Redis and answers the request, the
// router holds neither Redis nor a prior announce and must still refuse. Nothing
// else covers the two services together.
func TestE2ECoreServesRouterRefuses(t *testing.T) {
	fake := natsfake.New(t)
	r := redisfake.New(t)
	ctx := context.Background()

	coreFlag := appconfig.NewMaintenanceFlag(eipredis.NewRedis(r.Client))
	if err := coreFlag.Set(ctx, true); err != nil {
		t.Fatal(err)
	}
	stopServe, err := appconfig.ServeMaintenanceState(ctx, fake.NATS, coreFlag)
	if err != nil {
		t.Fatal(err)
	}
	defer stopServe()

	watcher := appconfig.NewMaintenanceWatcher(fake.NATS)
	stopW, err := watcher.Start(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer stopW()

	router := routerWithMaintenance(t, watcher)
	if rec := serveWS(t, router, "/ws"); rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("router status = %d, want 503 from core's answer", rec.Code)
	}

	// The operator clears it; the announce reaches the router.
	if err := coreFlag.Set(ctx, false); err != nil {
		t.Fatal(err)
	}
	if err := eipnats.PublishMaintenanceState(fake.NATS, false); err != nil {
		t.Fatal(err)
	}
	wait.For(t, 2*time.Second, func() (bool, string) {
		return serveWS(t, router, "/ws").Code != http.StatusServiceUnavailable, "waiting for the clear"
	})
}
