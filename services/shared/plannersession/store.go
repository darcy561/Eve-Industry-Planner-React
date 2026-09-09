package plannersession

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"uuid"

	"eve-industry-planner/shared/logs"
	eipredis "eve-industry-planner/shared/redis"
)

// Store owns the planner session keyspace: the refresh tokens, the per-account
// record of live sessions, and the two indexes that resolve a session id
// without knowing whose it is.
//
// The three move together. A refresh token names a session, the session-refresh
// index names the token, and the session index names the account — so a write
// that lands one and not the rest leaves a session nothing can resolve. Keeping
// them behind one type is what makes that a single call rather than a
// convention each caller has to remember.
type Store struct{ redis *eipredis.Redis }

// NewStore binds the store to a Redis handle.
func NewStore(r *eipredis.Redis) *Store { return &Store{redis: r} }

var (
	// ErrNoStore reports a store that was never given a connection.
	//
	// It wraps the Redis handle's own sentinel so a caller that classifies
	// dependency outages — deciding 503 rather than 401 — still sees one here.
	ErrNoStore = fmt.Errorf("plannersession: store has no redis: %w", eipredis.ErrNoClient)

	// ErrSessionNotFound reports a session id nothing resolves.
	ErrSessionNotFound = errors.New("plannersession: session not found")

	// ErrRefreshTokenNotFound reports a refresh token that was never issued or
	// has expired.
	ErrRefreshTokenNotFound = errors.New("plannersession: refresh token not found")
)

// Available reports whether the store has a live connection, for callers that
// must tell a dependency outage from a bad request before doing either.
func (s *Store) Available() error {
	_, err := s.handle()
	return err
}

func (s *Store) handle() (*eipredis.Redis, error) {
	// A handle is not a connection: one wrapping no client reaches Redis no
	// better than a store with no handle at all.
	if s == nil || s.redis.Driver() == nil {
		return nil, ErrNoStore
	}
	return s.redis, nil
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

var nonAlphanumeric = regexp.MustCompile(`[^a-zA-Z0-9]`)

// AccountIDFromCharacterHash derives the account id every character of one
// account shares.
func AccountIDFromCharacterHash(characterHash string) string {
	return nonAlphanumeric.ReplaceAllString(characterHash, "")
}

// PutRefreshToken stores a token and points its session's refresh index at it,
// so a tab that holds only a session id can recover the live token.
func (s *Store) PutRefreshToken(ctx context.Context, token string, data RefreshTokenData) error {
	r, err := s.handle()
	if err != nil {
		return err
	}
	tok := strings.TrimSpace(token)
	if tok == "" {
		return eipredis.ErrEmptyKey
	}

	if err := r.PutJSON(ctx, refreshTokenKey(tok), data, RefreshTokenTTL); err != nil {
		return err
	}
	return s.PointSessionAtToken(ctx, data.SessionID, tok)
}

// RefreshToken reads a stored token. A token that was never issued, or has
// expired, reports found false rather than an error.
func (s *Store) RefreshToken(ctx context.Context, token string) (*RefreshTokenData, bool, error) {
	r, err := s.handle()
	if err != nil {
		return nil, false, err
	}
	tok := strings.TrimSpace(token)
	if tok == "" {
		return nil, false, nil
	}

	var data RefreshTokenData
	switch err := r.GetJSON(ctx, refreshTokenKey(tok), &data); {
	case eipredis.IsNotFound(err):
		return nil, false, nil
	case err != nil:
		return nil, false, err
	}
	return &data, true, nil
}

// DeleteRefreshToken removes a token, and clears the session-refresh index when
// it still names this token.
//
// The index is only cleared on a match: a rotation writes the new token's index
// entry before the old token is revoked, so an unconditional clear would erase
// the pointer to the token that just replaced it.
func (s *Store) DeleteRefreshToken(ctx context.Context, token string) error {
	r, err := s.handle()
	if err != nil {
		return err
	}
	tok := strings.TrimSpace(token)
	if tok == "" {
		return nil
	}

	// Read first: the index can only be cleared for the session this token
	// claims, and that is inside the value about to be deleted.
	data, found, err := s.RefreshToken(ctx, tok)
	if err != nil {
		return err
	}
	if _, err := r.Delete(ctx, refreshTokenKey(tok)); err != nil {
		return err
	}
	if !found {
		return nil
	}
	return s.clearSessionTokenIfMatch(ctx, data.SessionID, tok)
}

// TokenForSession reports the refresh token a session currently holds.
func (s *Store) TokenForSession(ctx context.Context, sessionID string) (string, bool, error) {
	r, err := s.handle()
	if err != nil {
		return "", false, err
	}
	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return "", false, nil
	}

	token, err := r.GetString(ctx, sessionRefreshIndexKey(sid))
	switch {
	case eipredis.IsNotFound(err):
		return "", false, nil
	case err != nil:
		return "", false, err
	}
	token = strings.TrimSpace(token)
	return token, token != "", nil
}

