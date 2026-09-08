package planner

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"
)

// Invite is limited authority to create one membership row, held as a Redis
// record whose TTL is its expiry.
//
// Every field serialises because the record is itself stored as JSON. What a
// client may see is [InviteSummary], never this.
type Invite struct {
	ID             string     `json:"id"`
	PlannerID      string     `json:"plannerID"`
	TokenHash      []byte     `json:"tokenHash"`
	BoundAccountID string     `json:"boundAccountID,omitempty"`
	MaxUses        int        `json:"maxUses"`
	Uses           int        `json:"uses"`
	ExpiresAt      time.Time  `json:"expiresAt"`
	RevokedAt      *time.Time `json:"revokedAt,omitempty"`
	CreatedBy      string     `json:"createdBy"`
	CreatedAt      time.Time  `json:"createdAt"`
}

// InviteTokenBytes is the token's length.
const InviteTokenBytes = 32

// MaxInviteLifetime caps how long an invite may be valid for.
const MaxInviteLifetime = 30 * 24 * time.Hour

// Why an invite was refused.
var (
	ErrInviteNotFound = errors.New("invite not found")
	ErrInviteExpired  = errors.New("invite expired")
	ErrInviteRevoked  = errors.New("invite revoked")
	ErrInviteSpent    = errors.New("invite has no uses left")
	ErrInviteBound    = errors.New("invite is bound to another account")
	ErrInviteToken    = errors.New("invite token does not match")
)

// NewInviteToken returns a token and the hash to store for it. The token is
// shown to its creator once and never stored.
func NewInviteToken() (token string, hash []byte, err error) {
	raw := make([]byte, InviteTokenBytes)
	if _, err := rand.Read(raw); err != nil {
		return "", nil, fmt.Errorf("generate invite token: %w", err)
	}
	sum := sha256.Sum256(raw)
	return base64.RawURLEncoding.EncodeToString(raw), sum[:], nil
}

// HashInviteToken derives the stored hash from a presented token.
func HashInviteToken(token string) ([]byte, error) {
	raw, err := base64.RawURLEncoding.DecodeString(strings.TrimSpace(token))
	if err != nil || len(raw) != InviteTokenBytes {
		return nil, ErrInviteToken
	}
	sum := sha256.Sum256(raw)
	return sum[:], nil
}

// TokenMatches reports whether a presented token is this invite's.
//
// Constant time: a comparison that returns early leaks how much of a guess was
// right, which is what turns an unguessable token into a guessable one.
func (i Invite) TokenMatches(presented []byte) bool {
	return subtle.ConstantTimeCompare(i.TokenHash, presented) == 1
}

// Expired reports whether the invite's lifetime has run out.
func (i Invite) Expired(now time.Time) bool {
	return !i.ExpiresAt.IsZero() && !now.Before(i.ExpiresAt)
}

// Redeemable reports why an invite cannot be redeemed by accountID, or nil.
//
// The reason is for the server to log: every one of them reaches a caller as the
// same refusal, so holding an id and guessing cannot distinguish them.
func (i Invite) Redeemable(accountID string, now time.Time) error {
	switch {
	case i.RevokedAt != nil:
		return ErrInviteRevoked
	case i.Expired(now):
		return ErrInviteExpired
	case i.MaxUses > 0 && i.Uses >= i.MaxUses:
		return ErrInviteSpent
	case i.BoundAccountID != "" && i.BoundAccountID != accountID:
		return ErrInviteBound
	}
	return nil
}

// Validate reports whether an invite is fit to store.
func (i Invite) Validate() error {
	switch {
	case strings.TrimSpace(i.ID) == "":
		return errors.New("invite has no id")
	case strings.TrimSpace(i.PlannerID) == "":
		return errors.New("invite names no planner")
	case len(i.TokenHash) != sha256.Size:
		return errors.New("invite carries no token hash")
	case strings.TrimSpace(i.CreatedBy) == "":
		return errors.New("invite names no creator")
	case i.MaxUses < 1:
		return errors.New("invite must allow at least one use")
	case i.ExpiresAt.IsZero():
		return errors.New("invite has no expiry")
	}
	return nil
}

// InviteSummary is an invite as a client may see it. The hash, the binding and
// the creator are absent by construction rather than by tag.
type InviteSummary struct {
	ID        string     `json:"id"`
	MaxUses   int        `json:"maxUses"`
	Uses      int        `json:"uses"`
	ExpiresAt time.Time  `json:"expiresAt"`
	RevokedAt *time.Time `json:"revokedAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	// Bound reports that the invite only works for one account, without naming it.
	Bound bool `json:"bound"`
}

// Summary is what this invite discloses.
func (i Invite) Summary() InviteSummary {
	return InviteSummary{
		ID:        i.ID,
		MaxUses:   i.MaxUses,
		Uses:      i.Uses,
		ExpiresAt: i.ExpiresAt,
		RevokedAt: i.RevokedAt,
		CreatedAt: i.CreatedAt,
		Bound:     i.BoundAccountID != "",
	}
}
