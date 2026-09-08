package changestream

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"eve-industry-planner/shared/models"
	eipmongo "eve-industry-planner/shared/mongo"
	eipnats "eve-industry-planner/shared/nats"
	"eve-industry-planner/testing/mongolive"

	natslib "github.com/nats-io/nats.go"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// The watcher's own message, published from a real write.
//
// The two halves either side of this are covered — Mongo to the cursor by the
// other live tests here, NATS to a browser by the websocket integration suites —
// but each builds the message it works on. This drives the step between them, so
// what a document states and what a subscriber receives are checked against one
// another rather than against a fixture either side invented.
//
// The publisher under test is the stack's own core, not a watcher this test
// starts. Starting a second one proves nothing while core is running: both watch
// the same collections, so the test would pass on core's message whatever the
// in-test watcher produced.
//
// Requires EIP_MONGO_PARITY_LIVE=1, the stack's NATS, and a running core.
func TestLive_Publish_ownerReachesTheSubscriberFromTheDocument(t *testing.T) {
	m := mongolive.Require(t)

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	nats, err := eipnats.Open(ctx)
	if err != nil {
		t.Skipf("stack NATS unreachable: %v", err)
	}
	t.Cleanup(func() { nats.Close() })

	const (
		accountID = "eip-live-publish-account"
		jobID     = "eip-live-publish-job"
	)
	owner := models.AccountOwner(accountID).Key()

	coll := m.Coll(eipmongo.CollectionJobDocuments)
	clear := func() {
		cctx, c := context.WithTimeout(context.Background(), 30*time.Second)
		defer c()
		_, _ = coll.DeleteOne(cctx, bson.M{"_id": jobID})
	}
	clear()
	t.Cleanup(clear)

	// Subscribe before writing: the watcher publishes as the event arrives, and a
	// subscription made afterwards would race it.
	sub, err := nats.Conn().SubscribeSync(eipnats.SubjectDocUpdate + ".>")
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	t.Cleanup(func() { _ = sub.Unsubscribe() })

	if _, err := coll.InsertOne(ctx, bson.M{
		"_id": jobID,
		"_meta": bson.M{
			models.MetaFieldOwner: mongolive.OwnerDoc(models.AccountOwner(accountID)),
		},
		"jobID": jobID,
	}); err != nil {
		t.Fatalf("insert the job: %v", err)
	}

	msg := awaitDocUpdateFor(t, sub, jobID, 30*time.Second)

	var got struct {
		Collection string `json:"collection"`
		DocID      string `json:"docID"`
		OwnerKey   string `json:"ownerKey"`
		Operation  string `json:"operationType"`
	}
	if err := json.Unmarshal(msg.Data, &got); err != nil {
		t.Fatalf("decode published message: %v\n%s", err, msg.Data)
	}

	if got.OwnerKey != owner {
		t.Fatalf("published ownerKey = %q, want %q — the document's owner did not reach the subscriber",
			got.OwnerKey, owner)
	}
	if got.Collection != eipmongo.CollectionJobDocuments || got.DocID != jobID {
		t.Fatalf("published collection/docID = %q/%q", got.Collection, got.DocID)
	}
	if got.Operation != "insert" {
		t.Fatalf("operationType = %q, want insert", got.Operation)
	}

	// The subject's tenant and the message's owner key are built from one value, so
	// a subscriber filtering by subject and one reading the body agree on the owner.
	wantSubject := eipnats.DocUpdateSubject(owner, eipmongo.CollectionJobDocuments, jobID)
	if msg.Subject != wantSubject {
		t.Fatalf("subject = %q, want %q", msg.Subject, wantSubject)
	}
}

// awaitDocUpdateFor returns the first doc.update naming docID, ignoring traffic
// the running stack produces alongside the test.
func awaitDocUpdateFor(t *testing.T, sub *natslib.Subscription, docID string, within time.Duration) *natslib.Msg {
	t.Helper()
	deadline := time.Now().Add(within)
	for time.Now().Before(deadline) {
		msg, err := sub.NextMsg(time.Until(deadline))
		if err != nil {
			break
		}
		var peek struct {
			DocID string `json:"docID"`
		}
		if json.Unmarshal(msg.Data, &peek) == nil && peek.DocID == docID {
			return msg
		}
	}
	t.Fatalf("no doc.update for %s within %s", docID, within)
	return nil
}

