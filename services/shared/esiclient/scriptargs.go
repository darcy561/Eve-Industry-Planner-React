package esiclient

import (
	"strconv"
	"strings"
)

// A script's arguments are positional on both sides: Go appends them in order
// and the Lua reads them back as ARGV[n]. Nothing tied the two together, so an
// argument inserted anywhere but the end shifted every index after it, and the
// Lua would keep reading the old positions without failing — a wrong number is
// still a number.
//
// The list below is the one definition. Go builds its slice from it and the Lua
// preamble is generated from it, so an index cannot mean two different things.

// scriptArg is one positional argument: the Lua local it lands in, and whether
// the Lua wants it as a number.
type scriptArg struct {
	Name    string
	Numeric bool
}

func text(name string) scriptArg   { return scriptArg{Name: name} }
func number(name string) scriptArg { return scriptArg{Name: name, Numeric: true} }

// scriptArgs is a script's arguments in the order they are passed.
type scriptArgs []scriptArg

// preamble is the Lua that reads the arguments into named locals. It is
// generated so the indices exist once, here, rather than being written out by
// hand alongside a Go call that must agree with them.
func (a scriptArgs) preamble() string {
	var b strings.Builder
	for i, arg := range a {
		b.WriteString("local ")
		b.WriteString(arg.Name)
		b.WriteString(" = ")
		if arg.Numeric {
			b.WriteString("tonumber(ARGV[")
			b.WriteString(strconv.Itoa(i + 1))
			b.WriteString("])")
		} else {
			b.WriteString("ARGV[")
			b.WriteString(strconv.Itoa(i + 1))
			b.WriteString("]")
		}
		b.WriteByte('\n')
	}
	return b.String()
}

// values orders a call's arguments to match the preamble. It panics on a
// mismatch: the two are one definition, so a disagreement is a programming error
// in this package rather than anything a caller can cause or recover from.
func (a scriptArgs) values(by map[string]any) []any {
	out := make([]any, len(a))
	for i, arg := range a {
		v, ok := by[arg.Name]
		if !ok {
			panic("esiclient: script argument " + arg.Name + " has no value")
		}
		out[i] = v
	}
	if len(by) != len(a) {
		for name := range by {
			if !a.has(name) {
				panic("esiclient: value " + name + " is not a script argument")
			}
		}
	}
	return out
}

func (a scriptArgs) has(name string) bool {
	for _, arg := range a {
		if arg.Name == name {
			return true
		}
	}
	return false
}
