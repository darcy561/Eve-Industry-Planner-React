package dependency

import (
	"context"
	"errors"
	"fmt"
	"net"
	"testing"

	"eve-industry-planner/shared/core/documentlock"

	eipnats "eve-industry-planner/shared/nats"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"go.mongodb.org/mongo-driver/v2/mongo"

	eipredis "eve-industry-planner/shared/redis"
)

func TestIsUnavailable_redis(t *testing.T) {
	err := fmt.Errorf("an error has occurred with redis command: %w", &net.OpError{
		Op:  "dial",
		Net: "tcp",
		Err: errors.New(`lookup redis on 127.0.0.11:53: no such host`),
	})
	if !IsUnavailable(err) {
		t.Fatal("expected redis dial error to be unavailable")
	}
}

func TestIsUnavailable_mongo(t *testing.T) {
	if IsUnavailable(mongo.ErrNoDocuments) {
		t.Fatal("ErrNoDocuments must not be unavailable")
	}
	if !IsUnavailable(mongo.ErrClientDisconnected) {
		t.Fatal("ErrClientDisconnected should be unavailable")
	}
}

func TestIsUnavailable_nats(t *testing.T) {
	tests := []error{
		nats.ErrConnectionClosed,
		nats.ErrNoServers,
		nats.ErrDisconnected,
		jetstream.ErrConnectionClosed,
		eipnats.ErrNotConnected,
		fmt.Errorf("publish failed: %w", eipnats.ErrNotConnected),
	}
	for _, err := range tests {
		if !IsUnavailable(err) {
			t.Fatalf("expected unavailable: %v", err)
		}
	}
}

func TestIsUnavailable_notInfrastructure(t *testing.T) {
	if IsUnavailable(context.Canceled) {
		t.Fatal("context.Canceled should not be unavailable")
	}
	if IsUnavailable(errors.New("session not found")) {
		t.Fatal("application errors should not be unavailable")
	}
}

func TestIsUnavailable_documentLocks(t *testing.T) {
	if !IsUnavailable(documentlock.ErrLocksUnavailable) {
		t.Fatal("locks unavailable should map to dependency unavailable")
	}
}

// A handle that was never given a connection is unreachable, and the guards
// that used to say so in prose now return the sentinel.
func TestIsUnavailable_redisHandleWithNoConnection(t *testing.T) {
	if !IsUnavailable(eipredis.ErrNoClient) {
		t.Error("a clientless Redis handle was not reported unavailable")
	}
	if !IsUnavailable(fmt.Errorf("resolving session: %w", eipredis.ErrNoClient)) {
		t.Error("a wrapped clientless handle was not reported unavailable")
	}
}

// A missing key is an answer, not an outage: treating it as one would make
// every absent lookup look like a Redis failure.
func TestIsUnavailable_missingKeyIsNotAnOutage(t *testing.T) {
	if IsUnavailable(eipredis.ErrNotFound) {
		t.Error("a missing key was reported as an outage")
	}
}
