package mongo

import (
	"context"
	"fmt"
	"time"

	"eve-industry-planner/shared/models"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// UpsertUserAccount writes users with _meta-preserving upsert (mongo.Users).
// If clientID is set and the first write fails, retries once with empty _meta.clientID.
func (d *Docs) UpsertUserAccount(ctx context.Context, accountID string, doc models.UserAccountDocument) (*mongo.UpdateResult, bool, error) {
	if _, err := d.requireColl(); err != nil || accountID == "" {
		return nil, false, fmt.Errorf("UpsertUserAccount: invalid arguments")
	}
	doUpsert := func(ud models.UserAccountDocument) (*mongo.UpdateResult, error) {
		return d.UpsertStructPreservingMetaRetry(ctx, ud, accountID)
	}
	return upsertWithWSClientIDRetry(
		doc,
		doUpsert,
		func(ud *models.UserAccountDocument) bool {
			if ud.MetaData.ClientID == "" {
				return false
			}
			ud.MetaData.ClientID = ""
			return true
		},
	)
}

// refreshTokenRowFields is the $set / $unset for one refreshTokens element, written under the
// positional operator.
//
// Only what the row actually carries is written. A row that reached the caller carrying no
// ciphertext — a legacy plaintext row, or one whose decrypt failed and is being written back with
// nothing but a bumped failure count — must not have its material blanked by a write that was only
// meant to record the failure.
func refreshTokenRowFields(row models.RefreshToken) (bson.M, bson.M) {
	set := bson.M{}
	unset := bson.M{}

	if row.RTokenCiphertext != "" {
		set["refreshTokens.$.rTokenCiphertext"] = row.RTokenCiphertext
		set["refreshTokens.$.rTokenNonce"] = row.RTokenNonce
		set["refreshTokens.$.rTokenKeyVersion"] = row.RTokenKeyVersion
		set["refreshTokens.$.tokenFormatVersion"] = row.TokenFormatVersion
		// The row is encrypted at rest, so any legacy plaintext left beside it goes.
		unset["refreshTokens.$.rToken"] = ""
	} else if row.RToken != "" {
		set["refreshTokens.$.rToken"] = row.RToken
	}

	// omitempty drops a zero from a whole-document write, so unset rather than set keeps the stored
	// shape identical to what the array write produced.
	if row.CloudMaintRefreshFailures > 0 {
		set["refreshTokens.$.cloudMaintRefreshFailures"] = row.CloudMaintRefreshFailures
	} else {
		unset["refreshTokens.$.cloudMaintRefreshFailures"] = ""
	}

	return set, unset
}

// PatchUserRefreshTokenRows writes each given refreshTokens element in place, matched by its
// CharacterHash, in one bulk write.
//
// Rewriting the whole array from a document read earlier loses a concurrent write to a different
// character: both writers read the array, both write it back, and the second overwrites the first's
// rotated material with the copy it read before that rotation happened. EVE SSO retires a refresh
// token once it has been used, so an overwritten row is a dead credential. Every writer of this
// array goes through here, or through PushUserRefreshTokenRow / PullUserRefreshTokenRows, so no
// writer carries a stale copy of anyone else's row.
//
// A row that matches nothing is an error rather than a silent no-op: a caller that has just spent
// the old refresh token at EVE SSO loses it just as surely by failing to store the replacement.
func (d *Docs) PatchUserRefreshTokenRows(ctx context.Context, accountID string, rows []models.RefreshToken, opts ...RetryOption) error {
	coll, err := d.requireColl()
	if err != nil || accountID == "" {
		return fmt.Errorf("PatchUserRefreshTokenRows: collection and accountID are required")
	}
	if len(rows) == 0 {
		return nil
	}

	writes := make([]mongo.WriteModel, 0, len(rows)+1)
	for _, row := range rows {
		if row.CharacterHash == "" {
			return fmt.Errorf("PatchUserRefreshTokenRows: CharacterHash is required on every row")
		}
		set, unset := refreshTokenRowFields(row)
		update := bson.M{}
		if len(set) > 0 {
			update["$set"] = set
		}
		if len(unset) > 0 {
			update["$unset"] = unset
		}
		if len(update) == 0 {
			continue
		}
		writes = append(writes, mongo.NewUpdateOneModel().
			SetFilter(userRefreshTokenRowFilter(accountID, row.CharacterHash)).
			SetUpdate(update))
	}
	if len(writes) == 0 {
		return nil
	}
	rowWrites := int64(len(writes))
	writes = append(writes, mongo.NewUpdateOneModel().
		SetFilter(userAccountFilter(accountID)).
		SetUpdate(bson.M{"$set": bson.M{"_meta.lastModified": time.Now().UTC()}}))

	opName := applyRetryOptions("PatchUserRefreshTokenRows", opts)
	return Retry(ctx, opName, func() error {
		res, err := coll.BulkWrite(ctx, writes, options.BulkWrite().SetOrdered(false))
		if err != nil {
			return err
		}
		if want := rowWrites + 1; res.MatchedCount < want {
			return fmt.Errorf("PatchUserRefreshTokenRows: %d of %d writes matched no row for account %s",
				want-res.MatchedCount, rowWrites, accountID)
		}
		return nil
	})
}

// PatchUserRefreshTokenRow writes one element of refreshTokens in place. See
// PatchUserRefreshTokenRows for why the array is never replaced wholesale.
func (d *Docs) PatchUserRefreshTokenRow(ctx context.Context, accountID string, row models.RefreshToken, opts ...RetryOption) error {
	return d.PatchUserRefreshTokenRows(ctx, accountID, []models.RefreshToken{row}, opts...)
}

// PushUserRefreshTokenRow adds a refreshTokens element, or replaces the existing one for that
// character. Linking a character is the only write that grows the array.
func (d *Docs) PushUserRefreshTokenRow(ctx context.Context, accountID string, row models.RefreshToken, opts ...RetryOption) error {
	coll, err := d.requireColl()
	if err != nil || accountID == "" || row.CharacterHash == "" {
		return fmt.Errorf("PushUserRefreshTokenRow: collection, accountID and CharacterHash are required")
	}
	opName := applyRetryOptions("PushUserRefreshTokenRow", opts)
	return Retry(ctx, opName, func() error {
		// Ordered, because exactly one of these may match: replace the row if it is there, add it
		// if the first write found nothing.
		_, err := coll.BulkWrite(ctx, []mongo.WriteModel{
			mongo.NewUpdateOneModel().
				SetFilter(userRefreshTokenRowFilter(accountID, row.CharacterHash)).
				SetUpdate(bson.M{"$set": bson.M{
					"refreshTokens.$":    row,
					"_meta.lastModified": time.Now().UTC(),
				}}),
			mongo.NewUpdateOneModel().
				SetFilter(bson.M{
					FieldMetaOwnerKind:            models.OwnerAccount,
					FieldMetaOwnerID:              accountID,
					"_id":                         accountID,
					"refreshTokens.CharacterHash": bson.M{"$ne": row.CharacterHash},
				}).
				SetUpdate(bson.M{
					"$push": bson.M{"refreshTokens": row},
					"$set":  bson.M{"_meta.lastModified": time.Now().UTC()},
				}),
		}, options.BulkWrite().SetOrdered(true))
		return err
	})
}

// PullUserRefreshTokenRows removes the refreshTokens elements for the given character hashes.
// Hashes must be spelled as they are stored; a caller matching case-insensitively resolves them
// against the document first.
func (d *Docs) PullUserRefreshTokenRows(ctx context.Context, accountID string, characterHashes []string, opts ...RetryOption) error {
	coll, err := d.requireColl()
	if err != nil || accountID == "" {
		return fmt.Errorf("PullUserRefreshTokenRows: collection and accountID are required")
	}
	if len(characterHashes) == 0 {
		return nil
	}
	opName := applyRetryOptions("PullUserRefreshTokenRows", opts)
	return Retry(ctx, opName, func() error {
		_, err := coll.UpdateOne(ctx, userAccountFilter(accountID), bson.M{
			"$pull": bson.M{"refreshTokens": bson.M{"CharacterHash": bson.M{"$in": characterHashes}}},
			"$set":  bson.M{"_meta.lastModified": time.Now().UTC()},
		})
		return err
	})
}

func userAccountFilter(accountID string) bson.M {
	return bson.M{FieldMetaOwnerKind: models.OwnerAccount, FieldMetaOwnerID: accountID, "_id": accountID}
}

func userRefreshTokenRowFilter(accountID, characterHash string) bson.M {
	f := userAccountFilter(accountID)
	f["refreshTokens.CharacterHash"] = characterHash
	return f
}
