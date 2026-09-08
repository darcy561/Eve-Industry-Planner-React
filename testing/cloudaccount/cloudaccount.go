// Package cloudaccount seeds a cloud account holding encrypted ESI refresh material, for the live
// tests that exercise what refreshes and rewrites those rows.
//
// The setup is the same wherever those rows are touched — a signed SSO stand-in, a keyring built
// from the shared test key, and a scratch account cleaned at both ends of the run — and it is worth
// one fixture rather than a copy per package, so a change to how a row is stored is a change in one
// place.
package cloudaccount

import (
	"context"
	"testing"
	"time"

	"eve-industry-planner/shared/core/config"
	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"
	"eve-industry-planner/testing/evessofake"
	"eve-industry-planner/testing/keys"
	"eve-industry-planner/testing/mongolive"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ClientID is the EVE SSO application these fixtures pretend to be.
const ClientID = "test-eve-client-id"

const opTimeout = 30 * time.Second

// Account is a seeded cloud account and the pieces a test needs to drive it.
type Account struct {
	ID    string
	Mongo *eipmongo.Mongo
	Users *eipmongo.Docs
	Cfg   config.CloudStoredESI
	SSO   *evessofake.Server
}

// Row is one character's seeded refresh material. An empty Material seeds a row with none, which is
// what a pass that has nothing to do with a character sees.
type Row struct {
	CharacterHash string
	Material      string
	Failures      int
}

// Encrypted is a row carrying material derived from its hash, so a read-back says plainly whether
// the value changed.
func Encrypted(characterHash string) Row {
	return Row{CharacterHash: characterHash, Material: "secret-for-" + characterHash}
}

// Require seeds accountID with the given rows, or skips when live Mongo is not enabled.
//
// The account id is the caller's to choose and must be one no real account can hold: the document is
// deleted before and after the test.
func Require(t *testing.T, accountID string, rows ...Row) *Account {
	t.Helper()

	m := mongolive.Require(t)
	sso := evessofake.Start(t, ClientID)
	sso.SetCharacter(evessofake.Character{ID: "94800326", Name: "Test Pilot", Hash: "test-owner"})

	t.Setenv("EVE_CLIENT_ID", ClientID)
	t.Setenv("EVE_CLIENT_SECRET", "test-eve-client-secret")
	keys.SetRefreshTokenAES(t)

	cfg, err := config.LoadCloudStoredESI()
	if err != nil {
		t.Fatalf("load cloud-stored ESI config: %v", err)
	}

	stored := make([]models.RefreshToken, 0, len(rows))
	for _, row := range rows {
		out := models.RefreshToken{
			CharacterHash:             row.CharacterHash,
			CloudMaintRefreshFailures: row.Failures,
		}
		if row.Material != "" {
			if err := out.EncryptRefreshAtRest(row.Material, cfg.Keys.Keyring); err != nil {
				t.Fatalf("encrypt seed material for %q: %v", row.CharacterHash, err)
			}
		}
		stored = append(stored, out)
	}

	account := &Account{ID: accountID, Mongo: m, Users: m.Users, Cfg: cfg, SSO: sso}

	clear := func() {
		ctx, cancel := context.WithTimeout(context.Background(), opTimeout)
		defer cancel()
		_, _ = m.Users.Collection().DeleteMany(ctx, bson.M{"_id": accountID})
	}
	clear()
	t.Cleanup(clear)

	ctx, cancel := context.WithTimeout(context.Background(), opTimeout)
	defer cancel()
	if _, err := m.Users.Collection().InsertOne(ctx, bson.M{
		"_id":               accountID,
		"_meta":             mongolive.OwnerMeta(models.AccountOwner(accountID)),
		"userCloudAccounts": true,
		"refreshTokens":     stored,
	}); err != nil {
		t.Fatalf("seed user document: %v", err)
	}

	return account
}

// Rows reads the account's refresh rows back, keyed by character hash.
func (a *Account) Rows(t *testing.T) map[string]models.RefreshToken {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), opTimeout)
	defer cancel()

	var doc models.UserAccountDocument
	if err := a.Users.Collection().FindOne(ctx, bson.M{"_id": a.ID}).Decode(&doc); err != nil {
		t.Fatalf("read back user document: %v", err)
	}
	out := make(map[string]models.RefreshToken, len(doc.RefreshTokens))
	for _, row := range doc.RefreshTokens {
		out[row.CharacterHash] = row
	}
	return out
}

// Material decrypts what is stored for a character right now, failing the test if there is no row.
func (a *Account) Material(t *testing.T, characterHash string) string {
	t.Helper()
	row, ok := a.Rows(t)[characterHash]
	if !ok {
		t.Fatalf("no stored row for %q", characterHash)
	}
	plain, err := row.PlainRefreshMaterial(a.Cfg.Keys.Keyring)
	if err != nil {
		t.Fatalf("decrypt stored material for %q: %v", characterHash, err)
	}
	return plain
}
