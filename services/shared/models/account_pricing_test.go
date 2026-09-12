package models

import (
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestDefaultApplicationSettingsPricesBothSides(t *testing.T) {
	settings := DefaultApplicationSettings("acct-1", time.Now().UTC())

	want := PricingSide{Market: "jita", Basis: "sell"}
	if settings.DefaultPricing.Buying != want {
		t.Fatalf("buying = %+v, want %+v", settings.DefaultPricing.Buying, want)
	}
	if settings.DefaultPricing.Selling != want {
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
	if out != in {
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
