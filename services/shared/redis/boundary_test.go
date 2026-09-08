package redis_test

import (
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

// Every namespace reaches Redis through the handle, so the driver is imported in
// one place. The exceptions are named here rather than left implicit: a new one
// is a decision, not an oversight.
var driverExceptions = map[string]string{
	"capacity-controller/runtime.go": "asynq builds its own client from its own options struct",
}

func TestOnlyThisPackageImportsTheDriver(t *testing.T) {
	root, err := filepath.Abs("../..")
	if err != nil {
		t.Fatalf("resolve services root: %v", err)
	}

	var offenders []string
	err = filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() || !strings.HasSuffix(path, ".go") {
			return err
		}
		if strings.HasSuffix(path, "_test.go") {
			return nil
		}

		rel, rerr := filepath.Rel(root, path)
		if rerr != nil {
			return rerr
		}
		rel = filepath.ToSlash(rel)

		// The handle owns the driver.
		if strings.HasPrefix(rel, "shared/redis/") {
			return nil
		}
		if _, allowed := driverExceptions[rel]; allowed {
			return nil
		}

		file, perr := parser.ParseFile(token.NewFileSet(), path, nil, parser.ImportsOnly)
		if perr != nil {
			return nil // a file that does not parse is not this test's problem
		}
		for _, imp := range file.Imports {
			p, uerr := strconv.Unquote(imp.Path.Value)
			if uerr == nil && strings.HasPrefix(p, "github.com/redis/go-redis/") {
				offenders = append(offenders, rel)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatalf("walk: %v", err)
	}

	for _, rel := range offenders {
		t.Errorf("%s imports the Redis driver; use the handle, or add it to driverExceptions with a reason", rel)
	}
}

// An exception that no longer applies is as much a problem as a missing one.
func TestEveryDriverExceptionStillExists(t *testing.T) {
	root, err := filepath.Abs("../..")
	if err != nil {
		t.Fatalf("resolve services root: %v", err)
	}
	for rel, why := range driverExceptions {
		if _, err := os.Stat(filepath.Join(root, filepath.FromSlash(rel))); err != nil {
			t.Errorf("driverExceptions names %s (%s), which no longer exists", rel, why)
		}
	}
}
