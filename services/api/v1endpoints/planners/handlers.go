package planners

import (
	"eve-industry-planner/api/apideps"
)

// Handlers serves the planners an account may work in.
type Handlers struct {
	*apideps.Deps
}

func New(deps *apideps.Deps) *Handlers {
	if deps == nil {
		deps = &apideps.Deps{}
	}
	return &Handlers{Deps: deps}
}
