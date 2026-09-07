package helper

import (
	"testing"

	"eve-industry-planner/shared/crypto/entityid"
	"eve-industry-planner/shared/models"
)

func testCipher(t *testing.T) *entityid.Cipher {
	t.Helper()
	c, err := entityid.New([]byte("a-test-secret-long-enough-for-the-cipher"))
	if err != nil {
		t.Fatalf("build cipher: %v", err)
	}
	return c
}

// A handle carries the raw EVE id and the owner carries the ref, so rendering and
// parsing have to arrive back at the same stored owner. Deterministic encryption
// is what makes the return trip land on the ref already in the database.
func TestOwnerHandleRoundTripsToTheStoredOwner(t *testing.T) {
	t.Parallel()
	cipher := testCipher(t)

	for _, tc := range []struct {
		name       string
		owner      func() models.Owner
		wantHandle string
	}{
		{
			name:       "account",
			owner:      func() models.Owner { return models.AccountOwner("acct-1") },
			wantHandle: "account:acct-1",
		},
		{
			name: "corporation",
			owner: func() models.Owner {
				ref, err := cipher.Corporation(98000001)
				if err != nil {
					t.Fatalf("encrypt: %v", err)
				}
				return models.CorporationOwner(ref)
			},
			wantHandle: "corporation:98000001",
		},
		{
			name: "alliance",
			owner: func() models.Owner {
				ref, err := cipher.Alliance(99000001)
				if err != nil {
					t.Fatalf("encrypt: %v", err)
				}
				return models.AllianceOwner(ref)
			},
			wantHandle: "alliance:99000001",
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			owner := tc.owner()

			handle, err := OwnerHandle(owner, cipher)
			if err != nil {
				t.Fatalf("OwnerHandle: %v", err)
			}
			if handle != tc.wantHandle {
				t.Fatalf("handle = %q, want %q", handle, tc.wantHandle)
			}

			back, err := ParseOwnerHandle(handle, cipher)
			if err != nil {
				t.Fatalf("ParseOwnerHandle: %v", err)
			}
			if back != owner {
				t.Errorf("round trip = %+v, want %+v", back, owner)
			}
		})
	}
}

// No ref reaches a client: a handle carries the id the ref stands for.
func TestOwnerHandleKeepsRefsOffTheWire(t *testing.T) {
	t.Parallel()
	cipher := testCipher(t)

	ref, err := cipher.Corporation(98000001)
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}
	handle, err := OwnerHandle(models.CorporationOwner(ref), cipher)
	if err != nil {
		t.Fatalf("OwnerHandle: %v", err)
	}
	if handle == models.CorporationOwner(ref).Key() {
		t.Fatal("the handle is the stored owner key, so the ref reached the client")
	}
	if len(handle) > len("corporation:")+20 {
		t.Errorf("handle %q looks like it carries a ref rather than an id", handle)
	}
}

func TestParseOwnerHandleRefusesWhatItCannotAddress(t *testing.T) {
	t.Parallel()
	cipher := testCipher(t)

	for _, bad := range []string{
		"",
		"account",
		"account:",
		// An entity kind whose id is not a number is a client sending a ref back.
		"corporation:corp_56_J_DzQdPpjXwi9Xtp3C8bri9Bfi0Z94qUulkbKCac",
		"corporation:",
	} {
		if _, err := ParseOwnerHandle(bad, cipher); err == nil {
			t.Errorf("ParseOwnerHandle(%q) was accepted", bad)
		}
	}

	// An account id may contain a colon, so only the first separates the halves.
	owner, err := ParseOwnerHandle("account:a:b", cipher)
	if err != nil {
		t.Fatalf("ParseOwnerHandle: %v", err)
	}
	if owner.ID != "a:b" {
		t.Errorf("id = %q, want the whole remainder", owner.ID)
	}
}

// An entity handle cannot be read without the cipher, so a caller wired without
// one fails rather than addressing an owner by a raw id.
func TestOwnerHandleNeedsACipherForEntityKinds(t *testing.T) {
	t.Parallel()

	if _, err := ParseOwnerHandle("corporation:98000001", nil); err == nil {
		t.Error("a corporation handle was parsed without a cipher")
	}
	if _, err := OwnerHandle(models.CorporationOwner("corp_x"), nil); err == nil {
		t.Error("a corporation owner was rendered without a cipher")
	}

	// An account owner needs none: its id is not an entity id.
	if _, err := ParseOwnerHandle("account:acct-1", nil); err != nil {
		t.Errorf("an account handle needed a cipher: %v", err)
	}
	if _, err := OwnerHandle(models.AccountOwner("acct-1"), nil); err != nil {
		t.Errorf("an account owner needed a cipher: %v", err)
	}
}
