package maintenance

import (
	"context"
	"strings"
	"testing"
	"time"

	"eve-industry-planner/testing/cloudaccount"
)

const maintTestAccountID = "scratch-cloud-esi-maintenance"

func runMaintenance(t *testing.T, a *cloudaccount.Account) cloudEsiMaintainStats {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	stats, err := maintainAccountCloudRefreshTokens(ctx, a.Users, a.ID, &a.Cfg)
	if err != nil {
		t.Fatalf("maintenance pass: %v", err)
	}
	return stats
}

// A row the pass has nothing to do with stays exactly as it was.
//
// That the pass does not *write* such a row cannot be seen here: it would write back what it read,
// so the document looks the same either way, and the difference only shows when another caller
// rotates that row in between. The property is pinned where it is observable —
// shared/mongo TestLiveBulkWriteLeavesUnlistedRowsAlone, which asserts a bulk write touches only
// the rows it is given.
func TestLiveMaintenanceLeavesSkippedRowsAlone(t *testing.T) {
	a := cloudaccount.Require(t, maintTestAccountID,
		cloudaccount.Encrypted("has-material"),
		cloudaccount.Row{CharacterHash: "no-material", Failures: 3})

	stats := runMaintenance(t, a)

	if stats.RowsSkipped != 1 {
		t.Errorf("RowsSkipped = %d, want 1", stats.RowsSkipped)
	}
	rows := a.Rows(t)
	skipped, ok := rows["no-material"]
	if !ok {
		t.Fatal("the skipped row was removed from the document")
	}
	if skipped.RTokenCiphertext != "" || skipped.RToken != "" {
		t.Errorf("the skipped row gained material: %+v", skipped)
	}
	if skipped.CloudMaintRefreshFailures != 3 {
		t.Errorf("failure count = %d, want 3", skipped.CloudMaintRefreshFailures)
	}
	if rows["has-material"].RTokenCiphertext == "" {
		t.Error("the row with material was not refreshed")
	}
}

// A row with no character hash cannot be addressed by a row-scoped write at all, so the pass must
// leave it out rather than fail trying.
func TestLiveMaintenanceToleratesARowWithNoCharacterHash(t *testing.T) {
	a := cloudaccount.Require(t, maintTestAccountID,
		cloudaccount.Encrypted("has-material"), cloudaccount.Row{CharacterHash: ""})

	stats := runMaintenance(t, a)

	if stats.RowsSkipped != 1 {
		t.Errorf("RowsSkipped = %d, want 1", stats.RowsSkipped)
	}
	if a.Rows(t)["has-material"].RTokenCiphertext == "" {
		t.Error("the addressable row was not refreshed")
	}
}

// A grant EVE SSO refuses outright cannot be retried into working, so its row goes.
func TestLiveMaintenanceRemovesAPermanentlyRefusedRow(t *testing.T) {
	a := cloudaccount.Require(t, maintTestAccountID,
		cloudaccount.Encrypted("refused"), cloudaccount.Encrypted("kept"))
	a.SSO.Refuse(400, `{"error":"invalid_grant","error_description":"token is not valid"}`)

	stats := runMaintenance(t, a)

	if stats.RowsRemoved != 2 {
		t.Errorf("RowsRemoved = %d, want both refused rows removed", stats.RowsRemoved)
	}
	if rows := a.Rows(t); len(rows) != 0 {
		t.Errorf("rows remaining = %v, want none — a refused grant cannot be retried", rows)
	}
}

// The regression a row-scoped write invites: the array is no longer rewritten shorter, so a row
// dropped after repeated failures has to be removed explicitly or it lingers for ever while the
// stats claim it went.
func TestLiveMaintenanceRemovesARowAfterRepeatedFailures(t *testing.T) {
	a := cloudaccount.Require(t, maintTestAccountID, cloudaccount.Encrypted("flaky"))
	a.SSO.GoDown()

	first := runMaintenance(t, a)
	if first.RowsRemoved != 0 {
		t.Fatalf("RowsRemoved = %d on the first failure, want 0 — one failure is a retry", first.RowsRemoved)
	}
	rows := a.Rows(t)
	if got := rows["flaky"].CloudMaintRefreshFailures; got != 1 {
		t.Fatalf("failure count = %d after one failure, want 1", got)
	}

	second := runMaintenance(t, a)
	if second.RowsRemoved != 1 {
		t.Errorf("RowsRemoved = %d on the second failure, want 1", second.RowsRemoved)
	}
	if _, still := a.Rows(t)["flaky"]; still {
		t.Error("the row survived a second failure — it is counted as removed but never deleted")
	}
}

// A pass that succeeds stores new material and clears the failure count it had accrued.
func TestLiveMaintenanceClearsTheFailureCountOnSuccess(t *testing.T) {
	a := cloudaccount.Require(t, maintTestAccountID, cloudaccount.Encrypted("recovers"))
	a.SSO.GoDown()
	runMaintenance(t, a)
	if got := a.Rows(t)["recovers"].CloudMaintRefreshFailures; got != 1 {
		t.Fatalf("failure count = %d, want 1 before recovery", got)
	}
	before := a.Rows(t)["recovers"].RTokenCiphertext

	a.SSO.ComeBack()
	stats := runMaintenance(t, a)

	if stats.RowsRefreshed != 1 {
		t.Errorf("RowsRefreshed = %d, want 1", stats.RowsRefreshed)
	}
	row := a.Rows(t)["recovers"]
	if row.CloudMaintRefreshFailures != 0 {
		t.Errorf("failure count = %d after success, want it cleared", row.CloudMaintRefreshFailures)
	}
	if row.RTokenCiphertext == before || row.RTokenCiphertext == "" {
		t.Error("the refreshed row did not store new material")
	}
	if plain, err := row.PlainRefreshMaterial(a.Cfg.Keys.Keyring); err != nil {
		t.Errorf("stored material does not decrypt: %v", err)
	} else if strings.TrimSpace(plain) == "" {
		t.Error("stored material decrypts to nothing")
	}
}
