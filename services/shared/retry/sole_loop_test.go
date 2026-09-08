package retry_test

import (
	"go/ast"
	"go/parser"
	"go/token"
	"io/fs"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

// waitsOnATimer reports whether fn contains a wait on a timer channel —
// time.After, time.NewTimer or time.Tick in a select or receive, or time.Sleep.
// A backoff loop cannot be written without one.
func waitsOnATimer(fn ast.Node) bool {
	found := false
	ast.Inspect(fn, func(n ast.Node) bool {
		call, ok := n.(*ast.CallExpr)
		if !ok {
			return true
		}
		sel, ok := call.Fun.(*ast.SelectorExpr)
		if !ok {
			return true
		}
		pkg, ok := sel.X.(*ast.Ident)
		if !ok || pkg.Name != "time" {
			return true
		}
		switch sel.Sel.Name {
		case "After", "NewTimer", "Tick", "Sleep":
			found = true
			return false
		}
		return true
	})
	return found
}

// delegatesToTheEngine reports whether n calls retry.Do — a loop around the
// engine is scheduling repeated work, not hand-rolling backoff.
func delegatesToTheEngine(n ast.Node) bool {
	found := false
	ast.Inspect(n, func(n ast.Node) bool {
		call, ok := n.(*ast.CallExpr)
		if !ok {
			return true
		}
		if sel, ok := call.Fun.(*ast.SelectorExpr); ok && sel.Sel.Name == "Do" {
			if pkg, ok := sel.X.(*ast.Ident); ok && pkg.Name == "retry" {
				found = true
				return false
			}
		}
		return true
	})
	return found
}

// countsAttempts reports whether the loop bounds itself by an attempt count:
// a condition or body comparing an identifier named for attempts or retries.
// That plus a timer wait is a backoff loop, whatever it is called.
func countsAttempts(loop ast.Node) bool {
	named := func(n ast.Node) bool {
		id, ok := n.(*ast.Ident)
		if !ok {
			return false
		}
		name := strings.ToLower(id.Name)
		for _, want := range []string{"attempt", "retry", "retries", "tries"} {
			if strings.Contains(name, want) {
				return true
			}
		}
		return false
	}

	found := false
	ast.Inspect(loop, func(n ast.Node) bool {
		switch e := n.(type) {
		case *ast.BinaryExpr:
			switch e.Op {
			case token.LSS, token.LEQ, token.GTR, token.GEQ, token.EQL, token.NEQ:
				if named(e.X) || named(e.Y) {
					found = true
					return false
				}
			}
		case *ast.RangeStmt:
			if named(e.X) {
				found = true
				return false
			}
		}
		return true
	})
	return found
}

// retriesInALoop reports whether fn loops over attempts and waits between them.
func retriesInALoop(fset *token.FileSet, fn *ast.FuncDecl) (line int, ok bool) {
	var hit int
	ast.Inspect(fn.Body, func(n ast.Node) bool {
		if hit != 0 {
			return false
		}
		switch loop := n.(type) {
		case *ast.ForStmt:
			if delegatesToTheEngine(loop) {
				return false
			}
			if waitsOnATimer(loop) && countsAttempts(loop) {
				hit = fset.Position(loop.Pos()).Line
				return false
			}
		case *ast.RangeStmt:
			if delegatesToTheEngine(loop) {
				return false
			}
			if waitsOnATimer(loop) && countsAttempts(loop) {
				hit = fset.Position(loop.Pos()).Line
				return false
			}
		}
		return true
	})
	return hit, hit != 0
}

// One backoff loop exists, and it is this package's. A second one drifts from it
// in its defaults, its logging, and what it returns — which is why they were
// consolidated here.
func TestRetry_isTheOnlyBackoffLoop(t *testing.T) {
	root, err := filepath.Abs("../..")
	if err != nil {
		t.Fatalf("resolving the services root: %v", err)
	}

	// This package owns the loop; httpclient retries a request rather than an
	// operation and has its own budget, so it is a separate concern.
	skip := map[string]bool{
		filepath.Join(root, "shared", "retry"):      true,
		filepath.Join(root, "shared", "httpclient"): true,
	}

	fset := token.NewFileSet()
	var offenders []string

	err = filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			if skip[path] || d.Name() == "testdata" || d.Name() == "vendor" {
				return fs.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
			return nil
		}

		file, parseErr := parser.ParseFile(fset, path, nil, 0)
		if parseErr != nil {
			// A file this test cannot parse is not evidence of a loop.
			return nil
		}

		for _, decl := range file.Decls {
			fn, isFn := decl.(*ast.FuncDecl)
			if !isFn || fn.Body == nil {
				continue
			}
			if line, found := retriesInALoop(fset, fn); found {
				rel, _ := filepath.Rel(root, path)
				offenders = append(offenders, filepath.ToSlash(rel)+":"+strconv.Itoa(line)+" ("+fn.Name.Name+")")
			}
		}
		return nil
	})
	if err != nil {
		t.Fatalf("walking %s: %v", root, err)
	}

	if len(offenders) > 0 {
		t.Errorf("backoff loops outside shared/retry:\n  %s\n\nUse retry.Do: supply the area's predicate and its budget as options.",
			strings.Join(offenders, "\n  "))
	}
}
