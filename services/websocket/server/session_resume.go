package server

import (
	"context"
	"encoding/json"
	"eve-industry-planner/shared/models"
	"fmt"
	"time"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/websocket/server/config"

	redislib "github.com/redis/go-redis/v9"
)

const redisHandoffKeyPrefix = "ws:session_handoff:v2"

type sessionHandoffEntry struct {
	AccountID string
	Docs      map[string]struct{}
	OwnerKeys []string
	Expires   time.Time
}

type redisSessionHandoffPayload struct {
	AccountID string   `json:"account_id"`
	Docs      []string `json:"docs"`
	OwnerKeys []string `json:"owner_keys,omitempty"`
}

func sessionHandoffRedisKey(accountID, oldClientID string) string {
	return fmt.Sprintf("%s:%s:%s", redisHandoffKeyPrefix, accountID, oldClientID)
}

func (s *Server) snapshotSessionHandoff(ctx context.Context, client *Client) {
	if client == nil || client.id == "" || client.AccountID == "" {
		return
	}
	docs := make(map[string]struct{})
	docList := make([]string, 0)
	for docID := range client.explicitDocIDs {
		if docID != "" {
			docs[docID] = struct{}{}
			docList = append(docList, docID)
		}
	}
	ent := &sessionHandoffEntry{
		AccountID: client.AccountID,
		Docs:      docs,
		OwnerKeys: append([]string(nil), client.Scopes...),
		Expires:   time.Now().Add(config.SessionHandoffTTL),
	}
	s.sessionHandoffsMu.Lock()
	if s.sessionHandoffs == nil {
		s.sessionHandoffs = make(map[string]*sessionHandoffEntry)
	}
	s.sessionHandoffs[client.id] = ent
	s.sessionHandoffsMu.Unlock()

	s.storeRedisSessionHandoff(ctx, client.AccountID, client.id, docList, ent.OwnerKeys)

	logs.DebugCtx(ctx, "session handoff snapshot for reconnect resume",
		"old_client_id", client.id,
		"account_id", client.AccountID,
		"doc_count", len(docs),
		"owner_scopes", len(ent.OwnerKeys))
}

func (s *Server) storeRedisSessionHandoff(ctx context.Context, accountID, oldClientID string, docList, ownerKeys []string) {
	if s.Stack == nil || s.Stack.Redis == nil {
		return
	}
	payload := redisSessionHandoffPayload{
		AccountID: accountID,
		Docs:      docList,
		OwnerKeys: ownerKeys,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		logs.WarnCtx(ctx, "session handoff redis marshal failed", "error", err)
		return
	}
	rctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	key := sessionHandoffRedisKey(accountID, oldClientID)
	err = s.Stack.Redis.Set(rctx, key, b, config.SessionHandoffTTL).Err()
	if err != nil {
		logs.WarnCtx(ctx, "session handoff redis SET failed", "error", err, "key_prefix", redisHandoffKeyPrefix)
	}
}

func (s *Server) pruneExpiredSessionHandoffsLocked(now time.Time) {
	for id, ent := range s.sessionHandoffs {
		if ent == nil || now.After(ent.Expires) {
			delete(s.sessionHandoffs, id)
		}
	}
}

