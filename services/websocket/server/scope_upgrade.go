package server

import (
	"context"
	"encoding/json"
	"strconv"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/protectedfields"
)

// refsForClientIDs converts the raw entity ids a client sent into refs.
// Unparseable or non-positive ids are dropped: a client cannot widen its own scope
// by sending malformed input, and the grant ceiling is checked separately.
func (s *Server) refsForClientIDs(kind protectedfields.Kind, ids []string) []string {
	if len(ids) == 0 {
		return nil
	}
	if s == nil || s.entityCipher == nil {
		logs.WarnCtx(context.Background(), "websocket scope upgrade: entity ref helper unavailable, dropping request",
			"kind", string(kind), "requested", len(ids))
		return nil
	}

	numeric := make([]int, 0, len(ids))
	for _, raw := range ids {
		id, err := strconv.Atoi(raw)
		if err != nil || id <= 0 {
			continue
		}
		numeric = append(numeric, id)
	}

	refs, err := protectedfields.ValuesForIDs(s.entityCipher, kind, numeric)
	if err != nil {
		logs.WarnCtx(context.Background(), "websocket scope upgrade: failed to derive refs",
			"kind", string(kind), "error", err.Error())
		return nil
	}

	out := make([]string, 0, len(refs))
	for _, id := range numeric {
		if r, ok := refs[id]; ok {
			out = append(out, r)
		}
	}
	return out
}

// GrantRequestedScopes adds the owners a client asked for to its scopes, keeping
// only those its session already permits. Returns false when nothing was added.
//
// The ids arrive from the browser as two lists, which is where their kind comes
// from; they become owner keys here, because grants, scopes and indexes are all
// expressed that way. An id that cannot be converted is dropped rather than
// compared raw, which would silently match nothing.
func (s *Server) GrantRequestedScopes(client *Client, corpIDs, allianceIDs []string) bool {
	if client == nil {
		return false
	}
	requested := models.NewOwnerKeys().
		AddRefs(models.OwnerCorporation, s.refsForClientIDs(protectedfields.KindCorp, corpIDs)).
		AddRefs(models.OwnerAlliance, s.refsForClientIDs(protectedfields.KindAlliance, allianceIDs))

	permitted := requested.Within(client.ownerCeiling)
	if len(permitted) == 0 {
		return false
	}
	s.setClientScopes(client, client.Scopes.Union(permitted))
	return true
}

// queueScopesAck notifies the client which realtime pools are active after upgrade or resume.
func (s *Server) queueScopesAck(client *Client) bool {
	if client == nil || client.Send == nil {
		return false
	}
	sub := map[string]any{
		"account":     true,
		"corporation": len(client.Scopes.IDsForKind(models.OwnerCorporation)) > 0,
		"alliance":    len(client.Scopes.IDsForKind(models.OwnerAlliance)) > 0,
	}
	b, err := json.Marshal(map[string]any{
		"type":         "scopes_ack",
		"ok":           true,
		"subscription": sub,
	})
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
