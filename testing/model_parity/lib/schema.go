package modelparity

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
)

// JSONPaths lists every dotted JSON path a model can emit.
//
// The SPA parity test needs this to tell a field the model simply left out under
// omitempty from one it has no field for at all. Both look identical in a single
// document; only the type says which is which.
func JSONPaths(t reflect.Type) []string {
	found := map[string]bool{}
	walkType(t, "", found, map[reflect.Type]bool{})
	paths := make([]string, 0, len(found))
	for path := range found {
		paths = append(paths, path)
	}
	sort.Strings(paths)
	return paths
}

func walkType(t reflect.Type, prefix string, found map[string]bool, active map[reflect.Type]bool) {
	for t.Kind() == reflect.Pointer {
		t = t.Elem()
	}
	if t.Kind() != reflect.Struct || active[t] {
		return
	}
	active[t] = true
	defer delete(active, t)

	for field := range t.Fields() {
		if !field.IsExported() {
			continue
		}
		name, ok := jsonName(field)
		if !ok {
			continue
		}
		if name == "" { // embedded, or ",inline": its fields sit at this level
			walkType(field.Type, prefix, found, active)
			continue
		}
		path := name
		if prefix != "" {
			path = prefix + "." + name
		}
		walkValue(field.Type, path, found, active)
	}
}

// walkValue records a path and descends into whatever the field holds.
func walkValue(t reflect.Type, path string, found map[string]bool, active map[reflect.Type]bool) {
	for t.Kind() == reflect.Pointer {
		t = t.Elem()
	}
	switch t.Kind() {
	case reflect.Slice, reflect.Array:
		found[path] = true
		walkValue(t.Elem(), path+"[]", found, active)
	case reflect.Map:
		found[path] = true
		walkValue(t.Elem(), path+".{id}", found, active)
	case reflect.Struct:
		found[path] = true
		walkType(t, path, found, active)
	default:
		found[path] = true
	}
}

// jsonName reads a field's JSON name. The second result is false when the field
// is never serialised.
func jsonName(field reflect.StructField) (string, bool) {
	tag, tagged := field.Tag.Lookup("json")
	if !tagged {
		if field.Anonymous {
			return "", true
		}
		return field.Name, true
	}
	name, _, hasOptions := strings.Cut(tag, ",")
	// `json:"-"` drops the field; `json:"-,"` keeps one literally named "-".
	if name == "-" && !hasOptions {
		return "", false
	}
	if name == "" && !field.Anonymous {
		// `json:",inline"` and friends on a named field still flatten it.
		return "", true
	}
	return name, true
}

// WriteSchema writes the model's JSON paths beside a corpus.
func WriteSchema(t reflect.Type, path string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("modelparity: schema dir: %w", err)
	}
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("modelparity: schema file: %w", err)
	}
	defer file.Close()
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(JSONPaths(t)); err != nil {
		return fmt.Errorf("modelparity: schema encode: %w", err)
	}
	return nil
}

// SchemaPathFor names the schema file that belongs to a corpus.
func SchemaPathFor(corpusPath string) string {
	ext := filepath.Ext(corpusPath)
	return strings.TrimSuffix(corpusPath, ext) + ".schema.json"
}
