package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/models"

	"uuid"

	eipredis "eve-industry-planner/shared/redis"
)

var ErrRefreshTokenNotFound = errors.New("refresh token not found")

// CorporationIDs unmarshals JSON number arrays for refresh-token metadata; invalid shapes become empty.
type CorporationIDs []int64

func (c *CorporationIDs) UnmarshalJSON(data []byte) error {
	var ints []int64
	if err := json.Unmarshal(data, &ints); err != nil {
		*c = CorporationIDs{}
		return nil
	}
	*c = CorporationIDs(ints)
	return nil
}

// AllianceIDs unmarshals like CorporationIDs (numeric EVE alliance ids).
type AllianceIDs []int64

func (a *AllianceIDs) UnmarshalJSON(data []byte) error {
	var ints []int64
	if err := json.Unmarshal(data, &ints); err != nil {
		*a = AllianceIDs{}
		return nil
	}
	*a = AllianceIDs(ints)
	return nil
}

// RefreshTokenData is metadata bound to a planner app session refresh token in Redis (not ESI OAuth refresh material).
type RefreshTokenData struct {
	CharacterHash string         `json:"character_hash"`
	AccountID     string         `json:"account_id"`
	Scopes        []string       `json:"scopes"`
	Corporations  CorporationIDs `json:"corporations,omitempty"` // Corporation IDs the user can access
	Alliances     AllianceIDs    `json:"alliances,omitempty"`    // Alliance IDs derived from character affiliation
	SessionID     string         `json:"session_id,omitempty"`
	SessionStart  time.Time      `json:"session_start,omitzero"`
	SessionSeenAt time.Time      `json:"session_seen_at,omitzero"`
	AppVersion    string         `json:"app_version,omitempty"`
}

// SessionRecord stores a lightweight auth session timeline in Redis.
type SessionRecord struct {
	SessionID     string    `json:"session_id"`
	AccountID     string    `json:"account_id"`
	CharacterHash string    `json:"character_hash"`
	AppVersion    string    `json:"app_version,omitempty"`
	StartedAt     time.Time `json:"started_at"`
	LastSeenAt    time.Time `json:"last_seen_at"`
}

type AccountSession struct {
	SessionID        string               `json:"session_id"`
	CharacterHash    string               `json:"character_hash"`
	AppVersion       string               `json:"app_version,omitempty"`
	StartedAt        time.Time            `json:"started_at"`
	LastSeenAt       time.Time            `json:"last_seen_at"`
	ReauthRequiredAt time.Time            `json:"reauth_required_at"`
	RevokedAt        *time.Time           `json:"revoked_at,omitempty"`
	Grants           models.SessionGrants `json:"grants"`
}

type AccountSessionsRecord struct {
	AccountID     string                    `json:"account_id"`
	Grants        models.SessionGrants      `json:"grants"`
	Sessions      map[string]AccountSession `json:"sessions"`
	GrantsVersion int64                     `json:"grants_version,omitempty"`
	UpdatedAt     time.Time                 `json:"updated_at"`
}

// GenerateRefreshToken generates a secure random refresh token.
//
// The error is kept in the signature for its callers, which handle one either
// way; the standard library's UUID generation does not return one, so there is
// nothing here that can fail.
func GenerateRefreshToken() (string, error) {
	return uuid.New().String(), nil
}

// GenerateSessionID generates a session identifier.
func GenerateSessionID() (string, error) {
	return GenerateRefreshToken()
}

// StoreRefreshToken stores a refresh token in Redis with associated user data
func StoreRefreshToken(ctx context.Context, redisClient *eipredis.Redis, token string, data RefreshTokenData) error {
	if err := NewSessionStore(redisClient).PutRefreshToken(ctx, token, data); err != nil {
		return fmt.Errorf("failed to store refresh token: %w", err)
	}
	return nil
}

// UpsertSessionRecord creates/updates a session record in Redis.
func UpsertSessionRecord(ctx context.Context, redisClient *eipredis.Redis, record SessionRecord) error {
	if record.SessionID == "" {
		return errors.New("session_id is required")
	}
	if strings.TrimSpace(record.AccountID) == "" {
		return errors.New("account_id is required")
	}
	now := time.Now().UTC()
	startedAt := record.StartedAt
	if startedAt.IsZero() {
		startedAt = now
	}
	lastSeenAt := record.LastSeenAt
	if lastSeenAt.IsZero() {
		lastSeenAt = now
	}
	s := AccountSession{
		SessionID:        record.SessionID,
		CharacterHash:    record.CharacterHash,
		AppVersion:       record.AppVersion,
		StartedAt:        startedAt,
		LastSeenAt:       lastSeenAt,
		ReauthRequiredAt: ReauthDeadlineFromSessionStart(startedAt),
	}
	if err := UpsertAccountSession(ctx, redisClient, record.AccountID, s); err != nil {
		return fmt.Errorf("failed to store session record: %w", err)
	}
	return nil
}

