package primaryhandoff

import (
	"context"
	"encoding/base64"
	"strings"

	"eve-industry-planner/shared/logs"

	eipredis "eve-industry-planner/shared/redis"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// ResumeTokens reads and writes the change-stream resume tokens a core primary
// leaves for its successor.
//
// A token is a position, not the data: losing one costs a cold start or a
// duplicate event, both of which the pipeline already tolerates. Redis failures
// are therefore reported to the log and not to the caller, so a Redis outage
// cannot stop the change stream. [ResumeTokens.Stored] is the exception — an
// operator asking what is stored needs to know the answer is incomplete.
type ResumeTokens struct{ redis *eipredis.Redis }

// logComponent matches the watcher's, so a query for the change stream's events
// returns the token failures alongside them.
const logComponent = "changestream"

// NewResumeTokens binds the store to a Redis handle.
func NewResumeTokens(r *eipredis.Redis) *ResumeTokens { return &ResumeTokens{redis: r} }

// Load returns the stored token for groupID, or false to start cold.
//
// A token is stored base64-encoded; one that is not decodes as its own bytes,
// which is how tokens written before the encoding are still read.
func (s *ResumeTokens) Load(ctx context.Context, groupID string) (bson.Raw, bool) {
	group := strings.TrimSpace(groupID)
	if group == "" {
		return nil, false
	}

	stored, err := s.redis.GetString(ctx, ResumeTokenKey(group))
	if eipredis.IsNotFound(err) {
		return nil, false
	}
	if err != nil {
		logs.WarnCtx(ctx, "changestream resume token load failed; cold start",
			"component", logComponent, "group_id", group, "error", err)
		return nil, false
	}

	decoded, err := base64.StdEncoding.DecodeString(stored)
	if err != nil {
		decoded = []byte(stored)
	}
	if len(decoded) == 0 {
		return nil, false
	}
	return bson.Raw(decoded), true
}

// Save stores the token for groupID. Tokens have no expiry, so a group that
// stops being watched leaves its key behind — see [ResumeTokens.Drop].
func (s *ResumeTokens) Save(ctx context.Context, groupID string, token bson.Raw) {
	group := strings.TrimSpace(groupID)
	if group == "" || len(token) == 0 {
		return
	}
	encoded := base64.StdEncoding.EncodeToString(token)
	if err := s.redis.PutString(ctx, ResumeTokenKey(group), encoded, ttlResumeToken); err != nil {
		logs.WarnCtx(ctx, "changestream resume token save failed",
			"component", logComponent, "group_id", group, "error", err)
	}
}

// Clear removes a token that cannot be resumed from.
func (s *ResumeTokens) Clear(ctx context.Context, groupID string) {
	group := strings.TrimSpace(groupID)
	if group == "" {
		return
	}
	if _, err := s.redis.Delete(ctx, ResumeTokenKey(group)); err != nil {
		logs.WarnCtx(ctx, "changestream resume token clear failed",
			"component", logComponent, "group_id", group, "error", err)
	}
}

// Stored lists every group that has a token, watched or not.
func (s *ResumeTokens) Stored(ctx context.Context) ([]string, error) {
	var groups []string
	err := s.redis.ScanPrefix(ctx, resumeTokenPrefix, func(keys []string) error {
		for _, key := range keys {
			if groupID, ok := eipredis.SuffixAfter(key, resumeTokenPrefix); ok {
				groups = append(groups, groupID)
			}
		}
		return nil
	})
	return groups, err
}

// Drop removes the tokens of groups that are no longer watched.
func (s *ResumeTokens) Drop(ctx context.Context, groupIDs ...string) error {
	if len(groupIDs) == 0 {
		return nil
	}
	keys := make([]string, len(groupIDs))
	for i, groupID := range groupIDs {
		keys[i] = ResumeTokenKey(strings.TrimSpace(groupID))
	}
	_, err := s.redis.Delete(ctx, keys...)
	return err
}
