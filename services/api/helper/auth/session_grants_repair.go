package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"slices"
	"strings"

	rediscore "eve-industry-planner/shared/core/redis"
	"eve-industry-planner/shared/models"

	"github.com/redis/go-redis/v9"
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
func RepairSessionGrants(ctx context.Context, redisClient *redis.Client, dryRun bool) (SessionGrantsRepairReport, error) {
	var report SessionGrantsRepairReport
	if redisClient == nil {
		return report, fmt.Errorf("redis client is nil")
	}

	var cursor uint64
	for {
		keys, next, err := redisClient.Scan(ctx, cursor, AccountSessionsKeyPrefix+"*", 100).Result()
		if err != nil {
			return report, fmt.Errorf("scan account sessions: %w", err)
		}
		for _, key := range keys {
			accountID := strings.TrimSpace(strings.TrimPrefix(key, AccountSessionsKeyPrefix))
			if accountID == "" {
				continue
			}
			report.Scanned++

			repaired, err := grantsNeedingRepair(ctx, redisClient, key, accountID)
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
		if next == 0 {
			break
		}
		cursor = next
	}
	return report, nil
}

// grantsNeedingRepair returns the grants a record should hold, or nil when it
// already holds them.
func grantsNeedingRepair(ctx context.Context, redisClient *redis.Client, key, accountID string) (*models.SessionGrants, error) {
	var raw map[string]json.RawMessage
	if err := rediscore.GetJSON(ctx, redisClient, key, &raw); err != nil {
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
func setAccountSessionGrants(ctx context.Context, redisClient *redis.Client, accountID string, grants models.SessionGrants) error {
	return mutateAccountSessionsRecord(ctx, redisClient, accountID, func(rec *AccountSessionsRecord) error {
		rec.Grants = grants
		for sid, session := range rec.Sessions {
			session.Grants = grants
			rec.Sessions[sid] = session
		}
		return nil
	})
}