// A planner-held document is stored under {ownerKey}|{id}, and what reaches a
// subscriber is the bare id — the value a browser sends, keys its store on and
// reads back. The owner travels beside it as ownerKey rather than inside it.
//
// Requires EIP_MONGO_PARITY_LIVE=1, the stack's NATS, and a running core.
func TestLive_Publish_sendsTheBareIDForAnOwnerScopedDocument(t *testing.T) {
	m := mongolive.Require(t)

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	nats, err := eipnats.Open(ctx)
	if err != nil {
		t.Skipf("stack NATS unreachable: %v", err)
	}
	t.Cleanup(func() { nats.Close() })

	const (
		accountID = "eip-live-publish-scoped-account"
		jobID     = "eip-live-publish-scoped-job"
	)
	owner := models.AccountOwner(accountID)
	storedID := eipmongo.OwnerScopedDocumentID(owner, jobID)

	coll := m.Coll(eipmongo.CollectionJobDocuments)
	clear := func() {
		cctx, c := context.WithTimeout(context.Background(), 30*time.Second)
		defer c()
		_, _ = coll.DeleteOne(cctx, bson.M{"_id": storedID})
	}
	clear()
	t.Cleanup(clear)

	sub, err := nats.Conn().SubscribeSync(eipnats.SubjectDocUpdate + ".>")
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	t.Cleanup(func() { _ = sub.Unsubscribe() })

	if _, err := coll.InsertOne(ctx, bson.M{
		"_id": storedID,
		"_meta": bson.M{
			models.MetaFieldOwner: mongolive.OwnerDoc(owner),
		},
		"jobID": jobID,
	}); err != nil {
		t.Fatalf("insert the job: %v", err)
	}

	// Awaited by the bare id, which is the assertion: a subscriber never sees the
	// stored form.
	msg := awaitDocUpdateFor(t, sub, jobID, 30*time.Second)

	var got struct {
		DocID    string `json:"docID"`
		OwnerKey string `json:"ownerKey"`
	}
	if err := json.Unmarshal(msg.Data, &got); err != nil {
		t.Fatalf("decode published message: %v\n%s", err, msg.Data)
	}
	if got.DocID != jobID {
		t.Fatalf("published docID = %q, want the bare %q", got.DocID, jobID)
	}
	if got.OwnerKey != owner.Key() {
		t.Fatalf("published ownerKey = %q, want %q", got.OwnerKey, owner.Key())
	}

	// The subject carries the bare id too, so a filter built from what a client
	// knows still matches.
	wantSubject := eipnats.DocUpdateSubject(owner.Key(), eipmongo.CollectionJobDocuments, jobID)
	if msg.Subject != wantSubject {
		t.Fatalf("subject = %q, want %q", msg.Subject, wantSubject)
	}
}

// A delete states no owner without a preimage. The stored id carries one, so the
// message still routes to the planner's members instead of falling back to
// explicit subscribers.
//
// Requires EIP_MONGO_PARITY_LIVE=1, the stack's NATS, and a running core.
func TestLive_Publish_recoversADeletedDocumentsOwnerFromItsID(t *testing.T) {
	m := mongolive.Require(t)

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	nats, err := eipnats.Open(ctx)
	if err != nil {
		t.Skipf("stack NATS unreachable: %v", err)
	}
	t.Cleanup(func() { nats.Close() })

	const (
		accountID = "eip-live-publish-delete-account"
		jobID     = "eip-live-publish-delete-job"
	)
	owner := models.AccountOwner(accountID)
	storedID := eipmongo.OwnerScopedDocumentID(owner, jobID)

	coll := m.Coll(eipmongo.CollectionJobDocuments)
	clear := func() {
		cctx, c := context.WithTimeout(context.Background(), 30*time.Second)
		defer c()
		_, _ = coll.DeleteOne(cctx, bson.M{"_id": storedID})
	}
	clear()
	t.Cleanup(clear)

	if _, err := coll.InsertOne(ctx, bson.M{
		"_id": storedID,
		"_meta": bson.M{
			models.MetaFieldOwner: mongolive.OwnerDoc(owner),
		},
		"jobID": jobID,
	}); err != nil {
		t.Fatalf("insert the job: %v", err)
	}

	// Subscribed after the insert, so the delete is the message awaited.
	sub, err := nats.Conn().SubscribeSync(eipnats.SubjectDocUpdate + ".>")
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	t.Cleanup(func() { _ = sub.Unsubscribe() })

	if _, err := coll.DeleteOne(ctx, bson.M{"_id": storedID}); err != nil {
		t.Fatalf("delete the job: %v", err)
	}

	msg := awaitDocUpdateFor(t, sub, jobID, 30*time.Second)

	var got struct {
		DocID     string `json:"docID"`
		OwnerKey  string `json:"ownerKey"`
		Operation string `json:"operationType"`
	}
	if err := json.Unmarshal(msg.Data, &got); err != nil {
		t.Fatalf("decode published message: %v\n%s", err, msg.Data)
	}
	if got.Operation != "delete" {
		t.Fatalf("operationType = %q, want delete", got.Operation)
	}
	if got.DocID != jobID {
		t.Fatalf("published docID = %q, want the bare %q", got.DocID, jobID)
	}
	if got.OwnerKey != owner.Key() {
		t.Fatalf("published ownerKey = %q, want %q — a delete lost its owner",
			got.OwnerKey, owner.Key())
	}
}
