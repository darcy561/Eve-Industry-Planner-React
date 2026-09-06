package esiclient_test

import (
	"testing"
	"time"

	"eve-industry-planner/shared/esiclient"
)

// A slot counter cannot tell whose charge is whose, so reversing one hold twice
// takes tokens from whoever else is in the field. The ledger cannot refuse it -
// by the time it is seen the field is already short - but it can say it
// happened, which is the difference between a named defect and an intermittent
// 429 nobody can place.

func TestReversingAHoldTwiceIsCounted(t *testing.T) {
	store, _ := newStore(t)
	bucket := esiclient.Bucket{Group: "overdrawn", User: esiclient.AnonymousUser}
	const (
		limit  = 400
		window = 15 * time.Minute
	)
	known(t, store, bucket, limit, window)

	grant, err := store.Reserve(t.Context(), bucket, esiclient.ClassBackground, marketPolicy, 1)
	if err != nil || !grant.Granted {
		t.Fatalf("Reserve: %v %+v", err, grant)
	}
	held := grant.Reservations[0]

	settle := func() {
		t.Helper()
		if err := store.Settle(t.Context(), held, esiclient.Outcome{
			Attempted: true, Status: 200, Cost: 0, ObservedAt: time.Now(),
			Limit: limit, Window: window, Remaining: -1, Metered: true,
		}); err != nil {
			t.Fatalf("Settle: %v", err)
		}
	}

	settle()
	state, err := store.State(t.Context(), bucket)
	if err != nil {
		t.Fatalf("State: %v", err)
	}
	if state.Overdrawn != 0 {
		t.Fatalf("Overdrawn = %d after one settle; giving a hold back once takes nothing that was not there", state.Overdrawn)
	}

	// The same hold given back until the slot cannot cover it. What the count
	// reports is the moment a reversal takes tokens the slot was not holding -
	// see TestOverdrawnIsBoundedByWhatTheSlotCanAbsorb for why that is not the
	// same instant as the second reversal.
	settle()
	settle()

	state, err = store.State(t.Context(), bucket)
	if err != nil {
		t.Fatalf("State: %v", err)
	}
	if state.Overdrawn == 0 {
		t.Error("Overdrawn = 0 after a hold was given back until the slot ran short; the reversal took tokens that were not there and said nothing")
	}
}

// The count is evidence, not an alarm bell that catches every case. A slot
// carrying other spend absorbs a stray reversal silently: the field stays at or
// above zero and nothing is visibly wrong until it goes under. This pins that
// boundary so the limit is a known property rather than a surprise.
func TestOverdrawnIsBoundedByWhatTheSlotCanAbsorb(t *testing.T) {
	store, _ := newStore(t)
	bucket := esiclient.Bucket{Group: "overdrawn-absorbed", User: esiclient.AnonymousUser}
	const (
		limit  = 400
		window = 15 * time.Minute
	)
	known(t, store, bucket, limit, window)

	// Several calls in flight, all landing in the same slot.
	var live []esiclient.Reservation
	for range 4 {
		grant, err := store.Reserve(t.Context(), bucket, esiclient.ClassBackground, marketPolicy, 1)
		if err != nil || !grant.Granted {
			t.Fatalf("Reserve: %v %+v", err, grant)
		}
		live = append(live, grant.Reservations[0])
	}

	// One of them given back twice. The others' charges cover it, so the field
	// never goes under and the theft is invisible here.
	for range 2 {
		if err := store.Settle(t.Context(), live[0], esiclient.Outcome{
			Attempted: true, Status: 200, Cost: 0, ObservedAt: time.Now(),
			Limit: limit, Window: window, Remaining: -1, Metered: true,
		}); err != nil {
			t.Fatalf("Settle: %v", err)
		}
	}

	state, err := store.State(t.Context(), bucket)
	if err != nil {
		t.Fatalf("State: %v", err)
	}
	if state.Overdrawn != 0 {
		t.Errorf("Overdrawn = %d, but a slot holding other charges absorbs the reversal without going under", state.Overdrawn)
	}
}

// Reconciliation clears and rewrites the sync field on every reserve, and a
// bucket draining to empty deletes fields all the time. Neither is a reversal,
// so neither may raise the count - a signal that cries wolf is worse than none.
func TestOrdinaryChargesNeverCountAsOverdrawn(t *testing.T) {
	store, _ := newStore(t)
	bucket := esiclient.Bucket{Group: "overdrawn-quiet", User: esiclient.AnonymousUser}
	const (
		limit  = 400
		window = 15 * time.Minute
	)
	known(t, store, bucket, limit, window)

	for range 20 {
		grant, err := store.Reserve(t.Context(), bucket, esiclient.ClassBackground, marketPolicy, 1)
		if err != nil {
			t.Fatalf("Reserve: %v", err)
		}
		if !grant.Granted {
			continue
		}
		r := grant.Reservations[0]
		// A mix of real spend, full refunds, and a response disclosing a
		// different allowance so reconciliation rewrites the sync field.
		if err := store.Settle(t.Context(), r, esiclient.Outcome{
			Attempted: true, Status: 200, Cost: 1, ObservedAt: time.Now(),
			Limit: limit, Window: window, Remaining: limit - 40, Metered: true,
		}); err != nil {
			t.Fatalf("Settle: %v", err)
		}
	}

	state, err := store.State(t.Context(), bucket)
	if err != nil {
		t.Fatalf("State: %v", err)
	}
	if state.Overdrawn != 0 {
		t.Errorf("Overdrawn = %d after ordinary traffic; only a hold reversed twice may raise it", state.Overdrawn)
	}
}
