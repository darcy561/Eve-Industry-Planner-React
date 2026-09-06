package esiclient

import (
	"strings"
	"testing"
)

// The indices exist once, in the argument list, and both the Lua preamble and
// the Go call are derived from it. These check the derivation rather than the
// scripts: a wrong index is a wrong number rather than an error, so it would
// otherwise be found by behaviour going quietly odd.

func TestThePreambleNumbersArgumentsFromOne(t *testing.T) {
	args := scriptArgs{text("first"), number("second"), text("third")}
	want := "local first = ARGV[1]\nlocal second = tonumber(ARGV[2])\nlocal third = ARGV[3]\n"
	if got := args.preamble(); got != want {
		t.Errorf("preamble =\n%s\nwant\n%s", got, want)
	}
}

func TestValuesFollowTheDeclaredOrder(t *testing.T) {
	args := scriptArgs{text("a"), text("b"), text("c")}
	// Deliberately not in declaration order: the map cannot carry order, which
	// is the point - the list does.
	got := args.values(map[string]any{"c": 3, "a": 1, "b": 2})
	for i, want := range []any{1, 2, 3} {
		if got[i] != want {
			t.Errorf("values[%d] = %v, want %v", i, got[i], want)
		}
	}
}

func TestAMissingValuePanicsRatherThanPassingNil(t *testing.T) {
	defer func() {
		r := recover()
		if r == nil {
			t.Fatal("a missing argument passed silently; the Lua would read nil as a number")
		}
		if !strings.Contains(r.(string), "second") {
			t.Errorf("panic %q does not name the missing argument", r)
		}
	}()
	scriptArgs{text("first"), text("second")}.values(map[string]any{"first": 1})
}

func TestAValueThatIsNotAnArgumentPanics(t *testing.T) {
	defer func() {
		r := recover()
		if r == nil {
			t.Fatal("a value with no matching argument was dropped silently")
		}
		if !strings.Contains(r.(string), "stray") {
			t.Errorf("panic %q does not name the stray value", r)
		}
	}()
	scriptArgs{text("first")}.values(map[string]any{"first": 1, "stray": 2})
}

// Every argument the scripts declare must be read by the script that declares
// it, and every local the scripts read must be declared. A name in one place and
// not the other is the drift this stage exists to stop.
func TestEveryDeclaredArgumentIsReadByItsScript(t *testing.T) {
	for _, tc := range []struct {
		name   string
		args   scriptArgs
		script string
	}{
		{"reserve", reserveArgs, reserveScript},
		{"settle", settleArgs, settleScript},
		{"observe", observeArgs, observeScript},
	} {
		t.Run(tc.name, func(t *testing.T) {
			body := tc.script[strings.Index(tc.script, tc.args.preamble())+len(tc.args.preamble()):]
			for _, arg := range tc.args {
				if !strings.Contains(body, arg.Name) {
					t.Errorf("%s declares %q and never reads it, so either the script or the "+
						"list is out of date", tc.name, arg.Name)
				}
			}
		})
	}
}

// Nothing should still be reaching for ARGV by hand: an index written out is an
// index that can disagree with the list.
func TestNoScriptIndexesARGVByHand(t *testing.T) {
	for _, tc := range []struct {
		name   string
		args   scriptArgs
		script string
	}{
		{"reserve", reserveArgs, reserveScript},
		{"settle", settleArgs, settleScript},
		{"observe", observeArgs, observeScript},
	} {
		body := strings.Replace(tc.script, tc.args.preamble(), "", 1)
		if strings.Contains(body, "ARGV[") {
			t.Errorf("%s reads ARGV outside its generated preamble; that index is not tied to "+
				"the argument list and can drift from it", tc.name)
		}
	}
}
