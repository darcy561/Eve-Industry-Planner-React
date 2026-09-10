package docker

import (
	"strings"
	"testing"
	"testing/synctest"

	swarmtypes "github.com/moby/moby/api/types/swarm"

	"eve-industry-planner/deployment-tool/internal/docker/enginetest"
)

func serviceAt(id string, version uint64) swarmtypes.Service {
	return swarmtypes.Service{
		ID:      id,
		Version: swarmtypes.Version{Index: version},
		Spec: swarmtypes.ServiceSpec{
			Annotations: swarmtypes.Annotations{Name: "eip_grafana"},
		},
	}
}

func TestMutateServiceRetriesPastStaleVersion(t *testing.T) {
	t.Parallel()
	synctest.Test(t, func(t *testing.T) {
		eng := enginetest.New(t)
		eng.SetServiceOK("eip_grafana", serviceAt("grafana-id", 11))
		eng.ServiceUpdateStaleVersions = map[string]int{"grafana-id": 2}

		calls := 0
		err := MutateService(t.Context(), eng.APIClient(), "eip_grafana", func(spec *swarmtypes.ServiceSpec) (bool, error) {
			calls++
			spec.Labels = map[string]string{"traefik.enable": "true"}
			return true, nil
		})
		if err != nil {
			t.Fatalf("want the write to survive a rollout in flight, got %v", err)
		}
		if calls != 3 {
			t.Fatalf("mutate ran %d times, want one per attempt (3)", calls)
		}
		if got := len(eng.ServiceUpdates); got != 3 {
			t.Fatalf("wrote %d times, want 3", got)
		}
		last, _ := eng.LastServiceUpdate()
		if last.Spec.Labels["traefik.enable"] != "true" {
			t.Fatalf("the retry lost the patch: %#v", last.Spec.Labels)
		}
	})
}

func TestMutateServiceGivesUpAfterRepeatedStaleVersions(t *testing.T) {
	t.Parallel()
	synctest.Test(t, func(t *testing.T) {
		eng := enginetest.New(t)
		eng.SetServiceOK("eip_grafana", serviceAt("grafana-id", 11))
		eng.ServiceUpdateStaleVersions = map[string]int{"grafana-id": 99}

		err := MutateService(t.Context(), eng.APIClient(), "eip_grafana", func(spec *swarmtypes.ServiceSpec) (bool, error) {
			return true, nil
		})
		if err == nil || !strings.Contains(err.Error(), "out of sequence") {
			t.Fatalf("want the engine's reason reported, got %v", err)
		}
	})
}

func TestMutateServiceSkipsWriteWhenNothingChanged(t *testing.T) {
	t.Parallel()
	eng := enginetest.New(t)
	eng.SetServiceOK("eip_grafana", serviceAt("grafana-id", 11))

	err := MutateService(t.Context(), eng.APIClient(), "eip_grafana", func(spec *swarmtypes.ServiceSpec) (bool, error) {
		return false, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := eng.LastServiceUpdate(); ok {
		t.Fatal("an unchanged spec must not be written")
	}
}

func TestMutateServiceDoesNotRetryOtherFailures(t *testing.T) {
	t.Parallel()
	eng := enginetest.New(t)
	eng.SetServiceOK("eip_grafana", serviceAt("grafana-id", 11))
	eng.ServiceUpdateStatus = 500
	eng.ServiceUpdateBody = `{"message":"daemon down"}`

	err := MutateService(t.Context(), eng.APIClient(), "eip_grafana", func(spec *swarmtypes.ServiceSpec) (bool, error) {
		return true, nil
	})
	if err == nil || !strings.Contains(err.Error(), "daemon down") {
		t.Fatalf("got %v", err)
	}
	if got := len(eng.ServiceUpdates); got != 1 {
		t.Fatalf("wrote %d times, want one attempt only", got)
	}
}

func TestMutateServiceMissingServiceIsNotFound(t *testing.T) {
	t.Parallel()
	eng := enginetest.New(t)
	eng.SetServiceMissing("eip_grafana")

	err := MutateService(t.Context(), eng.APIClient(), "eip_grafana", func(spec *swarmtypes.ServiceSpec) (bool, error) {
		return true, nil
	})
	if err == nil || !strings.Contains(err.Error(), "inspect service") {
		t.Fatalf("got %v", err)
	}
}
