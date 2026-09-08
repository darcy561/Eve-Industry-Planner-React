package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"eve-industry-planner/shared/logs"
	eipredis "eve-industry-planner/shared/redis"
)

// SessionStore owns the planner session keyspace: the refresh tokens, the
// per-account record of live sessions, and the two indexes that resolve a
// session id without knowing whose it is.
//
// The three move together. A refresh token names a session, the session-refresh
// index names the token, and the session index names the account — so a write
// that lands one and not the rest leaves a session nothing can resolve. Keeping
// them behind one type is what makes that a single call rather than a
// convention each caller has to remember.
type SessionStore struct{ redis *eipredis.Redis }

// NewSessionStore binds the store to a Redis handle.
func NewSessionStore(r *eipredis.Redis) *SessionStore { return &SessionStore{redis: r} }

// ErrNoStore reports a store that was never given a connection.
var ErrNoStore = errors.New("auth: session store has no redis")

func (s *SessionStore) handle() (*eipredis.Redis, error) {
	// A handle is not a connection: one wrapping no client reaches Redis no
	// better than a store with no handle at all.
	if s == nil || s.redis.Driver() == nil {
		return nil, ErrNoStore
	}
	return s.redis, nil
}

// PutRefreshToken stores a token and points its session's refresh index at it,
// so a tab that holds only a session id can recover the live token.
func (s *SessionStore) PutRefreshToken(ctx context.Context, token string, data RefreshTokenData) error {
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
func (s *SessionStore) RefreshToken(ctx context.Context, token string) (*RefreshTokenData, bool, error) {
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
func (s *SessionStore) DeleteRefreshToken(ctx context.Context, token string) error {
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
func (s *SessionStore) TokenForSession(ctx context.Context, sessionID string) (string, bool, error) {
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
func (s *SessionStore) PointSessionAtToken(ctx context.Context, sessionID, token string) error {
	sid := strings.TrimSpace(sessionID)
	if sid == "" || token == "" {
		return nil
	}
	return s.redis.PutString(ctx, sessionRefreshIndexKey(sid), token, RefreshTokenTTL)
}

func (s *SessionStore) clearSessionTokenIfMatch(ctx context.Context, sessionID, token string) error {
	current, found, err := s.TokenForSession(ctx, sessionID)
	if err != nil || !found || current != token {
		return err
	}
	_, err = s.redis.Delete(ctx, sessionRefreshIndexKey(sessionID))
	return err
}

// AccountSessions reads an account's sessions record. An account with none
// reports found false rather than an error.
func (s *SessionStore) AccountSessions(ctx context.Context, accountID string) (*AccountSessionsRecord, bool, error) {
	r, err := s.handle()
	if err != nil {
		return nil, false, err
	}
	acc := strings.TrimSpace(accountID)
	if acc == "" {
		return nil, false, nil
	}

	var record AccountSessionsRecord
	switch err := r.GetJSON(ctx, accountSessionsKey(acc), &record); {
	case eipredis.IsNotFound(err):
		return nil, false, nil
	case err != nil:
		return nil, false, err
	}
	return &record, true, nil
}

// LiveAccountSessions reads an account's record, dropping sessions whose reauth
// window has elapsed and persisting the result.
//
// A read prunes because an expired session must not be reported as live to
// whatever asked — and having read it, leaving the expired entry stored would
// mean every later read repeats the work. A failure to persist is logged rather
// than returned: the caller asked for the live sessions and those are correct
// either way.
func (s *SessionStore) LiveAccountSessions(ctx context.Context, accountID string) (*AccountSessionsRecord, error) {
	acc := strings.TrimSpace(accountID)
	if acc == "" {
		return nil, errors.New("auth: account id is required")
	}

	record, _, err := s.AccountSessions(ctx, acc)
	if err != nil {
		return nil, err
	}
	if record == nil {
		record = &AccountSessionsRecord{}
	}
	normalizeAccountSessionsRecord(record, acc)

	if _, pruned := pruneExpiredSessions(record, time.Now().UTC()); !pruned {
		return record, nil
	}

	// Re-derived under the compare-and-set rather than written from what was
	// read: another writer may have changed the record in between.
	if err := s.UpdateAccountSessions(ctx, acc, func(*AccountSessionsRecord) error { return nil }); err != nil {
		logs.WarnCtx(ctx, "failed to persist pruned account sessions",
			"account_id", acc, "error", err)
	}
	return record, nil
}

// UpdateAccountSessions applies mutate to an account's record and writes it
// back only if nothing else wrote in between.
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
func (s *SessionStore) UpdateAccountSessions(ctx context.Context, accountID string, mutate func(*AccountSessionsRecord) error) error {
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

	err = eipredis.Update(ctx, r, accountSessionsKey(acc), SessionTTL,
		func(record AccountSessionsRecord, _ bool) (AccountSessionsRecord, error) {
			normalizeAccountSessionsRecord(&record, acc)
			expired, _ = pruneExpiredSessions(&record, time.Now().UTC())
			if err := mutate(&record); err != nil {
				return record, err
			}
			normalizeAccountSessionsRecord(&record, acc)
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

// PutSession adds or replaces one session in an account's record, and points
// the session index at that account.
//
// The index write belongs here rather than in [SessionStore.UpdateAccountSessions]:
// it is adding a session that makes an id resolvable, not touching the record.
// A caller that wrote the record alone would leave a session nothing could look
// up by id.
func (s *SessionStore) PutSession(ctx context.Context, accountID string, session AccountSession) error {
	acc := strings.TrimSpace(accountID)
	sid := strings.TrimSpace(session.SessionID)
	if acc == "" || sid == "" {
		return errors.New("auth: account id and session id are required")
	}

	err := s.UpdateAccountSessions(ctx, acc, func(record *AccountSessionsRecord) error {
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
func (s *SessionStore) RemoveSession(ctx context.Context, accountID, sessionID string) error {
	acc := strings.TrimSpace(accountID)
	sid := strings.TrimSpace(sessionID)
	if acc == "" || sid == "" {
		return nil
	}

	if err := s.UpdateAccountSessions(ctx, acc, func(record *AccountSessionsRecord) error {
		delete(record.Sessions, sid)
		return nil
	}); err != nil {
		return err
	}
	return s.DeleteSessionIndexes(ctx, sid)
}

// PutSessionIndex points a session id at the account that owns it.
func (s *SessionStore) PutSessionIndex(ctx context.Context, sessionID, accountID string) error {
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
func (s *SessionStore) AccountForSession(ctx context.Context, sessionID string) (string, bool, error) {
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
func (s *SessionStore) DeleteSessionIndexes(ctx context.Context, sessionIDs ...string) error {
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
func (s *SessionStore) FindTokenForSession(ctx context.Context, sessionID string) (string, bool, error) {
	sid := strings.TrimSpace(sessionID)
	if sid == "" {
		return "", false, nil
	}

	if token, found, err := s.TokenForSession(ctx, sid); err != nil || found {
		return token, found, err
	}

	var match string
	err := s.EachRefreshTokenKey(ctx, func(tokens []string) error {
		for _, token := range tokens {
			data, found, err := s.RefreshToken(ctx, token)
			if err != nil || !found {
				continue
			}
			if strings.TrimSpace(data.SessionID) == sid {
				match = token
				return errStopScan
			}
		}
		return nil
	})
	if err != nil && !errors.Is(err, errStopScan) {
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
var errStopScan = errors.New("auth: stop scan")

// RevokeSessionTokens revokes every refresh token a session can be reached by:
// the one presented, the one its index names, and one found by scanning.
//
// Three sources because a session that is being logged out must not remain
// usable through a token the index has lost track of.
func (s *SessionStore) RevokeSessionTokens(ctx context.Context, presentedToken, sessionID string) error {
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
	other, found, err := s.FindTokenForSession(ctx, sid)
	if err != nil {
		return err
	}
	if !found || other == presented {
		return nil
	}
	return s.DeleteRefreshToken(ctx, other)
}

// PutOrgIDs caches the corporation or alliance ids ESI reported for an account.
func (s *SessionStore) PutCorporations(ctx context.Context, accountID string, ids []int64) error {
	return s.putOrgIDs(ctx, corporationKey(accountID), accountID, ids)
}

// PutAlliances caches an account's alliance ids.
func (s *SessionStore) PutAlliances(ctx context.Context, accountID string, ids []int64) error {
	return s.putOrgIDs(ctx, allianceKey(accountID), accountID, ids)
}

// Corporations reads the cached corporation ids. A cache miss reports an empty
// list rather than an error: the caller refreshes from ESI either way.
func (s *SessionStore) Corporations(ctx context.Context, accountID string) []int64 {
	return s.orgIDs(ctx, corporationKey(accountID), accountID)
}

// Alliances reads the cached alliance ids.
func (s *SessionStore) Alliances(ctx context.Context, accountID string) []int64 {
	return s.orgIDs(ctx, allianceKey(accountID), accountID)
}

func (s *SessionStore) putOrgIDs(ctx context.Context, key, accountID string, ids []int64) error {
	r, err := s.handle()
	if err != nil {
		return err
	}
	if strings.TrimSpace(accountID) == "" {
		return nil
	}
	return r.PutJSON(ctx, key, ids, CorporationTTL)
}

// orgIDs never reports a nil slice, so a caller can range over the result
// without checking. A degraded read is a miss: the ids are a cache of what ESI
// reported, and failing the request over them would be worse than refetching.
func (s *SessionStore) orgIDs(ctx context.Context, key, accountID string) []int64 {
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

// EachAccountSessionsKey visits the stored account-sessions keys, for the
// maintenance sweeps that repair or prune them.
func (s *SessionStore) EachAccountSessionsKey(ctx context.Context, fn func(accountIDs []string) error) error {
	return s.eachUnder(ctx, AccountSessionsKeyPrefix, fn)
}

// EachSessionIndexKey visits the stored session-index keys.
func (s *SessionStore) EachSessionIndexKey(ctx context.Context, fn func(sessionIDs []string) error) error {
	return s.eachUnder(ctx, SessionIndexKeyPrefix, fn)
}

// EachRefreshTokenKey visits the stored refresh tokens.
func (s *SessionStore) EachRefreshTokenKey(ctx context.Context, fn func(tokens []string) error) error {
	return s.eachUnder(ctx, RefreshTokenKeyPrefix, fn)
}

// AccountSessionsKeyFor names the record key for an id a scan returned.
//
// A scan reports the id as stored, which is not always what a builder would
// produce from it: an id carrying whitespace was written under that key, and
// rebuilding it would address a different one. A caller that has to name the
// key it was just handed uses this rather than composing it again.
func AccountSessionsKeyFor(accountID string) string {
	return AccountSessionsKeyPrefix + accountID
}

// eachUnder hands fn the ids a scan found, rather than the keys they came from,
// so a caller never re-derives an id by trimming a prefix itself.
func (s *SessionStore) eachUnder(ctx context.Context, prefix string, fn func(ids []string) error) error {
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

// DeleteAccountSessions removes an account's whole sessions record.
func (s *SessionStore) DeleteAccountSessions(ctx context.Context, accountID string) error {
	r, err := s.handle()
	if err != nil {
		return err
	}
	acc := strings.TrimSpace(accountID)
	if acc == "" {
		return nil
	}
	_, err = r.Delete(ctx, accountSessionsKey(acc))
	return err
}
