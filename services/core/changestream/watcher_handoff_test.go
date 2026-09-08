package changestream

import (
	"bytes"
	"context"
	"testing"
	"time"

	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/redisfake"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// The token a new primary resumes from must be byte-identical to what the old
// one stored: Mongo's StartAfter rejects a token it did not issue.
func TestResumeTokenSurvivesTheHandoffIntact(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)

	// A realistic token: Mongo's _id is a document with a _data string.
	raw, err := bson.Marshal(bson.M{"_data": "82650A1B2C000000012B0429296E1404"})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	original := bson.Raw(raw)

	a := NewWatcher(nil, nil, eipredis.NewRedis(fake.Client))
	a.tokens.Save(ctx, "planner", original)

	b := NewWatcher(nil, nil, eipredis.NewRedis(fake.Client))
	got, ok := b.tokens.Load(ctx, "planner")
	if !ok {
		t.Fatal("B found no token")
	}
	if !bytes.Equal(got, original) {
		t.Errorf("token changed in transit:\n got %x\nwant %x", got, original)
	}
	// It must still parse as the document Mongo gave us.
	var back bson.M
	if err := bson.Unmarshal(got, &back); err != nil {
		t.Fatalf("token no longer unmarshals: %v", err)
	}
	t.Logf("round-tripped intact: %v", back)
}

// A Redis outage must not stop the stream: Save and Clear swallow, Load reports
// a cold start. The cost is a duplicate event on failover, never a stall.
func TestATokenStoreOutageDoesNotStallTheStream(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	w := NewWatcher(nil, nil, eipredis.NewRedis(fake.Client))

	w.tokens.Save(ctx, "planner", bson.Raw([]byte{5, 0, 0, 0, 0}))
	fake.Server.Close() // Redis goes away mid-stream

	done := make(chan struct{})
	go func() {
		defer close(done)
		w.tokens.Save(ctx, "planner", bson.Raw([]byte{5, 0, 0, 0, 0}))
		_, ok := w.tokens.Load(ctx, "planner")
		t.Logf("load during outage: found=%v (want false)", ok)
		w.tokens.Clear(ctx, "planner")
	}()
	select {
	case <-done:
		t.Log("all three calls returned during the outage")
	case <-time.After(20 * time.Second):
		t.Fatal("a token call blocked while Redis was down")
	}
}
