package esiclient

import (
	"testing"
	"time"

	"eve-industry-planner/testing/redisfake"

	eipredis "eve-industry-planner/shared/redis"
)

// The bound term was appended to a reply whose tail is variable-length: eight
// header fields followed by an id/slot pair per reservation. During a rolling
// deploy both shapes are on the wire at once, and length alone cannot tell them
// apart - an older reply carrying one reservation is exactly as long as a newer
// one carrying none. Getting this wrong misaligns the pairs rather than losing a
// figure, so every shape is pinned.

func oldReply(pairs ...string) []any {
	out := []any{"1", "0", "0.000000", "10.000000", "400", "900", "1", "0"}
	for _, p := range pairs {
		out = append(out, p)
	}
	return out
}

func newReply(bound string, pairs ...string) []any {
	out := []any{"1", "0", "0.000000", "10.000000", "400", "900", "1", "0", bound}
	for _, p := range pairs {
		out = append(out, p)
	}
	return out
}

func TestAReplyWithoutTheBoundTermStillAligns(t *testing.T) {
	bucket := Bucket{Group: "g", User: AnonymousUser}

	cases := []struct {
		name  string
		raw   []any
		bound Bound
		ids   []string
	}{
		{"old, no reservations", oldReply(), BoundNone, nil},
		{"old, one reservation", oldReply("id-a", "1.500000"), BoundNone, []string{"id-a"}},
		{"old, two reservations", oldReply("id-a", "1.5", "id-b", "2.5"), BoundNone, []string{"id-a", "id-b"}},
		{"new, no reservations", newReply("2"), BoundFloor, nil},
		{"new, one reservation", newReply("3", "id-a", "1.500000"), BoundShare, []string{"id-a"}},
		{"new, two reservations", newReply("1", "id-a", "1.5", "id-b", "2.5"), BoundBucket, []string{"id-a", "id-b"}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			grant, err := parseGrant(tc.raw, bucket, ClassBackground, "/e/")
			if err != nil {
				t.Fatalf("parseGrant: %v", err)
			}
			if grant.Bound != tc.bound {
				t.Errorf("Bound = %v, want %v", grant.Bound, tc.bound)
			}
			if len(grant.Reservations) != len(tc.ids) {
				t.Fatalf("got %d reservations, want %d - the pairs are misaligned",
					len(grant.Reservations), len(tc.ids))
			}
			for i, id := range tc.ids {
				if grant.Reservations[i].ID != id {
					t.Errorf("reservation %d id = %q, want %q; a slot time read as an id means the "+
						"header length was misjudged", i, grant.Reservations[i].ID, id)
				}
				if grant.Reservations[i].Slot.IsZero() {
					t.Errorf("reservation %d has no slot time", i)
				}
			}
		})
	}
}

// A grant says nothing about a binding term: nothing held the call back.
func TestAGrantNamesNoBoundTerm(t *testing.T) {
	grant, err := parseGrant(newReply("0", "id-a", "1.5"), Bucket{Group: "g"}, ClassBackground, "/e/")
	if err != nil {
		t.Fatalf("parseGrant: %v", err)
	}
	if grant.Bound != BoundNone {
		t.Errorf("Bound = %v on a grant, want %v", grant.Bound, BoundNone)
	}
	if grant.Bound.String() != "unstated" {
		t.Errorf("BoundNone reads as %q", grant.Bound.String())
	}
}

func TestBoundNamesEachTerm(t *testing.T) {
	for _, tc := range []struct {
		bound Bound
		want  string
	}{
		{BoundBucket, "bucket"},
		{BoundFloor, "class_floor"},
		{BoundShare, "endpoint_share"},
		{BoundNone, "unstated"},
	} {
		if got := tc.bound.String(); got != tc.want {
			t.Errorf("Bound(%d).String() = %q, want %q", tc.bound, got, tc.want)
		}
	}
}

// The three terms are exercised against the shipped script rather than reasoned
// about, because which one wins is arithmetic spread over three places in the
// Lua. Each case arranges for exactly one term to be the binding one.

// fill spends tokens in a bucket until it holds at least spend, using the class
// and endpoint given, so a test can arrange who owns what.
func fill(t *testing.T, store *Store, b Bucket, class Class, policy EndpointPolicy, limit int, window time.Duration, spend int) {
	t.Helper()
	for spent := 0; spent < spend; {
		grant, err := store.Reserve(t.Context(), b, class, policy, 1)
		if err != nil {
			t.Fatalf("Reserve while filling: %v", err)
		}
		if !grant.Granted {
			// Filling stops as soon as the bucket refuses: the caller is about to
			// ask for the refusal it actually cares about.
			return
		}
		r := grant.Reservations[0]
		if err := store.Settle(t.Context(), r, Outcome{
			Attempted: true, Status: 200, Cost: SuccessCost, ObservedAt: time.Now(),
			Limit: limit, Window: window, Remaining: -1, Metered: true,
		}); err != nil {
			t.Fatalf("Settle while filling: %v", err)
		}
		spent += SuccessCost
	}
}

// boundStore is an in-package store, so a test can set floors and shares
// directly rather than through the exported surface.
func boundStore(t *testing.T, adjust func(*Config)) *Store {
	t.Helper()
	cfg := DefaultConfig()
	adjust(&cfg)
	return NewStore(eipredis.NewRedis(redisfake.New(t).Client), cfg)
}

