package changestream

import (
	"context"
	"testing"

	"eve-industry-planner/core/primaryhandoff"
	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/redisfake"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// The watcher reads and writes resume tokens under the group's own id. A
// watcher that stored under a different name would restart cold every failover
// without anything failing.
func TestWatcherAddressesTokensByGroupID(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	handle := eipredis.NewRedis(fake.Client)
	w := NewWatcher(nil, nil, handle)

	const group = "planner"
	token := bson.Raw([]byte{5, 0, 0, 0, 0})

	w.tokens.Save(ctx, group, token)
	if !fake.Server.Exists(primaryhandoff.ResumeTokenKey(group)) {
		t.Fatalf("the watcher stored no token at %s", primaryhandoff.ResumeTokenKey(group))
	}

	got, ok := w.tokens.Load(ctx, group)
	if !ok {
		t.Fatal("the watcher could not read back the token it stored")
	}
	if string(got) != string(token) {
		t.Errorf("token = %v, want %v", got, token)
	}

	w.tokens.Clear(ctx, group)
	if fake.Server.Exists(primaryhandoff.ResumeTokenKey(group)) {
		t.Error("the cleared token is still stored")
	}
}

// A watcher with no Redis still runs: every group starts cold.
func TestWatcherWithoutRedisStartsCold(t *testing.T) {
	w := NewWatcher(nil, nil, nil)
	if _, ok := w.tokens.Load(context.Background(), "planner"); ok {
		t.Error("a watcher with no Redis reported a stored token")
	}
}
