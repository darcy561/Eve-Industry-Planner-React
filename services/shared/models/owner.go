package models

import (
	"fmt"
	"slices"
	"strconv"
	"strings"

	"eve-industry-planner/shared/crypto/entityid"
)

// OwnerKind names what a stored document belongs to.
//
// A corporation is a peer of an account rather than a slice of one: it holds its
// own jobs and its own archive. Anything keyed on an owner therefore takes the
// kind alongside the id.
type OwnerKind string

const (
	OwnerAccount     OwnerKind = "account"
	OwnerPlanner     OwnerKind = "planner"
	OwnerCorporation OwnerKind = "corporation"
	OwnerAlliance    OwnerKind = "alliance"
)

// Owner addresses whatever a document belongs to.
//
// ID is whatever identifies the kind internally: an account id for an account, a
// minted id for a planner, and a ref for a corporation or alliance, which are
// never held as raw entity ids. Nothing here converts between the two.
//
// No JSON tags, deliberately. For the corporation and alliance kinds the ID is a
// ref, so a response serialising an owner directly would leak one; a response
// builds an owner handle explicitly instead, which turns a missed conversion into
// a compile error rather than a leak.
type Owner struct {
	Kind OwnerKind `bson:"kind"`
	ID   string    `bson:"id"`
}

// AccountOwner addresses what an account owns.
//
// The id is trimmed: an owner is a storage key, and " acct" keying documents
// apart from "acct" is a fault nothing downstream could detect.
func AccountOwner(accountID string) Owner {
	return Owner{Kind: OwnerAccount, ID: strings.TrimSpace(accountID)}
}

// PlannerOwner addresses what a custom planner owns, given its id.
//
// The id is minted when the planner is created and belongs to no EVE entity,
// which is what makes this the one kind whose roster is decided by invites.
func PlannerOwner(plannerID string) Owner {
	return Owner{Kind: OwnerPlanner, ID: strings.TrimSpace(plannerID)}
}

// CorporationOwner addresses what a corporation owns, given its ref.
//
// A raw EVE id yields a zero owner, so a caller that has not converted fails
// where it is used rather than routing on an id that means something else.
func CorporationOwner(corporationRef string) Owner {
	return orgOwner(OwnerCorporation, corporationRef)
}

// AllianceOwner addresses what an alliance owns, given its ref.
func AllianceOwner(allianceRef string) Owner {
	return orgOwner(OwnerAlliance, allianceRef)
}

func orgOwner(kind OwnerKind, ref string) Owner {
	owner := Owner{Kind: kind, ID: strings.TrimSpace(ref)}
	if owner.Validate() != nil {
		return Owner{}
	}
	return owner
}

// Key identifies the owner in a single string, for a document id or a
// deduplication token.
//
// A zero owner renders ":", which addresses nothing. Callers that build a key
// from an unvalidated id must check IsZero rather than index on the result.
func (o Owner) Key() string {
	return string(o.Kind) + ":" + o.ID
}

// ParseOwnerKey reads back what Key wrote.
//
// The id may itself contain a colon, so only the first separates kind from id.
func ParseOwnerKey(key string) (Owner, error) {
	kind, id, found := strings.Cut(key, ":")
	if !found {
		return Owner{}, fmt.Errorf("owner key %q must be kind:id", key)
	}
	owner := Owner{Kind: OwnerKind(kind), ID: id}
	if err := owner.Validate(); err != nil {
		return Owner{}, err
	}
	return owner, nil
}

// Validate reports whether the owner names something that can own a document.
//
// An unknown kind is refused rather than carried: a kind reaching storage that
// nothing knows how to read would key documents nothing can find again.
func (o Owner) Validate() error {
	switch o.Kind {
	case OwnerAccount, OwnerPlanner, OwnerCorporation, OwnerAlliance:
	default:
		return fmt.Errorf("unknown owner kind %q", o.Kind)
	}
	if strings.TrimSpace(o.ID) == "" {
		return fmt.Errorf("owner of kind %q needs an id", o.Kind)
	}
	// The org kinds hold a ref, never a raw EVE id. Checked here rather than only
	// at construction, so an owner read back from storage is held to it too.
	if want, ok := orgEntityKind(o.Kind); ok {
		kind, parsed := entityid.ParseKind(o.ID)
		if !parsed || kind != want || !entityid.ValidShape(o.ID) {
			return fmt.Errorf("owner of kind %q needs a %s ref, got %q", o.Kind, want, o.ID)
		}
	}
	return nil
}

