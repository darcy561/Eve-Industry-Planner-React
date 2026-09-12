package sde

import (
	"os"
	"regexp"
	"slices"
	"sort"
	"testing"
)

// spaKeysPath is the SPA's copy of the key set, read from the repo rather than
// restated here. The two lists are a wire contract across languages and a key on
// one side that the other does not serve throws only when something first reaches
// for it — which is how a key naming a file the server never published survived
// unnoticed.
const spaKeysPath = "../../../../frontend/src/Context/defaultValues.jsx"

var spaKeyBlock = regexp.MustCompile(`(?s)export const CACHED_DATA_FILES = \{(.*?)\}`)
var spaKeyEntry = regexp.MustCompile(`(\w+):\s*"(\w+)"`)

func TestSPAAndServerAgreeOnTheStaticDataKeys(t *testing.T) {
	source, err := os.ReadFile(spaKeysPath)
	if err != nil {
		t.Fatalf("reading the SPA key list: %v", err)
	}

	block := spaKeyBlock.FindSubmatch(source)
	if block == nil {
		t.Fatal("CACHED_DATA_FILES is no longer where this test looks for it")
	}

	var spa []string
	for _, entry := range spaKeyEntry.FindAllSubmatch(block[1], -1) {
		name, value := string(entry[1]), string(entry[2])
		if name != value {
			t.Errorf("%s is declared as %q; the key and its name must match", name, value)
		}
		spa = append(spa, name)
	}
	if len(spa) == 0 {
		t.Fatal("no keys found in CACHED_DATA_FILES")
	}

	served := OutputFilesByKey()
	for _, key := range spa {
		if _, ok := served[key]; !ok {
			t.Errorf("the SPA asks for %q, which the server does not serve", key)
		}
	}

	var missing []string
	for key := range served {
		if !slices.Contains(spa, key) {
			missing = append(missing, key)
		}
	}
	sort.Strings(missing)
	if len(missing) > 0 {
		t.Errorf("the server serves %v, which the SPA cannot name", missing)
	}
}
