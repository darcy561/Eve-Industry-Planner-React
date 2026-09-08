package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"slices"

	"eve-industry-planner/shared/models"

	eipredis "eve-industry-planner/shared/redis"
)

// legacySessionGrants is the grant shape stored before grants became owner keys.
//
// Read from the raw record rather than from AccountSessionsRecord, whose Grants
// no longer carries these fields: a record written by the previous release
// decodes to an empty grant list, which is indistinguishable from an account
// holding no grants.
type legacySessionGrants struct {
	CorporationRefs []string `json:"corporation_refs"`
	AllianceRefs    []string `json:"alliance_refs"`
}

// SessionGrantsRepairReport counts what a repair pass saw.
type SessionGrantsRepairReport struct {
	Scanned  int
	Repaired int
	Failed   int
}

// RepairSessionGrants rewrites stored grants into owner keys.
//
// Only the grants field is rewritten. The record also holds the session map that
// keeps an account signed in, so deleting the key to force a refill would sign
// every user out.
func RepairSessionGrants(ctx context.Context, redisClient *eipredis.Redis, dryRun bool) (SessionGrantsRepairReport, error) {
	var report SessionGrantsRepairReport
	if redisClient.Driver() == nil {
		return report, eipredis.ErrNoClient
	}

	store := NewSessionStore(redisClient)
	err := store.EachAccountSessionsKey(ctx, func(accountIDs []string) error {
		for _, accountID := range accountIDs {
			report.Scanned++

			repaired, err := grantsNeedingRepair(ctx, redisClient, AccountSessionsKeyFor(accountID), accountID)
			if err != nil {
				report.Failed++
				continue
			}
			if repaired == nil {
				continue
			}
			if dryRun {
				report.Repaired++
				continue
			}
			if err := setAccountSessionGrants(ctx, redisClient, accountID, *repaired); err != nil {
				report.Failed++
				continue
			}
			report.Repaired++
		}
		return nil
	})
	if err != nil {
		return report, fmt.Errorf("scan account sessions: %w", err)
	}
	return report, nil
}

// grantsNeedingRepair returns the grants a record should hold, or nil when it
// already holds them.
func grantsNeedingRepair(ctx context.Context, redisClient *eipredis.Redis, key, accountID string) (*models.SessionGrants, error) {
	var raw map[string]json.RawMessage
	if err := redisClient.GetJSON(ctx, key, &raw); err != nil {
		return nil, err
	}

	var storedGrants struct {
		OwnerKeys []string `json:"owner_keys"`
		legacySessionGrants
	}
	if grants, ok := raw["grants"]; ok {
		if err := json.Unmarshal(grants, &storedGrants); err != nil {
			return nil, err
		}
	}

	account := models.AccountOwner(accountID)
	if account.IsZero() {
		return nil, fmt.Errorf("account id %q yields no owner", accountID)
	}

	keys := models.NewOwnerKeys().
		Add(account).
		Union(storedGrants.OwnerKeys).
		AddRefs(models.OwnerCorporation, storedGrants.CorporationRefs).
		AddRefs(models.OwnerAlliance, storedGrants.AllianceRefs)

	repaired := models.SessionGrants{OwnerKeys: keys.Normalized()}
	if slices.Equal(storedGrants.OwnerKeys, repaired.OwnerKeys) {
		return nil, nil
	}
	return &repaired, nil
}

// setAccountSessionGrants writes grants onto the record and every session under
// it, under the same compare-and-set every other grant write uses.
func setAccountSessionGrants(ctx context.Context, redisClient *eipredis.Redis, accountID string, grants models.SessionGrants) error {
	return NewSessionStore(redisClient).UpdateAccountSessions(ctx, accountID, func(rec *AccountSessionsRecord) error {
		rec.Grants = grants
		for sid, session := range rec.Sessions {
			session.Grants = grants
			rec.Sessions[sid] = session
		}
		return nil
	})
}
