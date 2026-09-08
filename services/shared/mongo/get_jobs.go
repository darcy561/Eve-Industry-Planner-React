package mongo

import (
	"context"
	"fmt"

	"eve-industry-planner/shared/models"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// LoadJobByID loads one job from a planner (mongo.JobDocuments).
func (d *Docs) LoadJobByID(ctx context.Context, owner models.Owner, jobID string) (models.Job, error) {
	coll, err := d.requireColl()
	if err != nil || owner.IsZero() || jobID == "" {
		return models.Job{}, fmt.Errorf("LoadJobByID: invalid arguments")
	}
	filter := bson.M{FieldMetaOwnerKind: owner.Kind, FieldMetaOwnerID: owner.ID, "_id": jobID}
	var doc models.Job
	if err := Retry(ctx, "LoadJobByID", func() error {
		return coll.FindOne(ctx, filter).Decode(&doc)
	}); err != nil {
		return models.Job{}, err
	}
	return doc, nil
}

// LoadJobsByFilter finds jobs in one planner matching filter, sorted by
// _meta.lastModified desc.
//
// The owner is applied here rather than trusted from the caller's filter, so a
// filter that names none cannot read across planners. Both halves are set: an id
// without a kind would match a planner of another kind carrying the same id.
func (d *Docs) LoadJobsByFilter(ctx context.Context, owner models.Owner, filter bson.M) ([]models.Job, error) {
	coll, err := d.requireColl()
	if err != nil || owner.IsZero() || filter == nil {
		return nil, fmt.Errorf("LoadJobsByFilter: invalid arguments")
	}
	scoped := mergeFilters(filter, bson.M{FieldMetaOwnerKind: owner.Kind, FieldMetaOwnerID: owner.ID})
	var cursor *mongo.Cursor
	if err := Retry(ctx, "LoadJobsByFilter", func() error {
		var findErr error
		cursor, findErr = coll.Find(ctx, scoped, options.Find().SetSort(bson.M{"_meta.lastModified": -1}))
		return findErr
	}); err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var jobs []models.Job
	if err := cursor.All(ctx, &jobs); err != nil {
		return nil, err
	}
	return jobs, nil
}