// PointSessionAtToken records which refresh token a session currently holds.
func (s *Store) PointSessionAtToken(ctx context.Context, sessionID, token string) error {
	sid := strings.TrimSpace(sessionID)
	if sid == "" || token == "" {
		return nil
	}
	return s.redis.PutString(ctx, sessionRefreshIndexKey(sid), token, RefreshTokenTTL)
}

func (s *Store) clearSessionTokenIfMatch(ctx context.Context, sessionID, token string) error {
	current, found, err := s.TokenForSession(ctx, sessionID)
	if err != nil || !found || current != token {
		return err
	}
	_, err = s.redis.Delete(ctx, sessionRefreshIndexKey(sessionID))
	return err
}

// AccountRecord reads an account's record. An account with none reports found
// false rather than an error.
func (s *Store) AccountRecord(ctx context.Context, accountID string) (*AccountRecord, bool, error) {
	r, err := s.handle()
	if err != nil {
		return nil, false, err
	}
	acc := strings.TrimSpace(accountID)
	if acc == "" {
		return nil, false, nil
	}

	var record AccountRecord
	switch err := r.GetJSON(ctx, accountKey(acc), &record); {
	case eipredis.IsNotFound(err):
		return nil, false, nil
	case err != nil:
		return nil, false, err
	}
	return &record, true, nil
}

// LiveAccountRecord reads an account's record, dropping sessions whose reauth
// window has elapsed and persisting the result.
//
// A read prunes because an expired session must not be reported as live to
// whatever asked — and having read it, leaving the expired entry stored would
// mean every later read repeats the work. A failure to persist is logged rather
// than returned: the caller asked for the live sessions and those are correct
// either way.
func (s *Store) LiveAccountRecord(ctx context.Context, accountID string) (*AccountRecord, error) {
	acc := strings.TrimSpace(accountID)
	if acc == "" {
		return nil, errors.New("plannersession: account id is required")
	}

	record, _, err := s.AccountRecord(ctx, acc)
	if err != nil {
		return nil, err
	}
	if record == nil {
		record = &AccountRecord{}
	}
	normalizeAccountRecord(record, acc)

	if _, pruned := pruneExpiredSessions(record, time.Now().UTC()); !pruned {
		return record, nil
	}

	// Re-derived under the compare-and-set rather than written from what was
	// read: another writer may have changed the record in between.
	if err := s.UpdateAccountRecord(ctx, acc, func(*AccountRecord) error { return nil }); err != nil {
		logs.WarnCtx(ctx, "failed to persist pruned account sessions",
			"account_id", acc, "error", err)
	}
	return record, nil
}

