package user

import (
	"context"
	"fmt"
	"time"

	cloudstoredesi "eve-industry-planner/api/helper/cloudstoredesi"
	"eve-industry-planner/shared/core/config"
	"eve-industry-planner/shared/crypto/aesgcm"
	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/models"
)

const loginSessionTimeout = 45 * time.Second

// BuildCloudLinkedCharactersForLogin refreshes each stored additional-character ESI token
// server-side, returns short-lived access sessions for the client, encrypts refresh material at rest,
// and persists the user document when ciphertext or rotated refresh tokens change.
func (h *Handlers) BuildCloudLinkedCharactersForLogin(
	ctx context.Context,
	accountID string,
	user *models.UserAccountDocument,
	clientID, clientSecret string,
	kr *aesgcm.Keyring,
) ([]models.LinkedCharacterSession, error) {
	if h.Mongo == nil || accountID == "" || user == nil || kr == nil {
		return nil, fmt.Errorf("invalid args for BuildCloudLinkedCharactersForLogin")
	}
	if clientID == "" || clientSecret == "" {
		return nil, fmt.Errorf("EVE SSO client credentials are required for cloud login sessions")
	}

	ctx, cancel := context.WithTimeout(ctx, loginSessionTimeout)
	defer cancel()

	cfg := &config.CloudStoredESI{
		SSO:  config.EveSSO{ClientID: clientID, ClientSecret: clientSecret},
		Keys: config.CloudStoredESIKeys{Keyring: kr},
	}
	results, err := cloudstoredesi.RefreshStoredEsiForCharacters(ctx, h.Mongo, accountID, nil, cfg,
		func(err error) { h.ReportSSO(ctx, err) })
	if err != nil {
		return nil, fmt.Errorf("refresh cloud-stored ESI for login: %w", err)
	}

	out := make([]models.LinkedCharacterSession, 0, len(results))
	for _, result := range results {
		if result.Err != nil {
			// One character's credential being dead is not a failed login: the rest still get theirs.
			logs.WarnCtx(ctx, "cloud login session ESI refresh failed",
				"character_hash", result.CharacterHash,
				"error", result.Err,
			)
			continue
		}
		out = append(out, models.LinkedCharacterSession{
			CharacterHash: result.CharacterHash,
			AccessToken:   result.Token.AccessToken,
			TokenType:     result.Token.TokenType,
			ExpiresIn:     result.Token.ExpiresIn,
		})
	}
	return out, nil
}

// StripRefreshTokensFromUserDocumentForClient removes refresh-token material from API responses.
func StripRefreshTokensFromUserDocumentForClient(user *models.UserAccountDocument) {
	if user == nil {
		return
	}
	user.StripRefreshTokenSecretsForTransport()
}
