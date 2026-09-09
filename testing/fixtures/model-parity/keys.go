// Package modelparitykeys reads the instance-key shapes both parity sweeps use.
//
// The shapes live in JSON beside this file because the SPA parity test reads the
// same list: a key shape added in Go alone would leave the two sides counting
// different things without either failing.
package modelparitykeys

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"sync"
)

//go:embed instance-keys.json
var raw []byte

type file struct {
	Patterns []struct {
		Shape string `json:"shape"`
	} `json:"patterns"`
}

var (
	once     sync.Once
	compiled *regexp.Regexp
	loadErr  error
)

// Matcher reports whether a single path segment names an instance.
//
// The shapes are embedded rather than read from disk: the sweep runs as a binary
// mounted into a container, where the repository is not present.
func Matcher() (*regexp.Regexp, error) {
	once.Do(func() {
		var parsed file
		if err := json.Unmarshal(raw, &parsed); err != nil {
			loadErr = fmt.Errorf("modelparitykeys: parse instance-keys.json: %w", err)
			return
		}
		if len(parsed.Patterns) == 0 {
			loadErr = fmt.Errorf("modelparitykeys: instance-keys.json lists no patterns")
			return
		}
		shapes := make([]string, 0, len(parsed.Patterns))
		for _, pattern := range parsed.Patterns {
			shapes = append(shapes, pattern.Shape)
		}
		compiled, loadErr = regexp.Compile("^(" + strings.Join(shapes, "|") + ")$")
	})
	return compiled, loadErr
}
