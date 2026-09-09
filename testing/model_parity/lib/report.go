package modelparity

import (
	"fmt"
	"io"
	"sort"
)

// Report renders one collection's census, densest finding first.
func Report(w io.Writer, census Census) {
	status := "OK"
	if !census.Clean() {
		status = "FAIL"
	}
	fmt.Fprintf(w, "\n%-28s %7d scanned  %5d rejected  %s\n", census.Collection, census.Scanned, census.Failed, status)
	section(w, "rejected by the model", census.DecodeErrors, census.Scanned)
	section(w, "value changed on round trip", census.Changed, census.Scanned)
	section(w, "on disk, never written back", census.Orphans, census.Scanned)
}

func section(w io.Writer, title string, finding Finding, scanned int) {
	if len(finding) == 0 {
		fmt.Fprintf(w, "  %s: none\n", title)
		return
	}
	fmt.Fprintf(w, "  %s: %d\n", title, len(finding))
	for _, key := range ranked(finding) {
		count := finding[key]
		fmt.Fprintf(w, "     %-52s %7d", key, count)
		if scanned > 0 {
			fmt.Fprintf(w, " (%5.1f%%)", 100*float64(count)/float64(scanned))
		}
		fmt.Fprintln(w)
	}
}

// ranked orders findings by how many documents carry them, then by path so a
// run is comparable with the one before it.
func ranked(finding Finding) []string {
	keys := make([]string, 0, len(finding))
	for key := range finding {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(i, j int) bool {
		if finding[keys[i]] != finding[keys[j]] {
			return finding[keys[i]] > finding[keys[j]]
		}
		return keys[i] < keys[j]
	})
	return keys
}