// GetSessionRecord loads session:<sessionID> from Redis.
func GetSessionRecord(ctx context.Context, redisClient *eipredis.Redis, sessionID string) (*SessionRecord, error) {
	accountID, s, err := ResolveAccountSessionBySessionID(ctx, redisClient, sessionID)
	if err != nil {
		return nil, err
	}
	return &SessionRecord{
		SessionID:     s.SessionID,
		AccountID:     accountID,
		CharacterHash: s.CharacterHash,
		AppVersion:    s.AppVersion,
		StartedAt:     s.StartedAt,
		LastSeenAt:    s.LastSeenAt,
	}, nil
}

// DeleteSessionRecord removes session:<sessionID> from Redis. Empty sessionID is a no-op.
func DeleteSessionRecord(ctx context.Context, redisClient *eipredis.Redis, sessionID string) error {
	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return nil
	}
	if redisClient.Driver() == nil {
		return eipredis.ErrNoClient
	}
	accountID, err := GetAccountIDBySessionID(ctx, redisClient, sid)
	if err != nil {
		return nil
	}
	return RevokeAccountSession(ctx, redisClient, accountID, sid)
}

// GetRefreshTokenData retrieves refresh token data from Redis
func GetRefreshTokenData(ctx context.Context, redisClient *eipredis.Redis, token string) (*RefreshTokenData, error) {
	data, found, err := NewSessionStore(redisClient).RefreshToken(ctx, token)
	if err != nil {
		return nil, fmt.Errorf("failed to get refresh token: %w", err)
	}
	if !found {
		return nil, ErrRefreshTokenNotFound
	}
	return data, nil
}

// RevokeRefreshToken removes a refresh token from Redis
func RevokeRefreshToken(ctx context.Context, redisClient *eipredis.Redis, token string) error {
	if redisClient.Driver() == nil {
		return eipredis.ErrNoClient
	}
	return NewSessionStore(redisClient).DeleteRefreshToken(ctx, token)
}

// ResolveRefreshTokenForValidSession returns the current planner refresh token for an active session row.
// Used when rotate/bootstrap receives a stale body refresh token but a valid eip_session cookie.
func ResolveRefreshTokenForValidSession(ctx context.Context, redisClient *eipredis.Redis, sessionID string) (string, *RefreshTokenData, error) {
	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return "", nil, ErrRefreshTokenNotFound
	}
	if redisClient.Driver() == nil {
		return "", nil, eipredis.ErrNoClient
	}
	accountID, sess, err := ResolveAccountSessionBySessionID(ctx, redisClient, sid)
	if err != nil || sess == nil {
		return "", nil, ErrRefreshTokenNotFound
	}
	if sess.RevokedAt != nil {
		return "", nil, ErrRefreshTokenNotFound
	}
	if IsReauthExpired(sess.StartedAt, sess.ReauthRequiredAt, time.Now().UTC()) {
		return "", nil, ErrRefreshTokenNotFound
	}
	token, err := getSessionRefreshIndexToken(ctx, redisClient, sid)
	if err != nil {
		return "", nil, err
	}
	if token == "" {
		token, err = findRefreshTokenBySessionIDScan(ctx, redisClient, sid)
		if err != nil {
			return "", nil, err
		}
	}
	if token == "" {
		return "", nil, ErrRefreshTokenNotFound
	}
	data, err := GetRefreshTokenData(ctx, redisClient, token)
	if err != nil {
		return "", nil, err
	}
	if strings.TrimSpace(data.SessionID) != sid {
		return "", nil, ErrRefreshTokenNotFound
	}
	if strings.TrimSpace(data.AccountID) != strings.TrimSpace(accountID) {
		return "", nil, ErrRefreshTokenNotFound
	}
	return token, data, nil
}

// StoreCorporations stores corporation IDs for an account ID in Redis
// AccountID should be the same for all characters belonging to the same internal account
func StoreCorporations(ctx context.Context, redisClient *eipredis.Redis, accountID string, corporationIDs []int64) error {
	if accountID == "" {
		return errors.New("account ID cannot be empty")
	}
	return NewSessionStore(redisClient).PutCorporations(ctx, accountID, corporationIDs)
}

// GetCorporations retrieves corporation IDs for an account ID from Redis
// Returns all corporations for all characters belonging to that account
// Returns empty array on error or if not found (errors are logged internally)
func GetCorporations(ctx context.Context, redisClient *eipredis.Redis, accountID string) []int64 {
	return NewSessionStore(redisClient).Corporations(ctx, accountID)
}

