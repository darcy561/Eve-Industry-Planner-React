package modelparity

import (
	"strings"

	modelparitykeys "eve-industry-planner/testing/fixtures/model-parity"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// NormalisePath rewrites instance keys in a dotted path to {id}, so a map-valued
// field is one row in the census rather than one row per stored key.
//
// Run rejects a fixture that will not load before any sweep starts, so the
// unchanged path here is the unreachable case rather than a silent degradation.
func NormalisePath(path string) string {
	matcher, err := modelparitykeys.Matcher()
	if err != nil {
		return path
	}
	segments := strings.Split(path, ".")
	for i, segment := range segments {
		trimmed := strings.TrimSuffix(segment, "[]")
		if !matcher.MatchString(trimmed) {
			continue
		}
		if trimmed != segment {
			segments[i] = "{id}[]"
			continue
		}
		segments[i] = "{id}"
	}
	return strings.Join(segments, ".")
}

// asMap rewrites bson.D subdocuments as bson.M all the way down.
//
// Unmarshalling into bson.M yields bson.D for nested documents, so the two sides
// of a comparison have different Go types for the same shape unless both are put
// through this first.
func asMap(value any) any {
	switch typed := value.(type) {
	case bson.D:
		out := bson.M{}
		for _, element := range typed {
			out[element.Key] = asMap(element.Value)
		}
		return out
	case bson.M:
		out := bson.M{}
		for key, inner := range typed {
			out[key] = asMap(inner)
		}
		return out
	case bson.A:
		out := make(bson.A, len(typed))
		for i := range typed {
			out[i] = asMap(typed[i])
		}
		return out
	case []any:
		out := make(bson.A, len(typed))
		for i := range typed {
			out[i] = asMap(typed[i])
		}
		return out
	}
	return value
}

// Document normalises a raw document into a bson.M tree ready to compare.
func Document(raw bson.M) bson.M {
	normalised, _ := asMap(raw).(bson.M)
	return normalised
}
