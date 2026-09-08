package redis

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"eve-industry-planner/testing/redisfake"
)

// handle binds a fake to the shared handle, for tests exercising the core.
func handle(t *testing.T, fake *redisfake.Redis) *Redis {
	t.Helper()
	return NewRedis(fake.Client)
}

func TestScanPrefixVisitsEveryKey(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	// More than one batch, so the cursor loop is exercised rather than a single
	// round trip.
	const count = scanBatch*2 + 7
	want := make([]string, 0, count)
	for i := range count {
		key := fmt.Sprintf("probe:%04d", i)
		want = append(want, key)
		if err := r.PutString(ctx, key, "v", 0); err != nil {
			t.Fatalf("seed: %v", err)
		}
	}
	if err := r.PutString(ctx, "other:1", "v", 0); err != nil {
		t.Fatalf("seed other: %v", err)
	}

	seen := map[string]bool{}
	if err := r.ScanPrefix(ctx, "probe:", func(keys []string) error {
		for _, key := range keys {
			seen[key] = true
		}
		return nil
	}); err != nil {
		t.Fatalf("scan: %v", err)
	}

	// A scan may return a key more than once, so membership is what is asserted.
	for _, key := range want {
		if !seen[key] {
			t.Fatalf("key %q was not visited", key)
		}
	}
	if seen["other:1"] {
		t.Fatal("scan visited a key outside the prefix")
	}
}

func TestScanPrefixStopsOnError(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	for i := range scanBatch * 2 {
		if err := r.PutString(ctx, fmt.Sprintf("probe:%04d", i), "v", 0); err != nil {
			t.Fatalf("seed: %v", err)
		}
	}

	stop := errors.New("stop")
	batches := 0
	err := r.ScanPrefix(ctx, "probe:", func([]string) error {
		batches++
		return stop
	})
	if !errors.Is(err, stop) {
		t.Fatalf("error = %v, want stop", err)
	}
	if batches != 1 {
		t.Fatalf("visited %d batches after an error, want 1", batches)
	}
}

func TestScanPrefixOnNoMatches(t *testing.T) {
	ctx := context.Background()
	r := handle(t, redisfake.New(t))

	called := false
	if err := r.ScanPrefix(ctx, "absent:", func([]string) error {
		called = true
		return nil
	}); err != nil {
		t.Fatalf("scan: %v", err)
	}
	if called {
		t.Fatal("fn was called with no matching keys")
	}
}

func TestScanPrefixRequiresAPrefix(t *testing.T) {
	// An empty prefix scans the whole keyspace, which is never what a caller
	// means and would let one namespace walk another's keys.
	r := handle(t, redisfake.New(t))
	if err := r.ScanPrefix(context.Background(), "", func([]string) error { return nil }); err == nil {
		t.Fatal("an empty prefix was accepted")
	}
}

func TestDeleteReportsWhatExisted(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	if err := r.PutString(ctx, "a", "v", 0); err != nil {
		t.Fatalf("seed: %v", err)
	}

	removed, err := r.Delete(ctx, "a", "absent")
	if err != nil {
		t.Fatalf("delete: %v", err)
	}
	if removed != 1 {
		t.Fatalf("removed = %d, want 1", removed)
	}

	if removed, err := r.Delete(ctx); err != nil || removed != 0 {
		t.Fatalf("delete of nothing = %d, %v", removed, err)
	}
}

func TestExists(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	if err := r.PutString(ctx, "mortal", "v", time.Hour); err != nil {
		t.Fatalf("seed: %v", err)
	}
	if err := r.PutString(ctx, "immortal", "v", 0); err != nil {
		t.Fatalf("seed: %v", err)
	}

	for key, want := range map[string]bool{"mortal": true, "immortal": true, "absent": false} {
		got, err := r.Exists(ctx, key)
		if err != nil {
			t.Fatalf("exists %q: %v", key, err)
		}
		if got != want {
			t.Errorf("exists %q = %v, want %v", key, got, want)
		}
	}

}

type casDoc struct {
	N int `json:"n"`
}

func TestUpdateCreatesWhenAbsent(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	err := Update(ctx, r, "doc", time.Hour, func(doc casDoc, found bool) (casDoc, error) {
		if found {
			t.Error("found was true for an absent key")
		}
		doc.N = 1
		return doc, nil
	})
	if err != nil {
		t.Fatalf("update: %v", err)
	}

	var got casDoc
	if err := r.GetJSON(ctx, "doc", &got); err != nil {
		t.Fatalf("read back: %v", err)
	}
	if got.N != 1 {
		t.Fatalf("n = %d, want 1", got.N)
	}
	if ttl := fake.Server.TTL("doc"); ttl != time.Hour {
		t.Fatalf("ttl = %v, want 1h", ttl)
	}
}