// StoreAlliances stores alliance IDs for an account ID in Redis (parallel to StoreCorporations).
func StoreAlliances(ctx context.Context, redisClient *eipredis.Redis, accountID string, allianceIDs []int64) error {
	if accountID == "" {
		return errors.New("account ID cannot be empty")
	}
	return NewSessionStore(redisClient).PutAlliances(ctx, accountID, allianceIDs)
}

// GetAlliances retrieves alliance IDs for an account ID from Redis.
func GetAlliances(ctx context.Context, redisClient *eipredis.Redis, accountID string) []int64 {
	return NewSessionStore(redisClient).Alliances(ctx, accountID)
}

// GetAccountIDFromCharacterHash extracts AccountID from a character hash (alphanumeric only).
func GetAccountIDFromCharacterHash(characterHash string) string {
	alphanumericRegex := regexp.MustCompile(`[^a-zA-Z0-9]`)
	return alphanumericRegex.ReplaceAllString(characterHash, "")
}

func setSessionRefreshIndex(ctx context.Context, redisClient *eipredis.Redis, data RefreshTokenData, token string) error {
	sid := strings.TrimSpace(data.SessionID)
	tok := strings.TrimSpace(token)
	if sid == "" || tok == "" {
		return nil
	}
	if err := NewSessionStore(redisClient).PointSessionAtToken(ctx, sid, tok); err != nil {
		return fmt.Errorf("failed to store session refresh index: %w", err)
	}
	return nil
}

func getSessionRefreshIndexToken(ctx context.Context, redisClient *eipredis.Redis, sessionID string) (string, error) {
	token, _, err := NewSessionStore(redisClient).TokenForSession(ctx, sessionID)
	if err != nil {
		return "", fmt.Errorf("failed to get session refresh index: %w", err)
	}
	return token, nil
}

// findRefreshTokenBySessionIDScan locates a refresh_token row by session_id when the index is missing (legacy rows).
func findRefreshTokenBySessionIDScan(ctx context.Context, redisClient *eipredis.Redis, sessionID string) (string, error) {
	token, _, err := NewSessionStore(redisClient).FindTokenForSession(ctx, sessionID)
	return token, err
}

// pruneExpiredSessions removes sessions past ReauthRequiredAt from rec.Sessions.
// It returns pruned session IDs (for session_index cleanup) and whether rec was modified.

func deleteSessionIndexKeys(ctx context.Context, redisClient *eipredis.Redis, sessionIDs ...string) {
	if err := NewSessionStore(redisClient).DeleteSessionIndexes(ctx, sessionIDs...); err != nil {
		logs.WarnCtx(ctx, "failed to delete session index keys", "count", len(sessionIDs), "error", err)
	}
}

func GetAccountSessionsRecord(ctx context.Context, redisClient *eipredis.Redis, accountID string) (*AccountSessionsRecord, error) {
	acc := strings.TrimSpace(accountID)
	if acc == "" {
		return nil, errors.New("account_id is required")
	}
	if redisClient.Driver() == nil {
		return nil, eipredis.ErrNoClient
	}
	return NewSessionStore(redisClient).LiveAccountSessions(ctx, acc)
}

func SaveAccountSessionsRecord(ctx context.Context, redisClient *eipredis.Redis, rec *AccountSessionsRecord) error {
	if rec == nil {
		return errors.New("account sessions record is nil")
	}
	acc := strings.TrimSpace(rec.AccountID)
	if acc == "" {
		return errors.New("account_id is required")
	}
	// Replaces the record's contents, under the compare-and-set: the caller has
	// decided what it should hold, but not what version it is at. The version
	// counts writes to the stored record, so taking it from a caller's copy
	// would let a stale one rewind the token concurrency is judged against.
	return NewSessionStore(redisClient).UpdateAccountSessions(ctx, acc, func(current *AccountSessionsRecord) error {
		version := current.GrantsVersion
		*current = *rec
		current.GrantsVersion = version
		return nil
	})
}

func UpsertAccountSession(ctx context.Context, redisClient *eipredis.Redis, accountID string, session AccountSession) error {
	acc := strings.TrimSpace(accountID)
	sid := strings.TrimSpace(session.SessionID)
	if acc == "" || sid == "" {
		return errors.New("account_id and session_id are required")
	}
	err := NewSessionStore(redisClient).UpdateAccountSessions(ctx, acc, func(rec *AccountSessionsRecord) error {
		now := time.Now().UTC()
		if session.StartedAt.IsZero() {
			session.StartedAt = now
		}
		if session.LastSeenAt.IsZero() {
			session.LastSeenAt = now
		}
		if session.ReauthRequiredAt.IsZero() {
			session.ReauthRequiredAt = ReauthDeadlineFromSessionStart(session.StartedAt)
		}
		session.Grants = rec.Grants
		rec.Sessions[sid] = session
		return nil
	})
	if err != nil {
		return err
	}
	if err := NewSessionStore(redisClient).PutSessionIndex(ctx, sid, acc); err != nil {
		return fmt.Errorf("failed to store session index: %w", err)
	}
	return nil
}

