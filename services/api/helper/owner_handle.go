package helper

import (
	"fmt"
	"strconv"
	"strings"

	"eve-industry-planner/shared/crypto/entityid"
	"eve-industry-planner/shared/models"
)

// OwnerHandle renders an owner as the `kind:id` a client sees, with the entity
// kinds carrying the raw EVE id rather than the ref they are stored under.
func OwnerHandle(owner models.Owner, cipher *entityid.Cipher) (string, error) {
	kind, isEntity := entityRefKind(owner.Kind)
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
func ParseOwnerHandle(handle string, cipher *entityid.Cipher) (models.Owner, error) {
	kindPart, id, found := strings.Cut(handle, ":")
	if !found {
		return models.Owner{}, fmt.Errorf("owner handle %q must be kind:id", handle)
	}
	if id == "" {
		return models.Owner{}, fmt.Errorf("owner handle %q names no owner", handle)
	}
	ownerKind := models.OwnerKind(kindPart)

	refKind, isEntity := entityRefKind(ownerKind)
	if !isEntity {
		return models.Owner{Kind: ownerKind, ID: id}, nil
	}
	if cipher == nil {
		return models.Owner{}, fmt.Errorf("owner handle %q needs an entity cipher", handle)
	}
	entityID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return models.Owner{}, fmt.Errorf("owner handle %q: %s id must be a number", handle, ownerKind)
	}
	ref, err := cipher.Encrypt(refKind, entityID)
	if err != nil {
		return models.Owner{}, fmt.Errorf("owner handle %q: %w", handle, err)
	}
	return models.Owner{Kind: ownerKind, ID: ref}, nil
}

func entityRefKind(kind models.OwnerKind) (string, bool) {
	switch kind {
	case models.OwnerCorporation:
		return entityid.KindCorp, true
	case models.OwnerAlliance:
		return entityid.KindAlliance, true
	default:
		return "", false
	}
}
