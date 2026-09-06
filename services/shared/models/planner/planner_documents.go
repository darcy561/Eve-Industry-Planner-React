package planner

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"eve-industry-planner/shared/models"
)

// Planner is a working area that jobs, groups and their archive belong to.
//
// Its _id is the owner key, so the owner is stored once rather than beside a
// duplicate of itself — the pattern the rebuild queue already uses when it parses
// an owner out of a document id.
//
// An owner key is not serialisable to a client: for the corporation and alliance
// kinds it contains a ref. The id fields therefore carry `json:"-"`, and a
// response emits the owner handle instead, converting at the same last hop as
// every other ref.
type Planner struct {
	ID            string          `bson:"_id" json:"-"`
	SchemaVersion int             `bson:"schemaVersion,omitempty" json:"schemaVersion,omitempty"`
	Name          string          `bson:"name" json:"name"`
	MemberCount   int             `bson:"memberCount" json:"memberCount"`
	AccessModels  []string        `bson:"accessModels,omitempty" json:"accessModels,omitempty"`
	CreatedBy     string          `bson:"createdBy" json:"-"`
	MetaData      models.MetaData `bson:"_meta" json:"_meta"`
}

// Owner reads the planner's owner back out of its id.
func (p Planner) Owner() (models.Owner, error) { return models.ParseOwnerKey(p.ID) }

// Shared reports whether more than one account is in the planner.
//
// Reads MemberCount, which is written once at creation and not yet maintained:
// nothing updates it when a membership row is added or removed. Until something
// does — or until it is derived from the rows, which cannot disagree with them —
// this answers for a planner that has never gained a member. Do not put it on a
// wire or in front of a user.
func (p Planner) Shared() bool { return p.MemberCount > 1 }

// MembershipID is the composite `_id` of a membership row, which gives one
// row per account per planner without needing a unique index.
//
// The separator is safe because nothing either side can contain it: an account id
// is stripped to alphanumerics, an entity ref is base64url, and a minted planner
// id is a UUID. The owner key's own colon is therefore the only separator inside
// the left half.
func MembershipID(plannerID, accountID string) string {
	return plannerID + membershipIDSeparator + accountID
}

const membershipIDSeparator = "|"

// SplitMembershipID recovers the planner id and account id from a row id.
//
// The planner id is everything before the last separator, not the first: an owner
// key leads with `kind:`, and only the account id is guaranteed to hold no
// separator of its own.
func SplitMembershipID(id string) (plannerID, accountID string, ok bool) {
	cut := strings.LastIndex(id, membershipIDSeparator)
	if cut <= 0 || cut == len(id)-1 {
		return "", "", false
	}
	return id[:cut], id[cut+1:], true
}

// Membership puts one account in one planner, and is the only thing that
// grants access to one: nothing above it asks how the row came to exist.
type Membership struct {
	ID            string          `bson:"_id" json:"-"`
	SchemaVersion int             `bson:"schemaVersion,omitempty" json:"schemaVersion,omitempty"`
	PlannerID     string          `bson:"plannerID" json:"-"`
	AccountID     string          `bson:"accountID" json:"-"`
	JoinedAt      time.Time       `bson:"joinedAt" json:"joinedAt"`
	JoinMethod    JoinMethod      `bson:"joinMethod" json:"joinMethod"`
	MetaData      models.MetaData `bson:"_meta" json:"_meta"`
}

// JoinMethod is why an account is a member. The branch that is set is the
// method, and exactly one is populated.
//
// The branches name the reason rather than where the answer came from: a member
// of a corporation is a member because they are in it, not because ESI is how we
// learned so. Two of them are kept in step with EVE, so a reconcile writes and
// removes them as an account's affiliations change.
//
// No tag beside the branch: a stored tag and a stored branch encode the same
// fact, and two copies of one fact can disagree.
type JoinMethod struct {
	Owner      *OwnerAccount     `bson:"owner,omitempty" json:"owner,omitempty"`
	Invite     *InviteRedemption `bson:"invite,omitempty" json:"invite,omitempty"`
	Membership *EntityMember     `bson:"entityMember,omitempty" json:"entityMember,omitempty"`
	AccessList *AccessListEntry  `bson:"accessList,omitempty" json:"accessList,omitempty"`
}