func GetAccountIDBySessionID(ctx context.Context, redisClient *eipredis.Redis, sessionID string) (string, error) {
	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return "", errors.New("session_id is required")
	}
	accountID, found, err := NewSessionStore(redisClient).AccountForSession(ctx, sid)
	if err != nil {
		return "", fmt.Errorf("failed to resolve session index: %w", err)
	}
	if !found {
		return "", errors.New("session not found")
	}
	return accountID, nil
}

// loadAccountSessionRow loads one session without pruning expired rows (used for reauth checks before rotate).
func loadAccountSessionRow(ctx context.Context, redisClient *eipredis.Redis, sessionID string) (*AccountSession, error) {
	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return nil, errors.New("session_id is required")
	}
	accountID, err := GetAccountIDBySessionID(ctx, redisClient, sid)
	if err != nil {
		return nil, err
	}
	key := accountSessionsKey(accountID)
	var rec AccountSessionsRecord
	err = redisClient.GetJSON(ctx, key, &rec)
	if eipredis.IsNotFound(err) {
		return nil, errors.New("session not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get account sessions: %w", err)
	}
	if rec.Sessions == nil {
		return nil, errors.New("session not found")
	}
	session, ok := rec.Sessions[sid]
	if !ok {
		return nil, errors.New("session not found")
	}
	if session.ReauthRequiredAt.IsZero() && !session.StartedAt.IsZero() {
		session.ReauthRequiredAt = ReauthDeadlineFromSessionStart(session.StartedAt)
	}
	return &session, nil
}

func ResolveAccountSessionBySessionID(ctx context.Context, redisClient *eipredis.Redis, sessionID string) (string, *AccountSession, error) {
	sid := strings.TrimSpace(sessionID)
	accountID, err := GetAccountIDBySessionID(ctx, redisClient, sid)
	if err != nil {
		return "", nil, err
	}
	rec, err := GetAccountSessionsRecord(ctx, redisClient, accountID)
	if err != nil {
		return "", nil, err
	}
	session, ok := rec.Sessions[sid]
	if !ok {
		deleteSessionIndexKeys(ctx, redisClient, sid)
		return accountID, nil, errors.New("session not found")
	}
	return accountID, &session, nil
}

func RevokeAccountSession(ctx context.Context, redisClient *eipredis.Redis, accountID, sessionID string) error {
	acc := strings.TrimSpace(accountID)
	sid := strings.TrimSpace(sessionID)
	if acc == "" || sid == "" {
		return nil
	}
	err := NewSessionStore(redisClient).UpdateAccountSessions(ctx, acc, func(rec *AccountSessionsRecord) error {
		delete(rec.Sessions, sid)
		return nil
	})
	if err != nil {
		return err
	}
	deleteSessionIndexKeys(ctx, redisClient, sid)
	return nil
}

func TouchAccountSession(ctx context.Context, redisClient *eipredis.Redis, accountID, sessionID, appVersion string) error {
	acc := strings.TrimSpace(accountID)
	sid := strings.TrimSpace(sessionID)
	if acc == "" || sid == "" {
		return errors.New("account_id and session_id are required")
	}
	return NewSessionStore(redisClient).UpdateAccountSessions(ctx, acc, func(rec *AccountSessionsRecord) error {
		session, ok := rec.Sessions[sid]
		if !ok {
			return errors.New("session not found")
		}
		session.LastSeenAt = time.Now().UTC()
		if strings.TrimSpace(appVersion) != "" {
			session.AppVersion = strings.TrimSpace(appVersion)
		}
		session.Grants = rec.Grants
		rec.Sessions[sid] = session
		return nil
	})
}

// UpdateAccountSessionGrants writes the owners a session may reach onto its
// record and every session under it.
//
// The keys are resolved by the caller, from the account's membership rows. This
// package holds sessions, tokens and grants in Redis and reads no database; a
// membership query here would give it one, and the same query would then have two
// homes. It writes what it is given.
func UpdateAccountSessionGrants(ctx context.Context, redisClient *eipredis.Redis, accountID string, granted models.OwnerKeys) error {
	return setAccountSessionGrants(ctx, redisClient, accountID, models.SessionGrants{OwnerKeys: granted.Normalized()})
}
