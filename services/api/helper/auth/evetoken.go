package auth

import (
	"context"
	"fmt"
	"strings"

	"eve-industry-planner/shared/evesso"
	"eve-industry-planner/shared/logs"
)

// Authentication error messages
const (
	ErrMsgUnauthorized     = "Unauthorized"
	ErrMsgTokenExpired     = "Token expired"
	ErrMsgTokenInvalid     = "Invalid token"
	ErrMsgAuthServiceError = "Authentication service error. Please try again later."
	ErrMsgEveTokenExpired  = "EVE token expired"
	ErrMsgEveTokenInvalid  = "Invalid EVE token"
)

// EveTokenValidationResult contains the extracted information from a validated EVE SSO token
type EveTokenValidationResult struct {
	CharacterHash string
	Scopes        []string
	CharacterName string
}

// ValidateEveTokenAndExtractHash validates an EVE SSO token and extracts relevant information.
// Returns character hash, scopes, and character name if valid, or an error if invalid.
func ValidateEveTokenAndExtractHash(ctx context.Context, tokenString, clientID string) (*EveTokenValidationResult, error) {
	claims, err := evesso.ValidateEveSSOToken(tokenString, clientID)
	if err != nil {
		return nil, err
	}

	// Extract character hash (owner field) from EVE SSO claims
	characterHash := claims.Owner
	if characterHash == "" {
		logs.WarnCtx(ctx, "failed to extract character hash (owner) from token", "subject", claims.Subject)
		return nil, fmt.Errorf("missing character hash in token")
	}

	return &EveTokenValidationResult{
		CharacterHash: characterHash,
		Scopes:        claims.Scopes,
		CharacterName: claims.Name,
	}, nil
}

// GetEveTokenErrorMessage returns a minimal error message for EVE SSO token validation failures.
// Only distinguishes between expired and invalid tokens to avoid information leakage.
func GetEveTokenErrorMessage(err error) string {
	if err == nil {
		return ErrMsgUnauthorized
	}

	errStr := strings.ToLower(err.Error())

	// Only check if expired, all other errors are generic "Invalid EVE token"
	if strings.Contains(errStr, "expired") {
		return ErrMsgEveTokenExpired
	}

	return ErrMsgEveTokenInvalid
}