// JoinKind names the branch a membership came in on, for logging and display. It
// is derived rather than stored: a stored tag beside a stored branch is two copies
// of one fact.
type JoinKind string

const (
	JoinKindOwner      JoinKind = "owner"
	JoinKindInvite     JoinKind = "invite"
	JoinKindMember     JoinKind = "entityMember"
	JoinKindAccessList JoinKind = "accessList"
)

// Kind reports which branch is populated, or the empty kind when none is.
func (j JoinMethod) Kind() JoinKind {
	switch {
	case j.Owner != nil:
		return JoinKindOwner
	case j.Invite != nil:
		return JoinKindInvite
	case j.Membership != nil:
		return JoinKindMember
	case j.AccessList != nil:
		return JoinKindAccessList
	default:
		return ""
	}
}

// Validate reports whether exactly one branch is set.
//
// Checked on write rather than made impossible by the type: Go has no sum type,
// and a struct of pointers is the shape that stores and queries cleanly.
func (j JoinMethod) Validate() error {
	set := 0
	for _, populated := range []bool{
		j.Owner != nil, j.Invite != nil, j.Membership != nil, j.AccessList != nil,
	} {
		if populated {
			set++
		}
	}
	switch set {
	case 1:
		return nil
	case 0:
		return errors.New("membership names no join method")
	default:
		return fmt.Errorf("membership names %d join methods, want exactly one", set)
	}
}

// OwnerAccount is the account whose planner this is, which it did not join so
// much as have. There is exactly one such row per account planner and nothing
// can revoke it.
type OwnerAccount struct{}

// InviteRedemption records the invite an account came in on. None of it leaves
// the server: who invited them is not the joiner's business to publish.
type InviteRedemption struct {
	InvitedBy string    `bson:"invitedBy" json:"-"`
	IssuedAt  time.Time `bson:"issuedAt" json:"-"`
	InviteID  string    `bson:"inviteID,omitempty" json:"-"`
}

// EntityMember records membership that follows from being in the corporation or
// alliance the planner belongs to.
type EntityMember struct {
	EntityRef     string `bson:"entityRef" json:"-"`
	CharacterHash string `bson:"characterHash,omitempty" json:"-"`
}

// AccessListEntry records membership that follows an in-game access list.
//
// Unlike EntityMember it is polled from one managing character's token rather
// than reconciled from each member's own, so it stops being updated for reasons
// that have nothing to do with the member: the managing character can lose the
// scope, leave, or unlink.
type AccessListEntry struct {
	ListID    string `bson:"listID" json:"-"`
	EntityRef string `bson:"entityRef,omitempty" json:"-"`
}

// Invite is one outstanding invitation into a planner.
//
// The hash, the binding and the creator never leave the server. An invite grants
// membership and nothing more, so it carries no role.
//
// Invites are not kept: a TTL index on ExpiresAt clears expired ones, and one
// that is spent or revoked is deleted — what the membership needed from it was
// copied at join time.
type Invite struct {
	ID             string     `bson:"_id" json:"id"`
	SchemaVersion  int        `bson:"schemaVersion,omitempty" json:"schemaVersion,omitempty"`
	PlannerID      string     `bson:"plannerID" json:"-"`
	TokenHash      []byte     `bson:"tokenHash" json:"-"`
	BoundAccountID string     `bson:"boundAccountID,omitempty" json:"-"`
	MaxUses        int        `bson:"maxUses" json:"maxUses"`
	Uses           int        `bson:"uses" json:"uses"`
	ExpiresAt      time.Time  `bson:"expiresAt" json:"expiresAt"`
	RevokedAt      *time.Time `bson:"revokedAt,omitempty" json:"revokedAt,omitempty"`
	CreatedBy      string     `bson:"createdBy" json:"-"`
}

// Schema versions for the planner documents. They live beside the types they
// version rather than in the parent package's block: a constant away from its
// type is one an added field can be forgotten beside.
const (
	SchemaCurrent           = 1
	MembershipSchemaCurrent = 1
	SettingsSchemaCurrent   = 1
)
