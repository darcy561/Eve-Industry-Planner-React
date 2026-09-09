package httpmiddleware

import (
	"net/http"
	"net/http/httptest"
	"slices"
	"testing"
	"time"

	"eve-industry-planner/shared/logs"
)

// record returns a constructor that appends its name as the request passes
// through it, so a test can assert the order a chain runs in.
func record(order *[]string, name string) MiddlewareConstructor {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			*order = append(*order, name)
			next.ServeHTTP(w, r)
		})
	}
}

func handler(order *[]string) http.Handler {
	return http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		*order = append(*order, "handler")
	})
}

// The first constructor given is the outermost, so a chain reads in the order it
// runs. Reversing that would put request logging inside the middleware whose
// work it is supposed to be timing.
func TestChainRunsInTheOrderItIsWritten(t *testing.T) {
	var order []string
	Chain(record(&order, "first"), record(&order, "second"))(handler(&order)).
		ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil))

	if want := []string{"first", "second", "handler"}; !slices.Equal(order, want) {
		t.Fatalf("order = %v, want %v", order, want)
	}
}

func TestWrapAppliesTheChainToAHandler(t *testing.T) {
	var order []string
	Wrap(handler(&order), record(&order, "outer")).
		ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil))

	if want := []string{"outer", "handler"}; !slices.Equal(order, want) {
		t.Fatalf("order = %v, want %v", order, want)
	}
}

func TestGroupRegistersRoutesBehindItsChain(t *testing.T) {
	var order []string
	mux := http.NewServeMux()
	group := NewGroup(mux, record(&order, "group"))
	group.Handle("/handled", handler(&order))
	group.HandleFunc("/func", func(http.ResponseWriter, *http.Request) {
		order = append(order, "handler")
	})

	for _, path := range []string{"/handled", "/func"} {
		order = nil
		mux.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, path, nil))
		if want := []string{"group", "handler"}; !slices.Equal(order, want) {
			t.Errorf("%s order = %v, want %v", path, order, want)
		}
	}
}

// ApplyIf is what keeps a middleware off the routes it must not touch, so a
// non-matching request has to reach the handler with the wrapped one skipped
// rather than merely made a no-op.
func TestApplyIfRunsOnlyOnAMatch(t *testing.T) {
	for _, tc := range []struct {
		path string
		want []string
	}{
		{"/match", []string{"conditional", "handler"}},
		{"/other", []string{"handler"}},
	} {
		var order []string
		ApplyIf(Paths("/match"), record(&order, "conditional"))(handler(&order)).
			ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, tc.path, nil))

		if !slices.Equal(order, tc.want) {
			t.Errorf("%s order = %v, want %v", tc.path, order, tc.want)
		}
	}
}

func TestPathsMatchesExactlyAndPrefixesByPrefix(t *testing.T) {
	exact := Paths("/health", "/ready")
	for path, want := range map[string]bool{
		"/health": true, "/ready": true, "/healthy": false, "/": false,
	} {
		if got := exact(httptest.NewRequest(http.MethodGet, path, nil)); got != want {
			t.Errorf("Paths(%q) = %v, want %v", path, got, want)
		}
	}

	prefixed := Prefixes("/api/v1/")
	for path, want := range map[string]bool{
		"/api/v1/jobs": true, "/api/v1/": true, "/api/v2/jobs": false, "/api": false,
	} {
		if got := prefixed(httptest.NewRequest(http.MethodGet, path, nil)); got != want {
			t.Errorf("Prefixes(%q) = %v, want %v", path, got, want)
		}
	}
}

// The start time is what handler duration is measured from, so it has to be on
// the context before anything downstream reads it — and be the real wall clock,
// not a zero value that would report every request as instant.
func TestRequestStartTimeIsOnTheContextBeforeTheHandler(t *testing.T) {
	before := time.Now()
	var got time.Time
	var ok bool

	RequestStartTimeConstructor()(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		got, ok = r.Context().Value(logs.RequestStartTimeKey{}).(time.Time)
	})).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil))

	if !ok {
		t.Fatal("the handler saw no start time on its context")
	}
	if got.Before(before) || got.After(time.Now()) {
		t.Fatalf("start time %v is outside the window the request ran in", got)
	}
}
