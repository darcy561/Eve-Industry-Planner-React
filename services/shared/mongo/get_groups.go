package mongo

import (
	"context"
	"fmt"

	"eve-industry-planner/shared/models"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// LoadGroupsForOwner loads every group in one planner (mongo.Groups).
func (d *Docs) LoadGroupsForOwner(ctx context.Context, owner models.Owner) ([]models.Group, error) {
	coll, err := d.requireColl()
	if err != nil || owner.IsZero() {
		return nil, fmt.Errorf("LoadGroupsForOwner: invalid arguments")
	}
	// Both halves: an id alone would match a planner of another kind that happens
	// to carry the same id.
	filter := bson.M{FieldMetaOwnerKind: owner.Kind, FieldMetaOwnerID: owner.ID}
	var cursor *mongo.Cursor
	if err := Retry(ctx, "LoadGroupsForOwner", func() error {
		var findErr error
		cursor, findErr = coll.Find(ctx, filter)
		return findErr
	}); err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var groups []models.Group
	if err := cursor.All(ctx, &groups); err != nil {
		return nil, err
	}
	return groups, nil
}

// LoadGroupByID loads one group from a planner.
func (d *Docs) LoadGroupByID(ctx context.Context, owner models.Owner, groupID string) (models.Group, error) {
	coll, err := d.requireColl()
	if err != nil || owner.IsZero() || groupID == "" {
		return models.Group{}, fmt.Errorf("LoadGroupByID: invalid arguments")
	}
	filter := bson.M{"_id": OwnerScopedDocumentID(owner, groupID)}
	var group models.Group
	if err := Retry(ctx, "LoadGroupByID", func() error {
		return coll.FindOne(ctx, filter).Decode(&group)
	}); err != nil {
		return models.Group{}, err
	}
	return group, nil
}