// AdmitsByInvite reports whether a planner of this kind takes members through an
// invite.
//
// Only a custom planner does. An account planner has one member it did not join
// so much as have, and a corporation or alliance planner's roster follows the
// entity itself — an invite-provider row beside those would survive a reconcile
// that no longer sees the account, granting access the game has taken away.
func (o Owner) AdmitsByInvite() bool { return o.Kind == OwnerPlanner }

// orgEntityKind maps an org owner kind to the entity ref kind its id must be.
func orgEntityKind(kind OwnerKind) (string, bool) {
	switch kind {
	case OwnerCorporation:
		return entityid.KindCorp, true
	case OwnerAlliance:
		return entityid.KindAlliance, true
	default:
		return "", false
	}
}

// OwnerKeys is a set of owners held as their keys: a session's grant ceiling, the
// owners one connection receives changes for, or the owners a client asked for.
// They are the same set asked different questions, so the operations live here
// rather than being rewritten per caller.
//
// Order is the caller's: the set is built by appending, and Normalized is what
// sorts and deduplicates when a stable form is wanted.
type OwnerKeys []string

// NewOwnerKeys starts an empty set, for building one by Add or AddRefs.
func NewOwnerKeys() OwnerKeys { return nil }

// Has reports whether the owner is in the set.
func (k OwnerKeys) Has(owner Owner) bool {
	if owner.IsZero() {
		return false
	}
	return slices.Contains(k, owner.Key())
}

// IDsForKind returns the ids of one kind, which for the org kinds are refs.
func (k OwnerKeys) IDsForKind(kind OwnerKind) []string {
	var out []string
	for _, key := range k {
		owner, err := ParseOwnerKey(key)
		if err != nil || owner.Kind != kind {
			continue
		}
		out = append(out, owner.ID)
	}
	return out
}

// Add appends owners as keys, skipping any the vocabulary refuses rather than
// storing a key nothing can parse.
func (k OwnerKeys) Add(owners ...Owner) OwnerKeys {
	for _, owner := range owners {
		if owner.Validate() != nil {
			continue
		}
		k = append(k, owner.Key())
	}
	return k
}

// AddRefs appends refs of one kind as keys, on the same terms as Add.
func (k OwnerKeys) AddRefs(kind OwnerKind, refs []string) OwnerKeys {
	for _, ref := range refs {
		k = k.Add(Owner{Kind: kind, ID: strings.TrimSpace(ref)})
	}
	return k
}

// Within returns the keys of k that ceiling also holds.
//
// An empty ceiling permits nothing: a session holding no grants can reach no
// owner, so an empty ceiling must never read as "unrestricted".
func (k OwnerKeys) Within(ceiling OwnerKeys) OwnerKeys {
	if len(ceiling) == 0 {
		return nil
	}
	allowed := ceiling.set()
	var out OwnerKeys
	for _, raw := range k {
		key := strings.TrimSpace(raw)
		if key == "" {
			continue
		}
		if _, ok := allowed[key]; ok {
			out = append(out, key)
		}
	}
	return out
}

// Union returns k followed by any of added it does not already hold, so a caller
// widening a set does not drop what it started with.
func (k OwnerKeys) Union(added OwnerKeys) OwnerKeys {
	seen := k.set()
	out := append(OwnerKeys(nil), k...)
	for _, raw := range added {
		key := strings.TrimSpace(raw)
		if key == "" {
			continue
		}
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, key)
	}
	return out
}

