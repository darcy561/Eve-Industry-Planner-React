package planner

import (
	"maps"
	"slices"
	"time"

	"eve-industry-planner/shared/models"
)

// Settings is the settings a planner's work is done under, as opposed to the
// settings that decide how one account sees its own screen.
//
// A setting belongs here when a job or a setup stores a reference to it, or when
// it decides how work is done in the planner. `CustomStructureID` on every setup
// is the case that forced the split: it is a key into a settings document, so a
// member opening another's job resolves it against their own and finds nothing.
//
// Its _id is the owner key, as the planner document's is, so the owner is stored
// once rather than beside a copy of itself.
type Settings struct {
	ID            string `bson:"_id" json:"-"`
	SchemaVersion int    `bson:"schemaVersion,omitempty" json:"schemaVersion,omitempty"`

	CustomStructures               models.CustomStructures       `bson:"customStructures" json:"customStructures"`
	DefaultMaterialEfficiencyValue int                           `bson:"defaultMaterialEfficiencyValue" json:"defaultMaterialEfficiencyValue"`
	PredefinedSystemIndexes        map[string]map[string]float64 `bson:"predefinedSystemIndexes" json:"predefinedSystemIndexes,omitempty"`
	ExtrasCategories               []models.ExtraCategory        `bson:"extrasCategories" json:"extrasCategories,omitempty"`
	DefaultCitadelBrokersFee       float64                       `bson:"defaultCitadelBrokersFee" json:"defaultCitadelBrokersFee"`
	ReprocessingSettings           models.ReprocessingSettings   `bson:"reprocessingSettings" json:"reprocessingSettings"`
	ExemptTypeIDs                  []int                         `bson:"exemptTypeIDs" json:"exemptTypeIDs,omitempty"`

	MetaData models.MetaData `bson:"_meta" json:"_meta"`
}

// Owner reads the settings' owner back out of its id.
func (s Settings) Owner() (models.Owner, error) { return models.ParseOwnerKey(s.ID) }

// DefaultSettings returns the settings a planner starts with when nothing seeds
// it from an account.
func DefaultSettings(owner models.Owner, now time.Time) Settings {
	return Settings{
		ID:                             owner.Key(),
		SchemaVersion:                  SettingsSchemaCurrent,
		CustomStructures:               models.EmptyCustomStructures(),
		DefaultMaterialEfficiencyValue: 0,
		PredefinedSystemIndexes:        make(map[string]map[string]float64),
		ExtrasCategories:               models.DefaultExtrasCategories(),
		DefaultCitadelBrokersFee:       1,
		ReprocessingSettings:           models.DefaultReprocessingSettings(),
		ExemptTypeIDs:                  []int{},
		MetaData: models.MetaData{
			LastModified: now,
			Owner:        owner,
		},
	}
}

// SettingsFromAccount seeds a planner's settings from an account's, so a planner
// behaves as the account that created it expects.
//
// The account-side fields are not read: they stay on the account document and
// keep deciding how that person sees their own screen, wherever they are working.
func SettingsFromAccount(owner models.Owner, settings models.ApplicationSettings, now time.Time) Settings {
	seeded := DefaultSettings(owner, now)
	seeded.DefaultMaterialEfficiencyValue = settings.DefaultMaterialEfficiencyValue
	seeded.DefaultCitadelBrokersFee = settings.DefaultCitadelBrokersFee
	seeded.ReprocessingSettings = settings.ReprocessingSettings
	// Copied rather than assigned: the account's own settings are live in the
	// caller, and a shared slice or map would make an edit to one show up in the
	// other.
	seeded.CustomStructures = models.CustomStructures{
		Manufacturing: slices.Clone(settings.CustomStructures.Manufacturing),
		Reaction:      slices.Clone(settings.CustomStructures.Reaction),
		Reprocessing:  slices.Clone(settings.CustomStructures.Reprocessing),
		Invention:     slices.Clone(settings.CustomStructures.Invention),
	}
	if settings.PredefinedSystemIndexes != nil {
		indexes := make(map[string]map[string]float64, len(settings.PredefinedSystemIndexes))
		for system, byJobType := range settings.PredefinedSystemIndexes {
			indexes[system] = maps.Clone(byJobType)
		}
		seeded.PredefinedSystemIndexes = indexes
	}
	if settings.ExtrasCategories != nil {
		seeded.ExtrasCategories = slices.Clone(settings.ExtrasCategories)
	}
	if settings.ExemptTypeIDs != nil {
		seeded.ExemptTypeIDs = slices.Clone(settings.ExemptTypeIDs)
	}
	return seeded
}