func TestUpdateSeesTheStoredDocument(t *testing.T) {
	ctx := context.Background()
	r := handle(t, redisfake.New(t))

	if err := r.PutJSON(ctx, "doc", casDoc{N: 41}, 0); err != nil {
		t.Fatalf("seed: %v", err)
	}

	err := Update(ctx, r, "doc", 0, func(doc casDoc, found bool) (casDoc, error) {
		if !found {
			t.Error("found was false for a stored key")
		}
		doc.N++
		return doc, nil
	})
	if err != nil {
		t.Fatalf("update: %v", err)
	}

	var got casDoc
	if err := r.GetJSON(ctx, "doc", &got); err != nil {
		t.Fatalf("read back: %v", err)
	}
	if got.N != 42 {
		t.Fatalf("n = %d, want 42", got.N)
	}
}

func TestUpdateAbandonsOnMutateError(t *testing.T) {
	ctx := context.Background()
	r := handle(t, redisfake.New(t))

	refuse := errors.New("refuse")
	err := Update(ctx, r, "doc", 0, func(doc casDoc, _ bool) (casDoc, error) {
		return doc, refuse
	})
	if !errors.Is(err, refuse) {
		t.Fatalf("error = %v, want refuse", err)
	}

	if exists, _ := r.Exists(ctx, "doc"); exists {
		t.Fatal("a refused update still wrote the key")
	}
}

// The reason this primitive exists: concurrent read-modify-writes must not lose
// an update, which a plain get-then-set would.
func TestUpdateLosesNoConcurrentIncrement(t *testing.T) {
	ctx := context.Background()
	r := handle(t, redisfake.New(t))

	if err := r.PutJSON(ctx, "doc", casDoc{}, 0); err != nil {
		t.Fatalf("seed: %v", err)
	}

	const writers = 8
	var wg sync.WaitGroup
	errs := make([]error, writers)
	for i := range writers {
		wg.Go(func() {
			errs[i] = Update(ctx, r, "doc", 0, func(doc casDoc, _ bool) (casDoc, error) {
				doc.N++
				return doc, nil
			})
		})
	}
	wg.Wait()

	for i, err := range errs {
		if err != nil {
			t.Fatalf("writer %d: %v", i, err)
		}
	}

	var got casDoc
	if err := r.GetJSON(ctx, "doc", &got); err != nil {
		t.Fatalf("read back: %v", err)
	}
	if got.N != writers {
		t.Fatalf("n = %d, want %d — an update was lost", got.N, writers)
	}
}

func TestSuffixAfter(t *testing.T) {
	for _, tc := range []struct {
		key, prefix, want string
		ok                bool
	}{
		{"session:abc", "session:", "abc", true},
		{"session:", "session:", "", true},
		{"other:abc", "session:", "other:abc", false},
	} {
		got, ok := SuffixAfter(tc.key, tc.prefix)
		if got != tc.want || ok != tc.ok {
			t.Errorf("SuffixAfter(%q, %q) = %q, %v; want %q, %v", tc.key, tc.prefix, got, ok, tc.want, tc.ok)
		}
	}
}

func TestRunScriptEvaluatesOnTheServer(t *testing.T) {
	ctx := context.Background()
	r := handle(t, redisfake.New(t))

	script := Script(`redis.call("SET", KEYS[1], ARGV[1]) return redis.call("GET", KEYS[1])`)
	got, err := r.Run(ctx, script, []string{"k"}, "v").Text()
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if got != "v" {
		t.Fatalf("got %q, want %q", got, "v")
	}
}

func TestCoreCallsReportAHandleWithNoClient(t *testing.T) {
	// Both shapes a handle can be unusable in: never constructed, and
	// constructed around no client.
	for name, r := range map[string]*Redis{"nil handle": nil, "nil client": {}} {
		t.Run(name, func(t *testing.T) { assertReportsNoClient(t, r) })
	}
}