// Normalized returns the set trimmed, deduplicated and sorted, which is the form
// stored and compared.
func (k OwnerKeys) Normalized() OwnerKeys {
	if len(k) == 0 {
		return OwnerKeys{}
	}
	seen := k.set()
	out := make(OwnerKeys, 0, len(seen))
	for key := range seen {
		out = append(out, key)
	}
	slices.Sort(out)
	return out
}

// Each visits every key that names something, so callers indexing on a key do
// not each repeat the empty check.
func (k OwnerKeys) Each(visit func(key string)) {
	for _, raw := range k {
		if key := strings.TrimSpace(raw); key != "" {
			visit(key)
		}
	}
}

func (k OwnerKeys) set() map[string]struct{} {
	out := make(map[string]struct{}, len(k))
	k.Each(func(key string) { out[key] = struct{}{} })
	return out
}

// IsZero reports whether the owner is unset.
func (o Owner) IsZero() bool { return o == Owner{} }

// EVE reserves 1,000,000–1,999,999 for NPC corporations, and nothing else uses
// that range.
//
// https://developers.eveonline.com/docs/guides/id-ranges/
const (
	npcCorporationIDMin = 1_000_000
	npcCorporationIDMax = 1_999_999
)

// IsNPCCorporation reports whether a corporation id names one of EVE's own
// corporations rather than a player's.
//
// Read from the id rather than from the `npc_corporation` field of the public
// corporation endpoint, because the callers that need this have the id and not
// the document — asking would put an ESI request on a path that has none. The
// range is exact for the question asked: every NPC corporation is inside it and
// nothing else is.
//
// It answers only that question. The id ranges do not support the inverse:
// corporations created before 2010-11-03 share 100,000,000–2,099,999,999 with
// characters and alliances, so "not an NPC corporation" is not the same as "a
// player corporation" and this must not be read as one.
func IsNPCCorporation(corporationID int64) bool {
	return corporationID >= npcCorporationIDMin && corporationID <= npcCorporationIDMax
}

// OwnerHandle renders an owner as the `kind:id` a client sees, with the entity
// kinds carrying the raw EVE id rather than the ref they are stored under.
func OwnerHandle(owner Owner, cipher *entityid.Cipher) (string, error) {
	kind, isEntity := orgEntityKind(owner.Kind)
	if !isEntity {
		return owner.Key(), nil
	}
	if cipher == nil {
		return "", fmt.Errorf("owner handle for %q needs an entity cipher", owner.Kind)
	}
	id, err := cipher.DecryptKind(kind, owner.ID)
	if err != nil {
		return "", fmt.Errorf("owner handle for %q: %w", owner.Kind, err)
	}
	return string(owner.Kind) + ":" + strconv.FormatInt(id, 10), nil
}

// ParseOwnerHandle reads the `kind:id` a client sent back, re-encrypting an
// entity id to the ref its owner is stored under.
//
// Only the first colon separates the two: an account id may contain one.
func ParseOwnerHandle(handle string, cipher *entityid.Cipher) (Owner, error) {
	kindPart, id, found := strings.Cut(handle, ":")
	if !found {
		return Owner{}, fmt.Errorf("owner handle %q must be kind:id", handle)
	}
	if id == "" {
		return Owner{}, fmt.Errorf("owner handle %q names no owner", handle)
	}
	kind := OwnerKind(kindPart)

	refKind, isEntity := orgEntityKind(kind)
	if !isEntity {
		owner := Owner{Kind: kind, ID: id}
		if err := owner.Validate(); err != nil {
			return Owner{}, err
		}
		return owner, nil
	}
	if cipher == nil {
		return Owner{}, fmt.Errorf("owner handle %q needs an entity cipher", handle)
	}
	entityID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return Owner{}, fmt.Errorf("owner handle %q: %s id must be a number", handle, kind)
	}
	ref, err := cipher.Encrypt(refKind, entityID)
	if err != nil {
		return Owner{}, fmt.Errorf("owner handle %q: %w", handle, err)
	}
	owner := Owner{Kind: kind, ID: ref}
	if err := owner.Validate(); err != nil {
		return Owner{}, err
	}
	return owner, nil
}
