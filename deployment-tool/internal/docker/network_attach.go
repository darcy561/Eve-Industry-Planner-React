package docker

import (
	"context"
	"fmt"
	"slices"
	"strings"

	"github.com/containerd/errdefs"
	swarmtypes "github.com/moby/moby/api/types/swarm"
	"github.com/moby/moby/client"
)

// FullServiceName returns stackPrefix_short (e.g. eip_prometheus).
func FullServiceName(stackPrefix, short string) string {
	stackPrefix = strings.TrimSpace(stackPrefix)
	short = strings.TrimSpace(short)
	if stackPrefix == "" {
		return short
	}
	return stackPrefix + "_" + short
}

// EnsureServiceNetwork attaches or detaches networkName on a Swarm service (ServiceUpdate),
// reporting whether the service needed changing.
// Aliases are applied only when attach is true. Matching uses network name or ID.
// Missing service → no-op (nil). Does not invent network/service names — callers resolve from stack docs.
func EnsureServiceNetwork(ctx context.Context, apiClient *client.Client, serviceName, networkName string, attach bool, aliases ...string) (bool, error) {
	serviceName = strings.TrimSpace(serviceName)
	networkName = strings.TrimSpace(networkName)
	if serviceName == "" {
		return false, fmt.Errorf("ensure service network: empty service name")
	}
	if networkName == "" {
		return false, fmt.Errorf("ensure service network: empty network name")
	}

	moved := false
	err := MutateService(ctx, apiClient, serviceName, func(spec *swarmtypes.ServiceSpec) (bool, error) {
		netID, err := networkID(ctx, apiClient, networkName)
		if err != nil {
			if attach || !errdefs.IsNotFound(err) {
				return false, err
			}
			// Detach when the network is already gone: match by name only.
			netID = ""
		}
		next, changed := desireNetworks(spec.TaskTemplate.Networks, networkName, netID, attach, aliases)
		if !changed {
			return false, nil
		}
		spec.TaskTemplate.Networks = next
		moved = true
		return true, nil
	})
	if err != nil && errdefs.IsNotFound(err) {
		return false, nil
	}
	return moved, err
}

func networkID(ctx context.Context, apiClient *client.Client, name string) (string, error) {
	res, err := apiClient.NetworkInspect(ctx, name, client.NetworkInspectOptions{})
	if err != nil {
		return "", err
	}
	return res.Network.ID, nil
}

// DesireNetworks returns the attachment list after attach/detach of name (matched by name or id).
func DesireNetworks(cur []swarmtypes.NetworkAttachmentConfig, name, id string, attach bool, aliases ...string) ([]swarmtypes.NetworkAttachmentConfig, bool) {
	return desireNetworks(cur, name, id, attach, aliases)
}

// NetworkTargetsContain reports whether targets include name and/or id (Swarm may store either).
func NetworkTargetsContain(targets []string, name, id string) bool {
	name = strings.TrimSpace(name)
	id = strings.TrimSpace(id)
	for _, t := range targets {
		if name != "" && t == name {
			return true
		}
		if id != "" && t == id {
			return true
		}
	}
	return false
}

// desireNetworks returns the new attachment list and whether it differs from cur.
func desireNetworks(cur []swarmtypes.NetworkAttachmentConfig, name, id string, attach bool, aliases []string) ([]swarmtypes.NetworkAttachmentConfig, bool) {
	idx := -1
	for i, n := range cur {
		if n.Target == name || (id != "" && n.Target == id) {
			idx = i
			break
		}
	}
	if attach {
		wantAliases := slices.Clone(aliases)
		if idx >= 0 {
			if aliasesEqual(cur[idx].Aliases, wantAliases) {
				return cur, false
			}
			out := slices.Clone(cur)
			out[idx].Aliases = wantAliases
			out[idx].Target = name
			return out, true
		}
		out := append(slices.Clone(cur), swarmtypes.NetworkAttachmentConfig{
			Target:  name,
			Aliases: wantAliases,
		})
		return out, true
	}
	// detach
	if idx < 0 {
		return cur, false
	}
	out := slices.Delete(slices.Clone(cur), idx, idx+1)
	return out, true
}

func aliasesEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
