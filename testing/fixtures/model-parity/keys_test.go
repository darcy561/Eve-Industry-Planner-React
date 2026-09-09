package modelparitykeys

import "testing"

func TestMatcherAcceptsInstanceKeys(t *testing.T) {
	matcher, err := Matcher()
	if err != nil {
		t.Fatalf("Matcher: %v", err)
	}
	for _, key := range []string{
		"34",
		"-1990041413",
		"job-05f22f4c-f504-b686-2833-294266e356f5",
		"41332276-a09b-9a6a-b1d6-10db2791cfff",
	} {
		if !matcher.MatchString(key) {
			t.Errorf("%q should be read as an instance key", key)
		}
	}
}

func TestMatcherRejectsFieldNames(t *testing.T) {
	matcher, err := Matcher()
	if err != nil {
		t.Fatalf("Matcher: %v", err)
	}
	for _, name := range []string{
		"schemaVersion",
		"apiJobs",
		"materialPriceOverrides",
		"extrasTotal",
		"_meta",
	} {
		if matcher.MatchString(name) {
			t.Errorf("%q is a field name, not an instance key", name)
		}
	}
}