// popSessionHandoff removes handoff from Redis (cross-replica) or local memory (sticky / Redis miss).
func (s *Server) popSessionHandoff(ctx context.Context, accountID, previousClientID string) *sessionHandoffEntry {
	if accountID == "" || previousClientID == "" {
		return nil
	}

	if s.Stack != nil && s.Stack.Redis != nil {
		key := sessionHandoffRedisKey(accountID, previousClientID)
		rctx, cancel := context.WithTimeout(ctx, 2*time.Second)
		defer cancel()
		val, err := s.Stack.Redis.GetDel(rctx, key).Result()
		if err == nil && val != "" {
			var payload redisSessionHandoffPayload
			if errUnmarshal := json.Unmarshal([]byte(val), &payload); errUnmarshal != nil {
				logs.WarnCtx(ctx, "session handoff Redis payload invalid", "error", errUnmarshal)
			} else if payload.AccountID == accountID {
				docs := make(map[string]struct{})
				for _, d := range payload.Docs {
					if d != "" {
						docs[d] = struct{}{}
					}
				}
				logs.DebugCtx(ctx, "session handoff hit from Redis",
					"previous_client_id", previousClientID,
					"account_id", accountID,
					"doc_count", len(docs))
				s.sessionHandoffsMu.Lock()
				delete(s.sessionHandoffs, previousClientID)
				s.sessionHandoffsMu.Unlock()
				return &sessionHandoffEntry{
					AccountID: accountID,
					Docs:      docs,
					OwnerKeys: append([]string(nil), payload.OwnerKeys...),
					Expires:   time.Now().Add(config.SessionHandoffTTL),
				}
			}
		} else if err != nil && err != redislib.Nil {
			logs.WarnCtx(ctx, "session handoff Redis GETDEL failed", "error", err)
		}
	}

	now := time.Now()
	s.sessionHandoffsMu.Lock()
	defer s.sessionHandoffsMu.Unlock()
	s.pruneExpiredSessionHandoffsLocked(now)
	ent, ok := s.sessionHandoffs[previousClientID]
	if !ok || ent == nil || now.After(ent.Expires) {
		return nil
	}
	if ent.AccountID != accountID {
		logs.WarnCtx(ctx, "session resume rejected: account mismatch (memory handoff)",
			"previous_client_id", previousClientID,
			"account_id", accountID,
			"handoff_account_id", ent.AccountID)
		return nil
	}
	delete(s.sessionHandoffs, previousClientID)
	return ent
}

// SessionResumeResult summarizes reconnect handoff for consolidated WS logging.
type SessionResumeResult struct {
	PreviousClientID   string
	HandoffApplied     bool
	SkipBaselineSync   bool
	RestoredDocIDs     []string
	UnauthorizedDocIDs []string
	ScopesRestored     bool
}

// ApplySessionResume moves NATS/outgoing subscription state from a disconnected client to this
// connection when the browser reconnects with the same session (same tab).
func (s *Server) ApplySessionResume(ctx context.Context, client *Client, previousClientID string) SessionResumeResult {
	res := SessionResumeResult{PreviousClientID: previousClientID}
	if client == nil || previousClientID == "" || previousClientID == client.id {
		return res
	}

	ent := s.popSessionHandoff(ctx, client.AccountID, previousClientID)
	if ent == nil {
		return res
	}
	res.HandoffApplied = true

	for docID := range ent.Docs {
		if !s.docSubscribeAuthorized(ctx, docID, client.AccountID) {
			res.UnauthorizedDocIDs = append(res.UnauthorizedDocIDs, docID)
			continue
		}
		s.handleSubscribeRequest(client.id, docID)
		res.RestoredDocIDs = append(res.RestoredDocIDs, docID)
	}

	if len(ent.OwnerKeys) > 0 {
		restorable := models.OwnerKeys(ent.OwnerKeys).Within(client.ownerCeiling)
		if len(restorable) > 0 {
			s.setClientScopes(client, restorable)
			res.ScopesRestored = true
		}
	}

	res.SkipBaselineSync = true
	return res
}

func (s *Server) queueResumeAck(client *Client, skipBaselineSync bool, restoredDocIDs []string) bool {
	if client == nil || client.Send == nil {
		return false
	}
	msg := map[string]any{
		"type":             "resume_ack",
		"skipBaselineSync": skipBaselineSync,
	}
	if len(restoredDocIDs) > 0 {
		msg["restoredDocIDs"] = restoredDocIDs
	}
	b, err := json.Marshal(msg)
	if err != nil {
		return false
	}
	select {
	case client.Send <- b:
		return true
	default:
		return false
	}
}
