package redis

import (
	"context"

	"github.com/redis/go-redis/v9"
)

// LuaScript is a Lua script compiled once for repeated use. A script runs
// atomically on the server, so it is the tool for a read-decide-write that must
// not interleave with another caller's.
type LuaScript struct{ script *redis.Script }

// Script compiles src. Compiling is local: the script reaches the server on
// first use, and later runs send only its hash.
func Script(src string) *LuaScript { return &LuaScript{script: redis.NewScript(src)} }

// ScriptResult is what a script returned. Read it with the method matching the
// script's own return, and prefer erroring over guessing when they disagree.
type ScriptResult struct{ cmd *redis.Cmd }

// Text reads the result as a string.
func (s *ScriptResult) Text() (string, error) { return s.cmd.Text() }

// Int reads the result as an int.
func (s *ScriptResult) Int() (int, error) { return s.cmd.Int() }

// Value reads the result as the driver decoded it, for a script returning a
// shape — a Lua table, say — that the caller parses itself.
func (s *ScriptResult) Value() (any, error) { return s.cmd.Result() }

// Err reports whether the script failed, for a caller that ignores the value.
func (s *ScriptResult) Err() error { return s.cmd.Err() }

// Run evaluates the script against keys and args.
func (r *Redis) Run(ctx context.Context, script *LuaScript, keys []string, args ...any) *ScriptResult {
	c, err := r.client()
	if err != nil {
		return &ScriptResult{cmd: redis.NewCmdResult(nil, err)}
	}
	return &ScriptResult{cmd: script.script.Run(ctx, c, keys, args...)}
}
