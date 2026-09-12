package models

import (
	"reflect"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestDefaultApplicationSettingsPricesBothSides(t *testing.T) {
	settings := DefaultApplicationSettings("acct-1", time.Now().UTC())

	want := PricingSide{Market: "jita", Basis: "sell"}
	if !reflect.DeepEqual(settings.DefaultPricing.Buying, want) {
		t.Fatalf("buying = %+v, want %+v", settings.DefaultPricing.Buying, want)
	}
	if !reflect.DeepEqual(settings.DefaultPricing.Selling, want) {
		t.Fatalf("selling = %+v, want %+v", settings.DefaultPricing.Selling, want)
	}
}

// A side is stored as its own subdocument, so the two cannot be read back as one.
func TestPricingDefaultsRoundTripThroughBSON(t *testing.T) {
	in := PricingDefaults{
		Buying:  PricingSide{Market: "jita", Basis: "sell"},
		Selling: PricingSide{Market: "hek", Basis: "buy"},
	}

	raw, err := bson.Marshal(in)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var out PricingDefaults
	if err := bson.Unmarshal(raw, &out); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if !reflect.DeepEqual(out, in) {
		t.Fatalf("round trip = %+v, want %+v", out, in)
	}

	doc := bson.Raw(raw)
	for _, key := range []string{"buying", "selling"} {
		side, err := doc.LookupErr(key)
		if err != nil {
			t.Fatalf("no %q subdocument: %v", key, err)
		}
		for _, field := range []string{"market", "basis"} {
			if _, err := side.Document().LookupErr(field); err != nil {
				t.Fatalf("%q has no %q field: %v", key, field, err)
			}
		}
	}
}

// A group table is stored under the side it belongs to, so a group can never be
// read as an answer for the other one.
func TestPricingGroupsRoundTripUnderTheirSide(t *testing.T) {
	in := PricingDefaults{
		Buying: PricingSide{
			PricingChoice: PricingChoice{Market: "jita", Basis: "sell"},
			Groups:        map[string]PricingChoice{"1857": {Market: "hek"}},
		},
		Selling: PricingSide{PricingChoice: PricingChoice{Market: "amarr", Basis: "buy"}},
	}

	raw, err := bson.Marshal(in)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var out PricingDefaults
	if err := bson.Unmarshal(raw, &out); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if !reflect.DeepEqual(out, in) {
		t.Fatalf("round trip = %+v, want %+v", out, in)
	}

	doc := bson.Raw(raw)
	if _, err := doc.LookupErr("buying", "groups", "1857", "market"); err != nil {
		t.Fatalf("the group is not under its side: %v", err)
	}
	if _, err := doc.LookupErr("selling", "groups"); err == nil {
		t.Fatal("a side with no groups should write none")
	}
	// The embedded pair stays flat rather than nesting under its type name.
	if _, err := doc.LookupErr("buying", "market"); err != nil {
		t.Fatalf("market is not flat on the side: %v", err)
	}
}