// Asking to write or delete nothing is a no-op, and stays one even without a
// connection — the call has nothing to reach the server for.
func TestNoOpCallsNeedNoConnection(t *testing.T) {
	ctx := context.Background()
	for name, r := range map[string]*Redis{"nil handle": nil, "nil client": {}} {
		t.Run(name, func(t *testing.T) {
			if err := r.PutFields(ctx, "k", nil, 0); err != nil {
				t.Errorf("PutFields with no fields = %v, want nil", err)
			}
			if err := r.DeleteFields(ctx, "k"); err != nil {
				t.Errorf("DeleteFields with no fields = %v, want nil", err)
			}
			if n, err := r.Delete(ctx); n != 0 || err != nil {
				t.Errorf("Delete with no keys = %d, %v; want 0, nil", n, err)
			}
			if got, err := GetManyJSON[casDoc](ctx, r, nil); err != nil || len(got) != 0 {
				t.Errorf("GetManyJSON with no keys = %v, %v; want empty, nil", got, err)
			}
		})
	}
}

// A caller mistake is reported whether or not a connection exists, so it is
// never hidden behind a missing one.
func TestCallerMistakesAreReportedWithoutAConnection(t *testing.T) {
	ctx := context.Background()
	for name, r := range map[string]*Redis{"nil handle": nil, "nil client": {}} {
		t.Run(name, func(t *testing.T) {
			if err := r.ScanPrefix(ctx, "", func([]string) error { return nil }); !errors.Is(err, ErrEmptyPrefix) {
				t.Errorf("ScanPrefix with no prefix = %v, want ErrEmptyPrefix", err)
			}
			if err := Update(ctx, r, "", 0, func(d casDoc, _ bool) (casDoc, error) { return d, nil }); !errors.Is(err, ErrEmptyKey) {
				t.Errorf("Update with no key = %v, want ErrEmptyKey", err)
			}
			err := RunWhileHeld(ctx, r, "", "id", LeaseOptions{}, func(context.Context) error { return nil })
			if !errors.Is(err, ErrEmptyKey) {
				t.Errorf("RunWhileHeld with no key = %v, want ErrEmptyKey", err)
			}
		})
	}
}

func assertReportsNoClient(t *testing.T, r *Redis) {
	t.Helper()
	ctx := context.Background()

	if err := r.ScanPrefix(ctx, "x:", func([]string) error { return nil }); !errors.Is(err, ErrNoClient) {
		t.Errorf("ScanPrefix = %v, want ErrNoClient", err)
	}
	if _, err := r.Delete(ctx, "x"); !errors.Is(err, ErrNoClient) {
		t.Errorf("Delete = %v, want ErrNoClient", err)
	}
	if _, err := r.Exists(ctx, "x"); !errors.Is(err, ErrNoClient) {
		t.Errorf("Exists = %v, want ErrNoClient", err)
	}
	if err := Update(ctx, r, "x", 0, func(d casDoc, _ bool) (casDoc, error) { return d, nil }); !errors.Is(err, ErrNoClient) {
		t.Errorf("Update = %v, want ErrNoClient", err)
	}
	if err := r.Run(ctx, Script("return 1"), nil).Err(); !errors.Is(err, ErrNoClient) {
		t.Errorf("Run = %v, want ErrNoClient", err)
	}
	if _, err := r.Pipe(); !errors.Is(err, ErrNoClient) {
		t.Errorf("Pipe = %v, want ErrNoClient", err)
	}
	if err := r.PutJSON(ctx, "x", 1, 0); !errors.Is(err, ErrNoClient) {
		t.Errorf("PutJSON = %v, want ErrNoClient", err)
	}
	if _, err := r.PutIfAbsent(ctx, "x", "v", 0); !errors.Is(err, ErrNoClient) {
		t.Errorf("PutIfAbsent = %v, want ErrNoClient", err)
	}
	if err := r.PutFields(ctx, "x", map[string]any{"a": 1}, 0); !errors.Is(err, ErrNoClient) {
		t.Errorf("PutFields = %v, want ErrNoClient", err)
	}
	if _, err := r.Fields(ctx, "x"); !errors.Is(err, ErrNoClient) {
		t.Errorf("Fields = %v, want ErrNoClient", err)
	}
	if err := r.PutScored(ctx, "x", "m", 1, 0); !errors.Is(err, ErrNoClient) {
		t.Errorf("PutScored = %v, want ErrNoClient", err)
	}
	if _, err := r.Scored(ctx, "x"); !errors.Is(err, ErrNoClient) {
		t.Errorf("Scored = %v, want ErrNoClient", err)
	}
	if _, err := GetManyJSON[casDoc](ctx, r, []string{"x"}); !errors.Is(err, ErrNoClient) {
		t.Errorf("GetManyJSON = %v, want ErrNoClient", err)
	}
	if err := r.Ping(ctx); !errors.Is(err, ErrNoClient) {
		t.Errorf("Ping = %v, want ErrNoClient", err)
	}
}