// learn puts a bucket past discovery with a stated allowance.
func learn(t *testing.T, store *Store, b Bucket, policy EndpointPolicy, limit int, window time.Duration) {
	t.Helper()
	grant, err := store.Reserve(t.Context(), b, ClassBackground, policy, 1)
	if err != nil || !grant.Granted {
		t.Fatalf("probe reserve: %v %+v", err, grant)
	}
	if err := store.Settle(t.Context(), grant.Reservations[0], Outcome{
		Status: 200, Cost: SuccessCost, ObservedAt: time.Now(),
		Limit: limit, Window: window, Remaining: limit - SuccessCost, Metered: true,
	}); err != nil {
		t.Fatalf("probe settle: %v", err)
	}
}

func TestAnEmptyBucketNamesTheBucket(t *testing.T) {
	const (
		limit  = 40
		window = 15 * time.Minute
	)
	// No floors and no endpoint share, so nothing but the bucket can bind.
	store := boundStore(t, func(c *Config) { c.Floors = nil })
	policy := EndpointPolicy{Pattern: "/e/", MinSpacing: time.Millisecond}
	bucket := Bucket{Group: "bound-bucket", User: AnonymousUser}

	learn(t, store, bucket, policy, limit, window)
	fill(t, store, bucket, ClassBackground, policy, limit, window, limit)

	grant, err := store.Reserve(t.Context(), bucket, ClassBackground, policy, 1)
	if err != nil {
		t.Fatalf("Reserve: %v", err)
	}
	if grant.Granted {
		t.Fatalf("a spent bucket granted a slot: %+v", grant)
	}
	if grant.Bound != BoundBucket {
		t.Errorf("Bound = %v, want %v: the bucket is spent and no floor or share is configured",
			grant.Bound, BoundBucket)
	}
}

func TestAFloorOwedToAnotherClassNamesTheFloor(t *testing.T) {
	const (
		limit  = 400
		window = 15 * time.Minute
	)
	store := boundStore(t, func(c *Config) {
		c.Floors = []ClassFloor{
			{Class: ClassUserRequested, Floor: 0.95},
			{Class: ClassBackground, Floor: 0.05},
		}
	})
	policy := EndpointPolicy{Pattern: "/e/", MinSpacing: time.Millisecond}
	bucket := Bucket{Group: "bound-floor", User: AnonymousUser}

	learn(t, store, bucket, policy, limit, window)

	// The other class spends most of the bucket, so what is left is less than the
	// floors still promise between them.
	fill(t, store, bucket, ClassUserRequested, policy, limit, window, limit*3/4)

	// What this class may take now, which the floors have cut well below what the
	// bucket still holds.
	probe, err := store.Reserve(t.Context(), bucket, ClassBackground, policy, 1)
	if err != nil {
		t.Fatalf("Reserve to read the share: %v", err)
	}
	if !probe.Granted {
		t.Fatalf("a single call was refused, so the one-call minimum is not holding: %+v", probe)
	}
	for _, r := range probe.Reservations {
		if err := store.Release(t.Context(), r); err != nil {
			t.Fatalf("Release: %v", err)
		}
	}

	// Ask for more than the floors leave this class. A single call is never
	// refused by a floor - a class always keeps one call's worth while the bucket
	// can afford one - so the floor only binds a request larger than that.
	want := probe.Available/SuccessCost + 2
	grant, err := store.Reserve(t.Context(), bucket, ClassBackground, policy, want)
	if err != nil {
		t.Fatalf("Reserve: %v", err)
	}
	if grant.Granted {
		t.Fatalf("granted while the floor was owed elsewhere: %+v", grant)
	}
	if room := grant.State.Limit - grant.State.Spent; room <= 0 {
		t.Fatalf("the bucket itself is spent, so this is not a floor case: %d left", room)
	}
	if grant.Bound != BoundFloor {
		t.Errorf("Bound = %v, want %v: the bucket still holds tokens but they are owed to another class",
			grant.Bound, BoundFloor)
	}
}

func TestAnEndpointShareNamesTheShare(t *testing.T) {
	const (
		limit  = 400
		window = 15 * time.Minute
	)
	// No floors, so the only cap besides the bucket is this endpoint's share.
	store := boundStore(t, func(c *Config) { c.Floors = nil })
	policy := EndpointPolicy{Pattern: "/e/", MinSpacing: time.Millisecond, MaxShare: 0.1}
	bucket := Bucket{Group: "bound-share", User: AnonymousUser}

	learn(t, store, bucket, policy, limit, window)
	fill(t, store, bucket, ClassBackground, policy, limit, window, int(0.1*limit))

	grant, err := store.Reserve(t.Context(), bucket, ClassBackground, policy, 1)
	if err != nil {
		t.Fatalf("Reserve: %v", err)
	}
	if grant.Granted {
		t.Fatalf("granted past the endpoint's share: %+v", grant)
	}
	if grant.Bound != BoundShare {
		t.Errorf("Bound = %v, want %v: the bucket has room but this endpoint has used its share",
			grant.Bound, BoundShare)
	}
}