// UpdateAccountRecord applies mutate to an account's record and writes it back
// only if nothing else wrote in between.
//
// mutate runs again on each attempt, so it must derive its result from the
// record it is given rather than from a value captured outside. The record it
// receives for an account with none is zero-valued and stamped with the account
// id, so a caller never has to construct one.
//
// Sessions whose reauth window has elapsed are dropped before mutate sees them,
// and their indexes are deleted after the write lands. Expiry is therefore a
// property of touching the record at all rather than something a caller has to
// remember: a session that can no longer be used does not linger because nobody
// swept it.
func (s *Store) UpdateAccountRecord(ctx context.Context, accountID string, mutate func(*AccountRecord) error) error {
	r, err := s.handle()
	if err != nil {
		return err
	}
	acc := strings.TrimSpace(accountID)
	if acc == "" {
		return eipredis.ErrEmptyKey
	}

	// Collected inside the mutation and acted on after it: the write may be
	// retried, and each attempt re-derives what is expired from the record it
	// was handed.
	var expired []string

	err = eipredis.Update(ctx, r, accountKey(acc), SessionTTL,
		func(record AccountRecord, _ bool) (AccountRecord, error) {
			normalizeAccountRecord(&record, acc)
			expired, _ = pruneExpiredSessions(&record, time.Now().UTC())
			if err := mutate(&record); err != nil {
				return record, err
			}
			normalizeAccountRecord(&record, acc)
			record.GrantsVersion++
			record.UpdatedAt = time.Now().UTC()
			return record, nil
		})
	if err != nil {
		return err
	}

	// After the record is written: an index removed for a session still in a
	// record that failed to save would strand it.
	return s.DeleteSessionIndexes(ctx, expired...)
}

// SaveAccountRecord replaces a record's contents under the compare-and-set.
//
// The caller has decided what the record should hold, but not what version it is
// at. The version counts writes to the stored record, so taking it from a
// caller's copy would let a stale one rewind the token concurrency is judged
// against.
func (s *Store) SaveAccountRecord(ctx context.Context, rec *AccountRecord) error {
	if rec == nil {
		return errors.New("plannersession: account record is nil")
	}
	acc := strings.TrimSpace(rec.AccountID)
	if acc == "" {
		return errors.New("plannersession: account id is required")
	}
	return s.UpdateAccountRecord(ctx, acc, func(current *AccountRecord) error {
		version := current.GrantsVersion
		*current = *rec
		current.GrantsVersion = version
		return nil
	})
}

// PutSession adds or replaces one session in an account's record, and points
// the session index at that account.
//
// The index write belongs here rather than in [Store.UpdateAccountRecord]: it is
// adding a session that makes an id resolvable, not touching the record. A
// caller that wrote the record alone would leave a session nothing could look up
// by id.
func (s *Store) PutSession(ctx context.Context, accountID string, session Session) error {
	acc := strings.TrimSpace(accountID)
	sid := strings.TrimSpace(session.SessionID)
	if acc == "" || sid == "" {
		return errors.New("plannersession: account id and session id are required")
	}

	err := s.UpdateAccountRecord(ctx, acc, func(record *AccountRecord) error {
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
		// A session carries the grants the account held when it was written, so
		// what a connection may reach is fixed at that moment rather than read
		// again later.
		session.Grants = record.Grants
		record.Sessions[sid] = session
		return nil
	})
	if err != nil {
		return err
	}
	return s.PutSessionIndex(ctx, sid, acc)
}

// RemoveSession drops one session from an account's record and deletes its
// indexes, so nothing resolves it afterwards.
func (s *Store) RemoveSession(ctx context.Context, accountID, sessionID string) error {
	acc := strings.TrimSpace(accountID)
	sid := strings.TrimSpace(sessionID)
	if acc == "" || sid == "" {
		return nil
	}

	if err := s.UpdateAccountRecord(ctx, acc, func(record *AccountRecord) error {
		delete(record.Sessions, sid)
		return nil
	}); err != nil {
		return err
	}
	return s.DeleteSessionIndexes(ctx, sid)
}

// Touch stamps a session as seen now, and records the app version it reported.
func (s *Store) Touch(ctx context.Context, accountID, sessionID, appVersion string) error {
	acc := strings.TrimSpace(accountID)
	sid := strings.TrimSpace(sessionID)
	if acc == "" || sid == "" {
		return errors.New("plannersession: account id and session id are required")
	}
	return s.UpdateAccountRecord(ctx, acc, func(rec *AccountRecord) error {
		session, ok := rec.Sessions[sid]
		if !ok {
			return ErrSessionNotFound
		}
		session.LastSeenAt = time.Now().UTC()
		if v := strings.TrimSpace(appVersion); v != "" {
			session.AppVersion = v
		}
		session.Grants = rec.Grants
		rec.Sessions[sid] = session
		return nil
	})
}

