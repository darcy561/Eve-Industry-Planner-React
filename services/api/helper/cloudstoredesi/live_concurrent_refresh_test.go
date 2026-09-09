package cloudstoredesi_test

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	cloudstoredesi "eve-industry-planner/api/helper/cloudstoredesi"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/testing/cloudaccount"

	"go.mongodb.org/mongo-driver/v2/bson"
)

const concurrentTestAccountID = "scratch-cloud-esi-concurrency"

func refreshFor(ctx context.Context, a *cloudaccount.Account, hash string) error {
	_, err := cloudstoredesi.RefreshStoredEsiForCharacter(ctx, a.Mongo, a.ID, hash, &a.Cfg, nil)
	return err
}

// Two characters on one account refreshing at the same time must both keep their rotated material.
// The refresh used to read the whole refreshTokens array and write it back, so each call persisted
// its own rotation over a snapshot taken before the other's — and the loser's refresh token was gone
// for good, because EVE SSO retires one once it has been used.
func TestConcurrentRefreshesKeepBothRotatedTokens(t *testing.T) {
	a := cloudaccount.Require(t, concurrentTestAccountID,
		cloudaccount.Encrypted("hash-a"), cloudaccount.Encrypted("hash-b"))

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Released together, so the reads overlap the way real concurrent acquisitions do.
	var start sync.WaitGroup
	start.Add(1)
	var done sync.WaitGroup
	errs := make([]error, 2)
	for i, hash := range []string{"hash-a", "hash-b"} {
		done.Go(func() {
			start.Wait()
			errs[i] = refreshFor(ctx, a, hash)
		})
	}
	start.Done()
	done.Wait()

	for i, err := range errs {
		if err != nil {
			t.Fatalf("concurrent refresh %d failed: %v", i, err)
		}
	}

	for _, hash := range []string{"hash-a", "hash-b"} {
		if got := a.Material(t, hash); got == "secret-for-"+hash {
			t.Errorf("%s still holds its pre-refresh secret — its rotation was overwritten by the "+
				"other character's write, and EVE SSO has already retired it", hash)
		}
	}
}

// The same two refreshes, one after the other. This must keep passing, so a fix cannot be a
// serialising lock mistaken for a correct write.
func TestSequentialRefreshesKeepBothRotatedTokens(t *testing.T) {
	a := cloudaccount.Require(t, concurrentTestAccountID,
		cloudaccount.Encrypted("hash-a"), cloudaccount.Encrypted("hash-b"))

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	for _, hash := range []string{"hash-a", "hash-b"} {
		if err := refreshFor(ctx, a, hash); err != nil {
			t.Fatalf("refresh %s: %v", hash, err)
		}
	}

	for _, hash := range []string{"hash-a", "hash-b"} {
		if got := a.Material(t, hash); got == "secret-for-"+hash {
			t.Errorf("%s still holds its pre-refresh secret", hash)
		}
	}
}

// A row the account does not hold cannot be written, and silence there would lose material the
// caller has already spent at EVE SSO.
func TestRefreshForAnUnlinkedCharacterFails(t *testing.T) {
	a := cloudaccount.Require(t, concurrentTestAccountID, cloudaccount.Encrypted("hash-a"))

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := refreshFor(ctx, a, "not-linked"); err == nil {
		t.Fatal("refreshing a character with no stored row reported success")
	}

	var doc models.UserAccountDocument
	if err := a.Users.Collection().
		FindOne(ctx, bson.M{"_id": a.ID}).Decode(&doc); err != nil {
		t.Fatalf("read back: %v", err)
	}
	if len(doc.RefreshTokens) != 1 {
		t.Errorf("rows = %d, want the account left as it was", len(doc.RefreshTokens))
	}
}

// The plural path reads the document once and writes the rotations once, and reports per character
// so one dead credential does not deny the rest of the account its tokens.
func TestRefreshingSeveralCharactersAtOnce(t *testing.T) {
	a := cloudaccount.Require(t, concurrentTestAccountID,
		cloudaccount.Encrypted("hash-a"), cloudaccount.Encrypted("hash-b"))

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	results, err := cloudstoredesi.RefreshStoredEsiForCharacters(
		ctx, a.Mongo, a.ID, []string{"hash-a", "hash-b"}, &a.Cfg, nil)
	if err != nil {
		t.Fatalf("batch refresh: %v", err)
	}
	if len(results) != 2 {
		t.Fatalf("results = %d, want one per character asked for", len(results))
	}
	for _, result := range results {
		if result.Err != nil {
			t.Fatalf("%s: %v", result.CharacterHash, result.Err)
		}
		if result.Token.AccessToken == "" {
			t.Fatalf("%s got no access token", result.CharacterHash)
		}
	}
	for _, hash := range []string{"hash-a", "hash-b"} {
		if got := a.Material(t, hash); got == "secret-for-"+hash {
			t.Errorf("%s kept its pre-refresh secret, so its rotation was not persisted", hash)
		}
	}
}

// A character the account does not hold is reported against that character rather than failing
// every other character in the same request.
func TestAnUnlinkedCharacterDoesNotFailTheBatch(t *testing.T) {
	a := cloudaccount.Require(t, concurrentTestAccountID, cloudaccount.Encrypted("hash-a"))

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	results, err := cloudstoredesi.RefreshStoredEsiForCharacters(
		ctx, a.Mongo, a.ID, []string{"hash-a", "not-linked"}, &a.Cfg, nil)
	if err != nil {
		t.Fatalf("batch refresh: %v", err)
	}

	byHash := map[string]cloudstoredesi.Result{}
	for _, result := range results {
		byHash[result.CharacterHash] = result
	}
	if got := byHash["hash-a"]; got.Err != nil || got.Token == nil {
		t.Errorf("the linked character was denied a token: %+v", got)
	}
	if got := byHash["not-linked"]; !errors.Is(got.Err, cloudstoredesi.ErrNoRow) {
		t.Errorf("unlinked character error = %v, want ErrNoRow", got.Err)
	}
}

// Asking for nothing in particular refreshes the whole account, which is what login does.
func TestAnEmptyRequestRefreshesEveryCharacter(t *testing.T) {
	a := cloudaccount.Require(t, concurrentTestAccountID,
		cloudaccount.Encrypted("hash-a"), cloudaccount.Encrypted("hash-b"))

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	results, err := cloudstoredesi.RefreshStoredEsiForCharacters(ctx, a.Mongo, a.ID, nil, &a.Cfg, nil)
	if err != nil {
		t.Fatalf("batch refresh: %v", err)
	}
	if len(results) != 2 {
		t.Fatalf("results = %d, want every stored character", len(results))
	}
}

// A hash asked for twice is exchanged once. A second exchange would spend the refresh token the
// first just rotated, and EVE SSO retires one on use.
func TestADuplicatedCharacterIsRefreshedOnce(t *testing.T) {
	a := cloudaccount.Require(t, concurrentTestAccountID, cloudaccount.Encrypted("hash-a"))

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	before := a.SSO.Exchanges("refresh_token")
	results, err := cloudstoredesi.RefreshStoredEsiForCharacters(
		ctx, a.Mongo, a.ID, []string{"hash-a", "hash-a", "HASH-A"}, &a.Cfg, nil)
	if err != nil {
		t.Fatalf("batch refresh: %v", err)
	}

	if len(results) != 1 {
		t.Errorf("results = %d, want one per distinct character", len(results))
	}
	if spent := a.SSO.Exchanges("refresh_token") - before; spent != 1 {
		t.Errorf("token exchanges = %d, want 1", spent)
	}
}
