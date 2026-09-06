package maintenance

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"
	eipmongo "eve-industry-planner/shared/mongo"
	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/worker/taskrun"

	"go.mongodb.org/mongo-driver/v2/bson"
	mongodriver "go.mongodb.org/mongo-driver/v2/mongo"
)

const defaultInactivePlannerStaleYears = 2

// InactiveAccountPlannerCleanup removes what an inactive account left behind: its
// jobs, groups, planner, planner settings and membership rows, when the users
// document still indicates last login older than the stale-age threshold
// (re-checked here).
//
// The account itself stays. Everything removed here is rebuilt on the next login
// — EnsureAccountPlanner writes the planner, its membership and its settings, and
// the grants task rebuilds the entity memberships from the account's own tokens —
// so this frees the space an inactive account occupies rather than closing it.
func InactiveAccountPlannerCleanup(ctx context.Context, payload eipnats.InactiveAccountPlannerCleanupRequest, deps *taskrun.Dependencies) error {
	if deps == nil || deps.Mongo == nil {
		return fmt.Errorf("mongo client is required")
	}
	accountID := strings.TrimSpace(payload.AccountID)
	if accountID == "" {
		return fmt.Errorf("account_id is required")
	}
	years := payload.StaleAgeYears
	if years <= 0 {
		years = defaultInactivePlannerStaleYears
	}
	cutoff := time.Now().UTC().AddDate(-years, 0, 0)

	mongo := deps.Mongo
	usersCol := mongo.Users.Collection()

	var userDoc models.UserAccountDocument
	err := usersCol.FindOne(ctx, bson.M{"_id": accountID}).Decode(&userDoc)
	if errors.Is(err, mongodriver.ErrNoDocuments) {
		logs.InfoCtx(ctx, "inactive account planner cleanup: user missing; skipping",
			"account_id", accountID)
		return nil
	}
	if err != nil {
		return fmt.Errorf("load user %s: %w", accountID, err)
	}
	if userDoc.MetaData.DeletedAt != nil {
		logs.InfoCtx(ctx, "inactive account planner cleanup: user deleted; skipping",
			"account_id", accountID)
		return nil
	}
	ll := userDoc.MetaData.LastLoginAt
	if !ll.IsZero() && !ll.Before(cutoff) {
		logs.InfoCtx(ctx, "inactive account planner cleanup: login within threshold; skipping delete",
			"account_id", accountID,
			"last_login_at", ll.Format(time.RFC3339),
			"cutoff_utc", cutoff.Format(time.RFC3339))
		return nil
	}

	owner := models.AccountOwner(accountID)
	if owner.IsZero() {
		return fmt.Errorf("account id %q yields no owner", accountID)
	}

	// What an account leaves behind, and how each collection is addressed. Owned
	// documents carry the owner in `_meta`; the planner and its settings are keyed
	// by the owner key itself, and a membership row by the planner and account
	// together — so the shape of the filter follows the collection rather than
	// being one rule applied four times.
	//
	// The account's own row and settings are deliberately absent: this frees the
	// space an inactive account's work occupies without deleting the account, so
	// someone returning after the window finds an empty planner rather than a
	// missing login.
	targets := []struct {
		label  string
		docs   *eipmongo.Docs
		filter bson.M
	}{
		{"job_documents", mongo.JobDocuments, bson.M{eipmongo.FieldMetaOwnerID: accountID}},
		{"jobs", mongo.Jobs, bson.M{eipmongo.FieldMetaOwnerID: accountID}},
		{"job_groups", mongo.Groups, bson.M{eipmongo.FieldMetaOwnerID: accountID}},
		// The memberships EVE was keeping current for this account. They grant
		// nothing while nobody is logged in, and the grants task rebuilds them from
		// the account's own tokens the moment somebody is — so removing them frees
		// rows rather than access.
		{"planner_memberships", mongo.PlannerMemberships, bson.M{
			"accountID": accountID,
			"$or": []bson.M{
				{"joinMethod.entityMember": bson.M{"$exists": true}},
				{"joinMethod.accessList": bson.M{"$exists": true}},
			},
		}},
		// The account's own planner, its membership of it, and its settings.
		// EnsureAccountPlanner writes all three back on the next login.
		{"planner_memberships (own)", mongo.PlannerMemberships,
			bson.M{"_id": planner.MembershipID(owner.Key(), accountID)}},
		{"planner_settings", mongo.PlannerSettings, bson.M{"_id": owner.Key()}},
		{"planners", mongo.Planners, bson.M{"_id": owner.Key()}},
	}

	deletedBy := make(map[string]int64, len(targets))
	for _, target := range targets {
		if target.docs == nil {
			continue
		}
		var deleted int64
		err = eipmongo.Retry(ctx, fmt.Sprintf("inactive planner cleanup %s %s", target.label, accountID), func() error {
			res, derr := target.docs.Collection().DeleteMany(ctx, target.filter)
			if derr != nil {
				return derr
			}
			deleted = res.DeletedCount
			return nil
		})
		if err != nil {
			return fmt.Errorf("delete %s for %s: %w", target.label, accountID, err)
		}
		deletedBy[target.label] += deleted
	}

	lastLoginLog := ""
	if !ll.IsZero() {
		lastLoginLog = ll.UTC().Format(time.RFC3339)
	}
	logs.InfoCtx(ctx, "inactive account planner cleanup complete",
		"account_id", accountID,
		"deleted_job_documents", deletedBy["job_documents"],
		"deleted_jobs", deletedBy["jobs"],
		"deleted_job_groups", deletedBy["job_groups"],
		"deleted_planner_memberships", deletedBy["planner_memberships"]+deletedBy["planner_memberships (own)"],
		"deleted_planner_settings", deletedBy["planner_settings"],
		"deleted_planners", deletedBy["planners"],
		"last_login_at", lastLoginLog,
		"cutoff_utc", cutoff.Format(time.RFC3339),
	)
	return nil
}
