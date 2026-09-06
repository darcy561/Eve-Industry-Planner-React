package models

// SessionGrants is every owner a session may read, including the account's own
// key, so nothing downstream special-cases the account.
//
// The wrapper is the stored envelope: grants persist as an object under `grants`
// rather than a bare list, so a field can be added beside the keys later without
// rewriting what is already stored. It carries no schema version because the
// release rewrites stored grants rather than migrating them in place.
type SessionGrants struct {
	OwnerKeys OwnerKeys `json:"owner_keys"`
}

// Allows reports whether the owner is one the session may read.
func (g SessionGrants) Allows(owner Owner) bool { return g.OwnerKeys.Has(owner) }