// SessionRow reads one session without pruning expired rows, for the reauth
// checks that run before a rotate decides whether the chain is still alive.
func (s *Store) SessionRow(ctx context.Context, sessionID string) (*Session, error) {
	r, err := s.handle()
	if err != nil {
		return nil, err
	}
	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return nil, ErrSessionNotFound
	}
	accountID, found, err := s.AccountForSession(ctx, sid)
	if err != nil {
		return nil, err
	}
	if !found {
		return nil, ErrSessionNotFound
	}

	var rec AccountRecord
	switch err := r.GetJSON(ctx, accountKey(accountID), &rec); {
	case eipredis.IsNotFound(err):
		return nil, ErrSessionNotFound
	case err != nil:
		return nil, err
	}
	session, ok := rec.Sessions[sid]
	if !ok {
		return nil, ErrSessionNotFound
	}
	if session.ReauthRequiredAt.IsZero() && !session.StartedAt.IsZero() {
		session.ReauthRequiredAt = ReauthDeadlineFromSessionStart(session.StartedAt)
	}
	return &session, nil
}

// ResolveSession reports the account a session belongs to and the session
// itself, pruning expired rows on the way.
//
// A session id the index resolves but the record does not hold is a stranded
// index; it is deleted rather than left to resolve to nothing again.
func (s *Store) ResolveSession(ctx context.Context, sessionID string) (string, *Session, error) {
	sid := strings.TrimSpace(sessionID)
	accountID, found, err := s.AccountForSession(ctx, sid)
	if err != nil {
		return "", nil, err
	}
	if !found {
		return "", nil, ErrSessionNotFound
	}
	rec, err := s.LiveAccountRecord(ctx, accountID)
	if err != nil {
		return "", nil, err
	}
	session, ok := rec.Sessions[sid]
	if !ok {
		if err := s.DeleteSessionIndexes(ctx, sid); err != nil {
			logs.WarnCtx(ctx, "failed to delete session index keys", "count", 1, "error", err)
		}
		return accountID, nil, ErrSessionNotFound
	}
	return accountID, &session, nil
}

// RefreshTokenReauthExpired reports whether a token's chain has passed its
// reauth deadline, consulting the session row as well as the token so rotate,
// bootstrap and middleware all reach the same answer.
func (s *Store) RefreshTokenReauthExpired(ctx context.Context, token *RefreshTokenData, now time.Time) bool {
	if token == nil {
		return false
	}
	if IsReauthExpired(token.SessionStart, time.Time{}, now) {
		return true
	}
	sid := strings.TrimSpace(token.SessionID)
	if sid == "" {
		return false
	}
	session, err := s.SessionRow(ctx, sid)
	if err != nil || session == nil {
		return false
	}
	return IsReauthExpired(session.StartedAt, session.ReauthRequiredAt, now)
}

// ResolveTokenForValidSession returns the refresh token an active session
// currently holds, for a rotate that arrived with a stale token but a valid
// session cookie.
func (s *Store) ResolveTokenForValidSession(ctx context.Context, sessionID string) (string, *RefreshTokenData, error) {
	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return "", nil, ErrRefreshTokenNotFound
	}
	if _, err := s.handle(); err != nil {
		return "", nil, err
	}

	accountID, session, err := s.ResolveSession(ctx, sid)
	if err != nil || session == nil {
		return "", nil, ErrRefreshTokenNotFound
	}
	if session.RevokedAt != nil {
		return "", nil, ErrRefreshTokenNotFound
	}
	if IsReauthExpired(session.StartedAt, session.ReauthRequiredAt, time.Now().UTC()) {
		return "", nil, ErrRefreshTokenNotFound
	}

	token, found, err := s.FindTokenForSession(ctx, sid)
	if err != nil {
		return "", nil, err
	}
	if !found {
		return "", nil, ErrRefreshTokenNotFound
	}
	data, found, err := s.RefreshToken(ctx, token)
	if err != nil {
		return "", nil, err
	}
	if !found {
		return "", nil, ErrRefreshTokenNotFound
	}
	if strings.TrimSpace(data.SessionID) != sid ||
		strings.TrimSpace(data.AccountID) != strings.TrimSpace(accountID) {
		return "", nil, ErrRefreshTokenNotFound
	}
	return token, data, nil
}

