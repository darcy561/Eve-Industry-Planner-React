package modelparity

import (
	"context"
	"fmt"
	"io"
	"reflect"

	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"
	modelparitykeys "eve-industry-planner/testing/fixtures/model-parity"
)

// Phase selects which half of the sweep to run.
type Phase string

const (
	PhaseAll    Phase = "all"    // census, then corpus
	PhaseCensus Phase = "census" // decode / round-trip / orphan census only
	PhaseCorpus Phase = "corpus" // write the SPA parity corpus only
)

// ParsePhase resolves the -phase flag.
func ParsePhase(value string) (Phase, error) {
	switch Phase(value) {
	case PhaseAll, PhaseCensus, PhaseCorpus:
		return Phase(value), nil
	default:
		return "", fmt.Errorf("modelparity: unknown phase %q (all|census|corpus)", value)
	}
}

// Config is CLI-facing sweep options.
type Config struct {
	Phase Phase
	// CorpusPath is where the job corpus is written. It holds real account data:
	// keep it under .tmp, which is not tracked.
	CorpusPath string
}

// Run sweeps every collection a model owns and reports what it found.
//
// It returns an error only when the sweep could not be carried out. A model that
// rejected or altered a document is reported through ok, so a caller can print
// the whole census before deciding what to do about it.
func Run(ctx context.Context, mongo *eipmongo.Mongo, w io.Writer, cfg Config) (ok bool, err error) {
	if mongo == nil {
		return false, fmt.Errorf("modelparity: a mongo handle is required")
	}
	// Checked before any collection is read: a census built without the instance
	// key shapes still prints, and would quietly count one row per stored key.
	if _, err := modelparitykeys.Matcher(); err != nil {
		return false, err
	}
	ok = true

	if cfg.Phase == PhaseAll || cfg.Phase == PhaseCensus {
		type sweep struct {
			name string
			run  func(context.Context) (Census, error)
		}
		sweeps := []sweep{
			{eipmongo.CollectionJobDocuments, func(c context.Context) (Census, error) {
				return Sweep[models.Job](c, mongo.JobDocuments.Collection(), eipmongo.CollectionJobDocuments)
			}},
			{eipmongo.CollectionArchivedJobs, func(c context.Context) (Census, error) {
				return Sweep[models.Job](c, mongo.ArchivedJobs.Collection(), eipmongo.CollectionArchivedJobs)
			}},
			{eipmongo.CollectionJobGroups, func(c context.Context) (Census, error) {
				return Sweep[models.Group](c, mongo.Groups.Collection(), eipmongo.CollectionJobGroups)
			}},
			{eipmongo.CollectionAccounts, func(c context.Context) (Census, error) {
				return Sweep[models.UserAccountDocument](c, mongo.Users.Collection(), eipmongo.CollectionAccounts)
			}},
			{eipmongo.CollectionAccountSettings, func(c context.Context) (Census, error) {
				return Sweep[models.ApplicationSettings](c, mongo.ApplicationSettings.Collection(), eipmongo.CollectionAccountSettings)
			}},
		}
		for _, s := range sweeps {
			census, sweepErr := s.run(ctx)
			if sweepErr != nil {
				return false, sweepErr
			}
			Report(w, census)
			if !census.Clean() {
				ok = false
			}
		}
	}

	if cfg.Phase == PhaseAll || cfg.Phase == PhaseCorpus {
		written, corpusErr := Corpus[models.Job](ctx, mongo.JobDocuments.Collection(), cfg.CorpusPath)
		if corpusErr != nil {
			return false, corpusErr
		}
		schemaPath := SchemaPathFor(cfg.CorpusPath)
		if schemaErr := WriteSchema(reflect.TypeFor[models.Job](), schemaPath); schemaErr != nil {
			return false, schemaErr
		}
		fmt.Fprintf(w, "\ncorpus: %d job documents written to %s\n", written, cfg.CorpusPath)
		fmt.Fprintf(w, "schema: models.Job JSON paths written to %s\n", schemaPath)
	}
	return ok, nil
}
