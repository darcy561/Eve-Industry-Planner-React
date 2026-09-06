package esiclient

import "strings"

// fieldSeparator divides a ledger field's parts. It is the one definition of the
// separator: the Lua builds its own patterns from it, so a change here changes
// both sides together.
//
// Changing it is migrate-required, not additive. Fields already in Redis carry
// the old separator, and a deploy that changed it would read every in-flight
// ledger as one unparsed class — the sync marker would stop being recognised and
// the reconciled difference would be counted as ordinary spend. Ledgers have to
// drain first.
const fieldSeparator = "|"

// ledgerField is one charge's place in the ledger: which slot of the window it
// landed in, which class spent it, and against which endpoint.
//
// The sync marker stands in for both class and endpoint, so the reconciled
// difference counts against the bucket without being attributed to a floor or an
// endpoint share that did not spend it.
type ledgerField struct {
	Slot     string
	Class    string
	Endpoint string
}

// IsSync reports whether this field holds the reconciled difference rather than
// spend one of our own callers made.
func (f ledgerField) IsSync() bool { return f.Class == SyncMember }

// String is the field as Redis stores it. It is the same grammar the Lua writes,
// and parseLedgerField is its inverse.
func (f ledgerField) String() string {
	return f.Slot + fieldSeparator + f.Class + fieldSeparator + f.Endpoint
}

// parseLedgerField splits a ledger field into its parts. ok is false for a field
// that does not carry the grammar at all, which a caller must not mistake for a
// field belonging to no class: an unparsed field is a fault, not a category.
//
// The endpoint takes whatever remains, separators included, so a pattern that
// ever contains one still round-trips.
func parseLedgerField(field string) (ledgerField, bool) {
	slot, rest, ok := strings.Cut(field, fieldSeparator)
	if !ok {
		return ledgerField{}, false
	}
	class, endpoint, ok := strings.Cut(rest, fieldSeparator)
	if !ok {
		return ledgerField{}, false
	}
	return ledgerField{Slot: slot, Class: class, Endpoint: endpoint}, true
}
