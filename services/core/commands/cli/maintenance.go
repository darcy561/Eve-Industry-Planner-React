package cli

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"time"

	"eve-industry-planner/shared/appconfig"
	"eve-industry-planner/shared/lifecycle"
	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/shared/stackservices"
)

// maintenanceRequest is what the operator asked for; enable is read only when changing.
type maintenanceRequest struct {
	changing bool
	enable   bool
}

// parseMaintenanceArgs reads the flags. No flag means report.
func parseMaintenanceArgs(args []string) (maintenanceRequest, error) {
	fs := flag.NewFlagSet("maintenance", flag.ContinueOnError)
	fs.Usage = func() {
		fmt.Fprintf(fs.Output(), "Reports maintenance mode, or turns it on or off.\n")
		fs.PrintDefaults()
	}
	on := fs.Bool("on", false, "turn maintenance mode on")
	off := fs.Bool("off", false, "turn maintenance mode off")
	if err := fs.Parse(args); err != nil {
		return maintenanceRequest{}, err
	}
	if *on && *off {
		return maintenanceRequest{}, errors.New("maintenance: -on and -off are mutually exclusive")
	}
	return maintenanceRequest{changing: *on || *off, enable: *on}, nil
}

// maintenanceAnnouncer publishes a change.
type maintenanceAnnouncer func(bool) error

// natsAnnouncer publishes on the subject services follow.
func natsAnnouncer(n *eipnats.NATS) maintenanceAnnouncer {
	return func(enabled bool) error {
		return eipnats.PublishMaintenanceState(n, enabled)
	}
}

// applyMaintenance reads, optionally writes and announces, and returns the report.
// A failed announce after a successful write is reported, not returned.
func applyMaintenance(ctx context.Context, mode *appconfig.MaintenanceFlag, announce maintenanceAnnouncer, req maintenanceRequest) (map[string]any, error) {
	// A report must not seed or write.
	before := mode.Enabled(ctx)

	out := map[string]any{"maintenance_mode": before}
	if !req.changing {
		return out, nil
	}

	if err := mode.Set(ctx, req.enable); err != nil {
		return nil, fmt.Errorf("failed writing maintenance mode: %w", err)
	}
	out["maintenance_mode"] = req.enable
	out["changed"] = req.enable != before
	if err := announce(req.enable); err != nil {
		out["announced"] = false
		out["announce_error"] = err.Error()
		out["note"] = "the flag is set; services that missed the announce adopt it on their next ask"
		return out, nil
	}
	out["announced"] = true
	return out, nil
}

// RunMaintenance reports the maintenance flag, or sets it with -on / -off.
func RunMaintenance(ctx context.Context, args []string) error {
	req, err := parseMaintenanceArgs(args)
	if err != nil {
		return err
	}

	clients, stopDeps, err := stackservices.Connect(ctx, stackservices.Services{Redis: true, NATS: true})
	if err != nil {
		return fmt.Errorf("failed connecting to redis and nats: %w", err)
	}
	defer lifecycle.RunCleanups(5*time.Second, stopDeps)

	ctxRun, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	out, err := applyMaintenance(ctxRun, appconfig.NewMaintenanceFlag(clients.Redis), natsAnnouncer(clients.NATS), req)
	if err != nil {
		return err
	}

	b, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return fmt.Errorf("failed formatting maintenance output: %w", err)
	}
	fmt.Println(string(b))
	return nil
}
