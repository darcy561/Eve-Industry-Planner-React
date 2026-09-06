package mongo

import (
	"context"
	"fmt"

	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// PlannerListing is one planner an account may work in.
//
// Named reports whether a planner document exists for this owner. A membership
// row is the whole of what grants access, so an account routinely reaches a
// planner nothing has named yet — a corporation it joined, whose document is
// written when somebody first works in it. The listing says so rather than
// inventing a name, and the client shows what it knows about the entity.
type PlannerListing struct {
	Owner       models.Owner
	Name        string
	MemberCount int
	Named       bool
	JoinKind    planner.JoinKind
}

// PlannersForAccount lists every planner the account holds a membership for.
//
// Two reads rather than a join: the membership rows say which planners, and the
// planner documents say what the named ones are called. Most accounts hold a
// handful of rows, and the second read asks for exactly those ids.
func (m *Mongo) PlannersForAccount(ctx context.Context, accountID string) ([]PlannerListing, error) {
	if m == nil || accountID == "" {
		return nil, fmt.Errorf("PlannersForAccount: invalid arguments")
	}

	cursor, err := m.PlannerMemberships.Collection().
		Find(ctx, bson.M{"accountID": accountID})
	if err != nil {
		return nil, fmt.Errorf("list memberships for %s: %w", accountID, err)
	}
	var rows []planner.Membership
	if err := cursor.All(ctx, &rows); err != nil {
		return nil, fmt.Errorf("read memberships for %s: %w", accountID, err)
	}
	if len(rows) == 0 {
		return nil, nil
	}

	listings := make([]PlannerListing, 0, len(rows))
	ids := make([]string, 0, len(rows))
	for _, row := range rows {
		// A row naming a planner id nothing can parse addresses no owner, so it
		// is dropped rather than listed — the same rule OwnerKeysForAccount uses.
		owner, err := models.ParseOwnerKey(row.PlannerID)
		if err != nil {
			continue
		}
		listings = append(listings, PlannerListing{
			Owner:    owner,
			JoinKind: row.JoinMethod.Kind(),
		})
		ids = append(ids, row.PlannerID)
	}
	if len(listings) == 0 {
		return nil, nil
	}

	named, err := m.plannersByID(ctx, ids)
	if err != nil {
		return nil, err
	}
	for i := range listings {
		doc, found := named[listings[i].Owner.Key()]
		if !found {
			continue
		}
		listings[i].Name = doc.Name
		listings[i].MemberCount = doc.MemberCount
		listings[i].Named = true
	}
	return listings, nil
}

func (m *Mongo) plannersByID(ctx context.Context, ids []string) (map[string]planner.Planner, error) {
	cursor, err := m.Planners.Collection().Find(ctx, bson.M{"_id": bson.M{"$in": ids}})
	if err != nil {
		return nil, fmt.Errorf("read planners: %w", err)
	}
	var docs []planner.Planner
	if err := cursor.All(ctx, &docs); err != nil {
		return nil, fmt.Errorf("decode planners: %w", err)
	}
	byID := make(map[string]planner.Planner, len(docs))
	for _, doc := range docs {
		byID[doc.ID] = doc
	}
	return byID, nil
}
