package middleware

import (
	"context"
	"eve-industry-planner/shared/httpmiddleware"
	"net/http"
	"time"
)

// DefaultHTTPRequestTimeout is the deadline applied by [RequestTimeoutConstructor].
const DefaultHTTPRequestTimeout = 10 * time.Second

// RequestTimeoutConstructor adds a per-request deadline. Request start time for duration metrics
// is set earlier by [RequestStartTimeConstructor] (outside otelhttp).
func RequestTimeoutConstructor() httpmiddleware.MiddlewareConstructor {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			timeoutCtx, cancel := context.WithTimeout(r.Context(), DefaultHTTPRequestTimeout)
			defer cancel()
			r = r.WithContext(timeoutCtx)
			next.ServeHTTP(w, r)
		})
	}
}
