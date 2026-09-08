package cli

import (
	"context"
	"errors"
	"testing"

	"eve-industry-planner/shared/appconfig"
	"eve-industry-planner/testing/redisfake"

	eipredis "eve-industry-planner/shared/redis"
)

func TestParseMaintenanceArgs(t *testing.T) {
	t.Parallel()

	for _, tc := range []struct {
		name         string
		args         []string
		wantChanging bool
		wantEnable   bool
		wantErr      bool
	}{
		{name: "no flags reports", args: nil},
		{name: "on", args: []string{"-on"}, wantChanging: true, wantEnable: true},
		{name: "off", args: []string{"-off"}, wantChanging: true, wantEnable: false},
		{name: "both is refused", args: []string{"-on", "-off"}, wantErr: true},
		{name: "unknown flag is refused", args: []string{"-nope"}, wantErr: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got, err := parseMaintenanceArgs(tc.args)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("parse(%v) succeeded, want an error", tc.args)
				}
				return
			}
			if err != nil {
				t.Fatalf("parse(%v): %v", tc.args, err)
			}
			if got.changing != tc.wantChanging || got.enable != tc.wantEnable {
				t.Errorf("parse(%v) = {changing:%v enable:%v}, want {changing:%v enable:%v}",
					tc.args, got.changing, got.enable, tc.wantChanging, tc.wantEnable)
			}
		})
	}
}

// Reporting must not write or announce: an operator asking what the state is
// on a live stack should not change it.
func TestApplyMaintenanceReportDoesNotAnnounce(t *testing.T) {
	r := redisfake.New(t)
	ctx := context.Background()
	flag := appconfig.NewMaintenanceFlag(eipredis.NewRedis(r.Client))
	if err := flag.Set(ctx, true); err != nil {
		t.Fatalf("set: %v", err)
	}

	announced := 0
	out, err := applyMaintenance(ctx, flag,
		func(bool) error { announced++; return nil }, maintenanceRequest{})
	if err != nil {
		t.Fatalf("apply: %v", err)
	}
	if out["maintenance_mode"] != true {
		t.Errorf("maintenance_mode = %v, want true", out["maintenance_mode"])
	}
	if announced != 0 {
		t.Errorf("a report announced %d times, want 0", announced)
	}
	if _, ok := out["changed"]; ok {
		t.Error("a report reported a change")
	}
}

// A fresh stack has no key; a report says off and leaves it that way.
func TestApplyMaintenanceReportWritesNothing(t *testing.T) {
	r := redisfake.New(t)

	out, err := applyMaintenance(context.Background(), appconfig.NewMaintenanceFlag(eipredis.NewRedis(r.Client)),
		func(bool) error { return nil }, maintenanceRequest{})
	if err != nil {
		t.Fatalf("apply: %v", err)
	}
	if out["maintenance_mode"] != false {
		t.Errorf("maintenance_mode = %v, want false on a fresh stack", out["maintenance_mode"])
	}
	if _, err := r.Server.Get(appconfig.MaintenanceKey); err == nil {
		t.Error("a report created the Redis key")
	}
}

func TestApplyMaintenanceSetsAndAnnounces(t *testing.T) {
	r := redisfake.New(t)
	ctx := context.Background()
	flag := appconfig.NewMaintenanceFlag(eipredis.NewRedis(r.Client))

	var got []bool
	out, err := applyMaintenance(ctx, flag,
		func(enabled bool) error { got = append(got, enabled); return nil },
		maintenanceRequest{changing: true, enable: true})
	if err != nil {
		t.Fatalf("apply: %v", err)
	}
	if out["maintenance_mode"] != true || out["changed"] != true || out["announced"] != true {
		t.Errorf("out = %v, want maintenance_mode/changed/announced all true", out)
	}
	if len(got) != 1 || !got[0] {
		t.Errorf("announced %v, want one true", got)
	}
	if !flag.Enabled(ctx) {
		t.Error("the flag was not written")
	}
}

// Setting the value already held is not a change, but it is still announced,
// so a service that missed an earlier announce is corrected.
func TestApplyMaintenanceRepeatIsNotAChangeButStillAnnounces(t *testing.T) {
	r := redisfake.New(t)
	ctx := context.Background()
	flag := appconfig.NewMaintenanceFlag(eipredis.NewRedis(r.Client))
	if err := flag.Set(ctx, true); err != nil {
		t.Fatalf("set: %v", err)
	}

	announced := 0
	out, err := applyMaintenance(ctx, flag,
		func(bool) error { announced++; return nil },
		maintenanceRequest{changing: true, enable: true})
	if err != nil {
		t.Fatalf("apply: %v", err)
	}
	if out["changed"] != false {
		t.Errorf("changed = %v, want false", out["changed"])
	}
	if announced != 1 {
		t.Errorf("announced %d times, want 1", announced)
	}
}

// The write is what matters; a failed announce is reported so the operator
// knows to expect the slower ask-based pickup rather than an instant reaction.
func TestApplyMaintenanceReportsAFailedAnnounce(t *testing.T) {
	r := redisfake.New(t)
	ctx := context.Background()
	flag := appconfig.NewMaintenanceFlag(eipredis.NewRedis(r.Client))

	out, err := applyMaintenance(ctx, flag,
		func(bool) error { return errors.New("nats is down") },
		maintenanceRequest{changing: true, enable: true})
	if err != nil {
		t.Fatalf("apply returned an error for a failed announce: %v", err)
	}
	if out["announced"] != false {
		t.Errorf("announced = %v, want false", out["announced"])
	}
	if out["announce_error"] != "nats is down" {
		t.Errorf("announce_error = %v", out["announce_error"])
	}
	if !flag.Enabled(ctx) {
		t.Error("the flag was not written, but the announce is the only thing that failed")
	}
}

// A report reads Redis, not anything the command process holds.
func TestApplyMaintenanceReportsTheLiveValue(t *testing.T) {
	r := redisfake.New(t)
	ctx := context.Background()
	if err := appconfig.NewMaintenanceFlag(eipredis.NewRedis(r.Client)).Set(ctx, true); err != nil {
		t.Fatalf("set: %v", err)
	}

	out, err := applyMaintenance(ctx, appconfig.NewMaintenanceFlag(eipredis.NewRedis(r.Client)),
		func(bool) error { return nil }, maintenanceRequest{})
	if err != nil {
		t.Fatalf("apply: %v", err)
	}
	if out["maintenance_mode"] != true {
		t.Errorf("maintenance_mode = %v, want the live value", out["maintenance_mode"])
	}
}
