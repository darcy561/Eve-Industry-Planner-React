// Package serviceboundaries guards the rule that each service under services/ is
// its own deployable: none of them may import another's packages, and nothing in
// services/shared/ may import a service.
//
// The rule is easy to break by accident — an editor offers the completion, the
// build succeeds, and nothing says otherwise until a change to one service
// silently alters another's behaviour or forces it to be built first. Code two
// services need belongs in services/shared/.
package serviceboundaries

import (
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

const modulePath = "eve-industry-planner"

// libraries are the directories under services/ that are not deployables:
// shared code and the one-off commands. Anything may import them, and they may
// import nothing that is a service.
var libraries = []string{"shared", "cmd"}

func TestNoServiceImportsAnotherService(t *testing.T) {
	root := servicesRoot(t)
	services := discoverServices(t, root)
	if len(services) < 2 {
		t.Fatalf("found %v under %s, expected the deployables", services, root)
	}
	t.Logf("guarding services %v, and %v against reaching back into them", services, libraries)

	// Shared code is scanned as well as the services. A shared package that
	// imports a service makes every consumer of it depend on that service, which
	// is the same coupling wearing a different label — and the one a scan of the
	// services alone cannot see.
	for _, area := range append(slices.Clone(services), libraries...) {
		dir := filepath.Join(root, area)
		if _, err := os.Stat(dir); err != nil {
			continue
		}
		isService := slices.Contains(services, area)

		for file, imports := range goFiles(t, dir) {
			for _, imported := range imports {
				owner, ok := serviceOwning(imported, services)
				if !ok || owner == area {
					continue
				}
				rel, _ := filepath.Rel(root, file)
				if isService {
					t.Errorf("%s imports %q — %s must not reach into %s; shared code belongs in services/shared/",
						rel, imported, area, owner)
					continue
				}
				t.Errorf("%s imports %q — services/%s is shared by every service and must not depend on %s",
					rel, imported, area, owner)
			}
		}
	}
}

// serviceOwning reports which service an import path belongs to, if any.
func serviceOwning(imported string, services []string) (string, bool) {
	rest, ok := strings.CutPrefix(imported, modulePath+"/")
	if !ok {
		return "", false
	}
	owner, _, _ := strings.Cut(rest, "/")
	if !slices.Contains(services, owner) {
		return "", false
	}
	return owner, true
}

func servicesRoot(t *testing.T) string {
	t.Helper()
	// This package lives at <repo>/testing/serviceboundaries.
	root, err := filepath.Abs(filepath.Join("..", "..", "services"))
	if err != nil {
		t.Fatalf("locate services: %v", err)
	}
	if _, err := os.Stat(root); err != nil {
		t.Fatalf("services directory not found at %s: %v", root, err)
	}
	return root
}

func discoverServices(t *testing.T, root string) []string {
	t.Helper()
	entries, err := os.ReadDir(root)
	if err != nil {
		t.Fatalf("read %s: %v", root, err)
	}
	var services []string
	for _, entry := range entries {
		if !entry.IsDir() || slices.Contains(libraries, entry.Name()) {
			continue
		}
		services = append(services, entry.Name())
	}
	slices.Sort(services)
	return services
}

// goFiles maps every Go file under dir to the packages it imports. Test files
// count: a test that reaches across the boundary couples the two as surely as a
// non-test file does.
func goFiles(t *testing.T, dir string) map[string][]string {
	t.Helper()
	out := map[string][]string{}
	fset := token.NewFileSet()

	err := filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() || !strings.HasSuffix(path, ".go") {
			return nil
		}
		// ImportsOnly still reads the whole import block, including files a build
		// tag would exclude — a crossing hidden behind a tag is still a crossing.
		parsed, err := parser.ParseFile(fset, path, nil, parser.ImportsOnly)
		if err != nil {
			return err
		}
		imports := make([]string, 0, len(parsed.Imports))
		for _, spec := range parsed.Imports {
			imports = append(imports, strings.Trim(spec.Path.Value, `"`))
		}
		out[path] = imports
		return nil
	})
	if err != nil {
		t.Fatalf("walk %s: %v", dir, err)
	}
	return out
}