// PutSessionIndex points a session id at the account that owns it.
func (s *Store) PutSessionIndex(ctx context.Context, sessionID, accountID string) error {
	r, err := s.handle()
	if err != nil {
		return err
	}
	sid := strings.TrimSpace(sessionID)
	acc := strings.TrimSpace(accountID)
	if sid == "" || acc == "" {
		return nil
	}
	return r.PutString(ctx, sessionIndexKey(sid), acc, SessionTTL)
}

// AccountForSession reports which account a session belongs to.
func (s *Store) AccountForSession(ctx context.Context, sessionID string) (string, bool, error) {
	r, err := s.handle()
	if err != nil {
		return "", false, err
	}
	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return "", false, nil
	}

	accountID, err := r.GetString(ctx, sessionIndexKey(sid))
	switch {
	case eipredis.IsNotFound(err):
		return "", false, nil
	case err != nil:
		return "", false, err
	}
	accountID = strings.TrimSpace(accountID)
	return accountID, accountID != "", nil
}

// DeleteSessionIndexes removes both indexes for a session. It does not touch
// the account's record: a session is removed from that under a compare-and-set,
// and doing both here would write the record twice.
func (s *Store) DeleteSessionIndexes(ctx context.Context, sessionIDs ...string) error {
	r, err := s.handle()
	if err != nil {
		return err
	}

	keys := make([]string, 0, len(sessionIDs)*2)
	for _, sessionID := range sessionIDs {
		if sid := strings.TrimSpace(sessionID); sid != "" {
			keys = append(keys, sessionIndexKey(sid), sessionRefreshIndexKey(sid))
		}
	}
	_, err = r.Delete(ctx, keys...)
	return err
}

// FindTokenForSession returns the refresh token a session holds, consulting the
// index first and falling back to a scan.
//
// The scan exists because the index can be missing while the token is not — an
// older token predating the index, or a write that failed after the token
// landed. A match found by scanning repoints the index, so the next lookup is
// cheap again.
func (s *Store) FindTokenForSession(ctx context.Context, sessionID string) (string, bool, error) {
	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return "", false, nil
	}

	if token, found, err := s.TokenForSession(ctx, sid); err != nil || found {
		return token, found, err
	}

	var match string
	if err := s.eachTokenNaming(ctx, sid, func(token string) bool {
		match = token
		return false
	}); err != nil {
		return "", false, err
	}
	if match == "" {
		return "", false, nil
	}

	// Repoint the index at what the scan found; failing to is not fatal, the
	// next lookup simply scans again.
	_ = s.PointSessionAtToken(ctx, sid, match)
	return match, true, nil
}

// errStopScan ends a scan early once it has what it came for. It never reaches
// a caller.
var errStopScan = errors.New("plannersession: stop scan")

// eachTokenNaming visits every stored refresh token whose data names this
// session. visit stops the scan by returning false, so a caller wanting only the
// first match does not read the whole keyspace.
func (s *Store) eachTokenNaming(ctx context.Context, sessionID string, visit func(token string) bool) error {
	err := s.EachRefreshTokenKey(ctx, func(tokens []string) error {
		for _, token := range tokens {
			data, found, err := s.RefreshToken(ctx, token)
			if err != nil || !found {
				continue
			}
			if strings.TrimSpace(data.SessionID) != sessionID {
				continue
			}
			if !visit(token) {
				return errStopScan
			}
		}
		return nil
	})
	if err != nil && !errors.Is(err, errStopScan) {
		return err
	}
	return nil
}

// RevokeSessionTokens revokes every refresh token a session can be reached by:
// the one presented, the one its index names, and any the index has lost track
// of.
//
// All of them, not the first found: a session being logged out must not stay
// usable through a token nothing is tracking, and an index holds one value while
// a session can have outlived several.
func (s *Store) RevokeSessionTokens(ctx context.Context, presentedToken, sessionID string) error {
	presented := strings.TrimSpace(presentedToken)
	if presented == "" {
		return nil
	}
	if err := s.DeleteRefreshToken(ctx, presented); err != nil {
		return err
	}

	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return nil
	}
	tokens, err := s.tokensForSession(ctx, sid)
	if err != nil {
		return err
	}
	for _, token := range tokens {
		if token == presented {
			continue
		}
		if err := s.DeleteRefreshToken(ctx, token); err != nil {
			return err
		}
	}
	return nil
}

