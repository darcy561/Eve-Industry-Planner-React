package server

import (
	"context"
	"encoding/json"
	"strings"

	"eve-industry-planner/shared/logs"
)

func (s *Server) handleUpgradeScopesWS(ctx context.Context, client *Client, msg []byte) {
	// The browser names organisations by id; it has no access to the ref key.
	// These are converted in GrantRequestedScopes and are the only raw ids
	// this service handles.
	var upgrade struct {
		CorporationIDs []string `json:"corporationIDs"`
		AllianceIDs    []string `json:"allianceIDs"`
	}
	if err := json.Unmarshal(msg, &upgrade); err != nil {
		finishWSOperationFailure(ctx, client, "upgrade_scopes",
			"websocket upgrade scopes: invalid message",
			"ws_upgrade_scopes_invalid_message", map[string]any{
				"error": err.Error(),
			})
		return
	}

	wsAppendDebugStep(ctx, "upgrade_scopes_request", map[string]any{
		"requested_corporation_count": len(upgrade.CorporationIDs),
		"requested_alliance_count":    len(upgrade.AllianceIDs),
	})

	applied := s.GrantRequestedScopes(client, upgrade.CorporationIDs, upgrade.AllianceIDs)
	extra := map[string]any{
		"scopes_applied":      applied,
		"active_owner_scopes": len(client.Scopes),
	}
	if applied && len(client.Scopes) > 0 {
		extra["owner_keys"] = strings.Join(client.Scopes, ",")
	}

	if !applied {
		finishWSOperationSuccess(ctx, client, "upgrade_scopes",
			"websocket upgrade scopes (no valid scopes)", extra, "debug")
		return
	}

	ackDelivered := s.queueScopesAck(client)
	extra["ack_delivered"] = ackDelivered
	if !ackDelivered {
		logs.AttachHandlerCaveatCtx(ctx, "upgrade_scopes_ack_buffer_full",
			"scopes_ack not delivered", map[string]any{
				"client_id": client.id,
			})
	}

	successLevel := "info"
	if !ackDelivered {
		successLevel = ""
	}
	finishWSOperationSuccess(ctx, client, "upgrade_scopes", "websocket upgrade scopes", extra, successLevel)
}
