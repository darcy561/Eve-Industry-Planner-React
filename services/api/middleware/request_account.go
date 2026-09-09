package middleware

import (
	"eve-industry-planner/shared/httpmiddleware"
	"net/http"

	"eve-industry-planner/shared/logs"
	"eve-industry-planner/shared/plannersession"
	sessionreq "eve-industry-planner/shared/plannersession/request"

	eipredis "eve-industry-planner/shared/redis"
)

func bindRequestIdentity(r *http.Request, accountID, sessionID string) *http.Request {
	return logs.BindRequestIdentityToRequest(r, accountID, sessionID)
}

// OptionalAccountLogConstructor resolves a valid session cookie when present and binds account_id
// and session_id for consolidated logging on public routes. It never rejects the request.
func OptionalAccountLogConstructor(redisClient *eipredis.Redis) httpmiddleware.MiddlewareConstructor {
	sessions := plannersession.NewStore(redisClient)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if redisClient != nil {
				if identity, ok := sessionreq.TryExtractSession(r.Context(), r, sessions); ok && identity != nil {
					r = bindRequestIdentity(r, identity.AccountID, identity.SessionID)
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}
