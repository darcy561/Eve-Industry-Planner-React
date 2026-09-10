package docker

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/containerd/errdefs"
	swarmtypes "github.com/moby/moby/api/types/swarm"
	"github.com/moby/moby/client"
)

// ForceUpdateService triggers a rolling restart of a Swarm service (same image/spec).
// Equivalent to `docker service update --force` via Moby ServiceUpdate.
func ForceUpdateService(ctx context.Context, apiClient *client.Client, nameOrID string) error {
	if nameOrID == "" {
		return fmt.Errorf("force update: empty service name")
	}
	return MutateService(ctx, apiClient, nameOrID, func(spec *swarmtypes.ServiceSpec) (bool, error) {
		spec.TaskTemplate.ForceUpdate++
		return true, nil
	})
}

// serviceUpdateAttempts bounds the re-reads of one service mutation.
const serviceUpdateAttempts = 5

// serviceUpdateBackoff is the pause before a re-read, doubling each attempt.
const serviceUpdateBackoff = 200 * time.Millisecond

// MutateService reads a Swarm service, applies mutate to its spec, and writes it back,
// re-reading and re-applying when the engine rejects the write as stale.
//
// A ServiceUpdate carries the version the spec was read at, and Swarm bumps that version
// as a rollout progresses — so a spec read while an earlier update is still converging is
// stale by the time it is written, and the engine answers "update out of sequence". The
// day-2 patch paths all run immediately after a stack deploy, which is exactly that
// window, so every one of them goes through here.
//
// mutate reports whether it changed the spec; false skips the write entirely. It runs
// again on each re-read, so it must decide from the spec it is handed rather than from
// anything captured earlier.
//
// Missing service → the inspect error, which satisfies errdefs.IsNotFound.
func MutateService(ctx context.Context, apiClient *client.Client, serviceName string, mutate func(spec *swarmtypes.ServiceSpec) (bool, error)) error {
	serviceName = strings.TrimSpace(serviceName)
	if serviceName == "" {
		return fmt.Errorf("mutate service: empty service name")
	}
	if apiClient == nil {
		return fmt.Errorf("mutate service %s: nil API client", serviceName)
	}

	backoff := serviceUpdateBackoff
	var updateErr error
	for attempt := range serviceUpdateAttempts {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(backoff):
			}
			backoff *= 2
		}

		result, err := apiClient.ServiceInspect(ctx, serviceName, client.ServiceInspectOptions{})
		if err != nil {
			return fmt.Errorf("inspect service %s: %w", serviceName, err)
		}
		spec := result.Service.Spec
		changed, err := mutate(&spec)
		if err != nil {
			return err
		}
		if !changed {
			return nil
		}
		_, updateErr = apiClient.ServiceUpdate(ctx, result.Service.ID, client.ServiceUpdateOptions{
			Version: result.Service.Version,
			Spec:    spec,
		})
		if updateErr == nil {
			return nil
		}
		if !isStaleVersion(updateErr) {
			return fmt.Errorf("update service %s: %w", serviceName, updateErr)
		}
	}
	return fmt.Errorf("update service %s: %w", serviceName, updateErr)
}

// isStaleVersion reports whether an update failed because the spec was read at an older
// version than the service now carries.
//
// Matched on the message because Swarm answers this one through gRPC rather than as a
// typed engine error: it arrives as `rpc error: code = Unknown desc = update out of
// sequence`, which classifies as neither conflict nor invalid argument.
func isStaleVersion(err error) bool {
	if err == nil {
		return false
	}
	if errdefs.IsConflict(err) {
		return true
	}
	return strings.Contains(err.Error(), "out of sequence")
}