func TestAddDistinctCountsUniqueValues(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	if err := r.AddDistinct(ctx, "hll", time.Hour, "a", "b", "a"); err != nil {
		t.Fatalf("add: %v", err)
	}
	got, err := r.CountDistinct(ctx, "hll")
	if err != nil {
		t.Fatalf("count: %v", err)
	}
	if got != 2 {
		t.Fatalf("count = %d, want 2", got)
	}
	if ttl := fake.Server.TTL("hll"); ttl != time.Hour {
		t.Fatalf("ttl = %v, want 1h", ttl)
	}
}

func TestCountDistinctMergesKeys(t *testing.T) {
	ctx := context.Background()
	r := handle(t, redisfake.New(t))

	if err := r.AddDistinct(ctx, "a", time.Hour, "1", "2"); err != nil {
		t.Fatalf("add: %v", err)
	}
	if err := r.AddDistinct(ctx, "b", time.Hour, "2", "3"); err != nil {
		t.Fatalf("add: %v", err)
	}

	got, err := r.CountDistinct(ctx, "a", "b")
	if err != nil {
		t.Fatalf("count: %v", err)
	}
	if got != 3 {
		t.Fatalf("count = %d, want 3 — the overlap was counted twice", got)
	}
}

func TestCountDistinctOnAbsentKeys(t *testing.T) {
	ctx := context.Background()
	r := handle(t, redisfake.New(t))

	for name, keys := range map[string][]string{
		"one absent key": {"absent"},
		"several absent": {"a", "b"},
		"no keys at all": nil,
	} {
		t.Run(name, func(t *testing.T) {
			got, err := r.CountDistinct(ctx, keys...)
			if err != nil {
				t.Fatalf("count: %v", err)
			}
			if got != 0 {
				t.Fatalf("count = %d, want 0", got)
			}
		})
	}
}

// A fixed scratch key would be corrupted by any concurrent count, including the
// same code on another replica.
func TestCountDistinctScratchKeysDoNotCollide(t *testing.T) {
	ctx := context.Background()
	r := handle(t, redisfake.New(t))

	for i := range 20 {
		if err := r.AddDistinct(ctx, fmt.Sprintf("h%d", i), time.Hour, fmt.Sprint(i)); err != nil {
			t.Fatalf("seed: %v", err)
		}
	}
	keys := make([]string, 20)
	for i := range keys {
		keys[i] = fmt.Sprintf("h%d", i)
	}

	// Concurrent counts of the same keys must each see all 20.
	var wg sync.WaitGroup
	counts := make([]uint64, 8)
	errs := make([]error, 8)
	for i := range counts {
		wg.Go(func() { counts[i], errs[i] = r.CountDistinct(ctx, keys...) })
	}
	wg.Wait()

	for i, err := range errs {
		if err != nil {
			t.Fatalf("count %d: %v", i, err)
		}
		if counts[i] != 20 {
			t.Fatalf("count %d = %d, want 20 — a concurrent merge was corrupted", i, counts[i])
		}
	}
}

// An absent id is not a distinct one: counting empty values would inflate every
// window they appear in.
func TestAddDistinctSkipsEmptyValues(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	if err := r.AddDistinct(ctx, "hll", time.Hour, ""); err != nil {
		t.Fatalf("add: %v", err)
	}
	if keys := fake.Server.Keys(); len(keys) != 0 {
		t.Fatalf("an empty value wrote %v", keys)
	}

	if err := r.AddDistinct(ctx, "hll", time.Hour, "a", "", "b"); err != nil {
		t.Fatalf("add: %v", err)
	}
	got, err := r.CountDistinct(ctx, "hll")
	if err != nil {
		t.Fatalf("count: %v", err)
	}
	if got != 2 {
		t.Fatalf("count = %d, want 2 — an empty value was counted", got)
	}
}

// A scratch key is deleted by the call that made it. The expiry only covers a
// process that died in between: unique keys would otherwise leak one per lost
// call, which the fixed key they replaced could not do.
func TestScratchKeysExpireIfTheyAreNeverDeleted(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	r := handle(t, fake)

	scratch := scratchKey("probe")
	if err := r.PutString(ctx, scratch, "v", ttlScratch); err != nil {
		t.Fatalf("seed: %v", err)
	}
	if ttl := fake.Server.TTL(scratch); ttl != ttlScratch {
		t.Fatalf("ttl = %v, want %v", ttl, ttlScratch)
	}

	fake.Server.FastForward(ttlScratch + time.Minute)
	if fake.Server.Exists(scratch) {
		t.Fatal("an abandoned scratch key outlived its expiry")
	}
}
