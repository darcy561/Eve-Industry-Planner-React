package middleware

import (
	"eve-industry-planner/shared/httpmiddleware"
	"net/http"

	"eve-industry-planner/api/helper"
	"eve-industry-planner/shared/dependency"
	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/plannersession"
	sessionreq "eve-industry-planner/shared/plannersession/request"

	eipredis "eve-industry-planner/shared/redis"
)

func respondAuthDependencyUnavailable(w http.ResponseWriter, r *http.Request, logMsg string, err error, extra map[string]any) {
	helper.RespondEndpointError(w, r, http.StatusServiceUnavailable, "Service temporarily unavailable", logMsg, "auth_dependency_unavailable", "auth", err, extra)
}

// AuthConstructor validates the shared session cookie against account session state.
func AuthConstructor(redisClient *eipredis.Redis) httpmiddleware.MiddlewareConstructor {
	sessions := plannersession.NewStore(redisClient)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			identity, err := sessionreq.ExtractSession(r.Context(), r, sessions)
			if err != nil {
				if sessionreq.IsInfrastructureError(err) || dependency.IsUnavailable(err) {
					detail := sessionreq.FailureDetailFromError(err, r)
					extra := detail.ClientFailureDetail(map[string]any{"error": err.Error()})
					respondAuthDependencyUnavailable(w, r, "auth session validation failed: dependency unavailable", err, extra)
					return
				}
				detail := sessionreq.FailureDetailFromError(err, r)
				switch detail.Code {
				case "session_missing", "session_revoked", "reauth_required":
					logs.AttachClientFailureDetail(r, detail.ClientFailureMessage(), detail.ClientFailureDetail(nil))
					sessionreq.WriteCodedError(w, http.StatusUnauthorized, detail.Code, "Unauthorized")
				default:
					logs.AttachClientFailureDetail(r, detail.ClientFailureMessage(), detail.ClientFailureDetail(map[string]any{
						"error": err.Error(),
					}))
					sessionreq.WriteCodedError(w, http.StatusUnauthorized, "session_missing", "Unauthorized")
				}
				return
			}
			if err := sessions.Touch(r.Context(), identity.AccountID, identity.SessionID, identity.Session.AppVersion); err != nil {
				if dependency.IsUnavailable(err) {
					respondAuthDependencyUnavailable(w, r, "failed to touch account session: dependency unavailable", err, map[string]any{
						"account_id": identity.AccountID,
						"session_id": identity.SessionID,
					})
					return
				}
				logs.AttachClientFailureDetail(r, "failed to touch account session", map[string]any{
					"failure_class": "auth_session_touch_failed",
					"code":          "session_missing",
					"account_id":    identity.AccountID,
					"session_id":    identity.SessionID,
					"error":         err.Error(),
				})
				sessionreq.WriteCodedError(w, http.StatusUnauthorized, "session_missing", "Unauthorized")
				return
			}
			ctx := sessionreq.WithIdentity(r.Context(), identity.AccountID, identity.SessionID)
			ctx = logs.BindRequestIdentity(ctx, identity.AccountID, identity.SessionID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
