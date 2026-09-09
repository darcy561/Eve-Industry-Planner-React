package modelparity

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// Finding counts the documents a path was seen in, keyed by normalised path.
type Finding map[string]int

// Census is what one collection's sweep found.
type Census struct {
	Collection string
	Scanned    int
	Failed     int
	// DecodeErrors counts documents by the error text that rejected them.
	DecodeErrors Finding
	// Changed counts paths whose value differs after decode then encode.
	Changed Finding
	// Orphans counts paths held on disk that the model never writes back.
	Orphans Finding
}

// Clean reports whether the model both accepted and reproduced every document.
//
// Orphans are deliberately not part of this: a stored field the model dropped
// years ago is a cleanup, not a failure of the sweep.
func (c Census) Clean() bool { return c.Failed == 0 && len(c.Changed) == 0 }

func (f Finding) add(key string) { f[key] = f[key] + 1 }

// Sweep decodes every document in a collection into T, encodes it back, and
// records what the round trip did not preserve.
func Sweep[T any](ctx context.Context, coll *mongo.Collection, name string) (Census, error) {
	census := Census{
		Collection:   name,
		DecodeErrors: Finding{},
		Changed:      Finding{},
		Orphans:      Finding{},
	}
	if coll == nil {
		return census, fmt.Errorf("modelparity: %s: nil collection", name)
	}
	cursor, err := coll.Find(ctx, bson.D{})
	if err != nil {
		return census, fmt.Errorf("modelparity: find %s: %w", name, err)
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		census.Scanned++
		var stored bson.M
		if err := bson.Unmarshal(cursor.Current, &stored); err != nil {
			census.Failed++
			census.DecodeErrors.add(truncate(err.Error()))
			continue
		}
		var model T
		if err := cursor.Decode(&model); err != nil {
			census.Failed++
			census.DecodeErrors.add(truncate(err.Error()))
			continue
		}
		encoded, err := bson.Marshal(model)
		if err != nil {
			census.Failed++
			census.DecodeErrors.add(truncate(err.Error()))
			continue
		}
		var written bson.M
		if err := bson.Unmarshal(encoded, &written); err != nil {
			census.Failed++
			census.DecodeErrors.add(truncate(err.Error()))
			continue
		}
		Compare(Document(stored), Document(written), &census)
	}
	if err := cursor.Err(); err != nil {
		return census, fmt.Errorf("modelparity: iterate %s: %w", name, err)
	}
	return census, nil
}

// Compare walks a stored document against what the model would write back.
func Compare(stored, written bson.M, census *Census) {
	seen := map[string]bool{}
	compare(stored, written, "", census, seen)
}

func compare(stored, written bson.M, prefix string, census *Census, seen map[string]bool) {
	for key, storedValue := range stored {
		// The document key is Mongo's, not a model field: no model writes it and
		// reporting it once per collection only buries the real findings.
		if prefix == "" && key == "_id" {
			continue
		}
		path := key
		if prefix != "" {
			path = prefix + "." + key
		}
		normalised := NormalisePath(path)
		writtenValue, present := written[key]
		if !present {
			once(seen, "orphan:"+normalised, func() { census.Orphans.add(normalised) })
			continue
		}
		storedDoc, storedIsDoc := storedValue.(bson.M)
		writtenDoc, writtenIsDoc := writtenValue.(bson.M)
		if storedIsDoc && writtenIsDoc {
			compare(storedDoc, writtenDoc, path, census, seen)
			continue
		}
		storedArr, storedIsArr := storedValue.(bson.A)
		writtenArr, writtenIsArr := writtenValue.(bson.A)
		if storedIsArr && writtenIsArr {
			if len(storedArr) != len(writtenArr) {
				once(seen, "changed:"+normalised, func() { census.Changed.add(normalised + " (length)") })
				continue
			}
			for i := range storedArr {
				elemStored, ok1 := storedArr[i].(bson.M)
				elemWritten, ok2 := writtenArr[i].(bson.M)
				if ok1 && ok2 {
					compare(elemStored, elemWritten, path+"[]", census, seen)
					continue
				}
				if !equal(storedArr[i], writtenArr[i]) {
					once(seen, "changed:"+normalised, func() { census.Changed.add(normalised + "[]") })
				}
			}
			continue
		}
		if !equal(storedValue, writtenValue) {
			once(seen, "changed:"+normalised, func() { census.Changed.add(normalised) })
		}
	}
}

func once(seen map[string]bool, key string, record func()) {
	if seen[key] {
		return
	}
	seen[key] = true
	record()
}

// equal compares two stored values, treating the numeric BSON types as one.
//
// The corpus holds the same field as int32, int64 and double across documents —
// a value written before a field's Go type settled. The driver converts on the
// way in, so a type change alone is not a difference; a changed number is.
func equal(a, b any) bool {
	if left, ok := a.(bson.DateTime); ok {
		switch right := b.(type) {
		case bson.DateTime:
			return left == right
		case time.Time:
			return left.Time().UTC().Equal(right.UTC())
		}
	}
	if left, ok := numeric(a); ok {
		if right, ok := numeric(b); ok {
			return left == right
		}
	}
	return fmt.Sprintf("%v", a) == fmt.Sprintf("%v", b)
}

func numeric(v any) (float64, bool) {
	switch typed := v.(type) {
	case int32:
		return float64(typed), true
	case int64:
		return float64(typed), true
	case float64:
		return float64(typed), true
	}
	return 0, false
}

func truncate(s string) string {
	const limit = 160
	if len(s) <= limit {
		return s
	}
	return s[:limit]
}
