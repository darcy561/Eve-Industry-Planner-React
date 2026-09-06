package esiclient

// RepointForTest exposes the bucket-move rule to the package's external tests,
// so they exercise the rule the dispatcher uses rather than a copy of it.
func RepointForTest(r Reservation, to Bucket) Reservation { return repoint(r, to) }