// tokensForSession collects every token naming a session: the one its index
// points at, and any the index does not know about.
func (s *Store) tokensForSession(ctx context.Context, sessionID string) ([]string, error) {
	seen := map[string]struct{}{}
	var tokens []string

	token, found, err := s.TokenForSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if found {
		seen[token] = struct{}{}
		tokens = append(tokens, token)
	}

	if err := s.eachTokenNaming(ctx, sessionID, func(token string) bool {
		if _, ok := seen[token]; !ok {
			seen[token] = struct{}{}
			tokens = append(tokens, token)
		}
		return true
	}); err != nil {
		return nil, err
	}
	return tokens, nil
}

// PutCorporations caches the corporation ids ESI reported for an account.
func (s *Store) PutCorporations(ctx context.Context, accountID string, ids []int64) error {
	return s.putOrgIDs(ctx, corporationKey(accountID), accountID, ids)
}

// PutAlliances caches an account's alliance ids.
func (s *Store) PutAlliances(ctx context.Context, accountID string, ids []int64) error {
	return s.putOrgIDs(ctx, allianceKey(accountID), accountID, ids)
}

// Corporations reads the cached corporation ids. A cache miss reports an empty
// list rather than an error: the caller refreshes from ESI either way.
func (s *Store) Corporations(ctx context.Context, accountID string) []int64 {
	return s.orgIDs(ctx, corporationKey(accountID), accountID)
}

// Alliances reads the cached alliance ids.
func (s *Store) Alliances(ctx context.Context, accountID string) []int64 {
	return s.orgIDs(ctx, allianceKey(accountID), accountID)
}

func (s *Store) putOrgIDs(ctx context.Context, key, accountID string, ids []int64) error {
	r, err := s.handle()
	if err != nil {
		return err
	}
	if strings.TrimSpace(accountID) == "" {
		return errors.New("plannersession: account id is required")
	}
	return r.PutJSON(ctx, key, ids, CorporationTTL)
}

// orgIDs never reports a nil slice, so a caller can range over the result
// without checking. A degraded read is a miss: the ids are a cache of what ESI
// reported, and failing the request over them would be worse than refetching.
func (s *Store) orgIDs(ctx context.Context, key, accountID string) []int64 {
	empty := []int64{}
	r, err := s.handle()
	if err != nil || strings.TrimSpace(accountID) == "" {
		return empty
	}

	var ids []int64
	if err := r.GetJSON(ctx, key, &ids); err != nil {
		if !eipredis.IsNotFound(err) {
			logs.AttachDebugStepCtx(ctx, "redis_org_ids_load_degraded", map[string]any{
				"error": err.Error(),
			})
		}
		return empty
	}
	if ids == nil {
		return empty
	}
	return ids
}

// EachAccountKey visits the stored account-record keys, for the maintenance
// sweeps that repair or prune them.
func (s *Store) EachAccountKey(ctx context.Context, fn func(accountIDs []string) error) error {
	return s.eachUnder(ctx, AccountSessionsKeyPrefix, fn)
}

// EachSessionIndexKey visits the stored session-index keys.
func (s *Store) EachSessionIndexKey(ctx context.Context, fn func(sessionIDs []string) error) error {
	return s.eachUnder(ctx, SessionIndexKeyPrefix, fn)
}

// EachRefreshTokenKey visits the stored refresh tokens.
func (s *Store) EachRefreshTokenKey(ctx context.Context, fn func(tokens []string) error) error {
	return s.eachUnder(ctx, RefreshTokenKeyPrefix, fn)
}

// eachUnder hands fn the ids a scan found, rather than the keys they came from,
// so a caller never re-derives an id by trimming a prefix itself.
func (s *Store) eachUnder(ctx context.Context, prefix string, fn func(ids []string) error) error {
	r, err := s.handle()
	if err != nil {
		return err
	}
	return r.ScanPrefix(ctx, prefix, func(keys []string) error {
		ids := make([]string, 0, len(keys))
		for _, key := range keys {
			if id, ok := eipredis.SuffixAfter(key, prefix); ok && id != "" {
				ids = append(ids, id)
			}
		}
		if len(ids) == 0 {
			return nil
		}
		return fn(ids)
	})
}
