# The market group tree, measured

Taken from the SDE build the worker currently converts (`marketGroups.jsonl`, build 3069448). The
counts come from a script over the raw source; the byte figures come from `GenerateMarketGroupsOutput`
itself, encoded the way `addJSONFile` encodes it.

**Measure the file with the encoder that writes it.** A first pass here used Python's `json` at one
space of indent with HTML escaping off, and understated the published size by about a tenth:
`addJSONFile` uses `MarshalIndent` at two spaces, and Go escapes `&` by default, which the eleven
ampersands in group names ("Blueprints & Reactions") pay for.

| | |
|---|---|
| Groups in the source | 2,039 |
| Groups published (an English name) | 2,039 |
| Roots (no `parentGroupID`) | 19 |
| Groups stating `parentGroupID: 0` | 0 |
| Parents named but absent from the file | 0 |
| Groups with no English name | 0 |
| Deepest chain | 6 groups — an item's own, plus five ancestors |
| `marketGroups.json` minified | 101,872 bytes |
| `marketGroups.json` as written | 140,500 bytes |

## What this settles

**The walk is short.** Five hops at most, so `MAX_GROUP_DEPTH` at 32 is not a performance ceiling —
it exists only to stop a cycle, which this data does not contain and should never contain. The margin
is deliberate: a cap near the real depth would turn a legitimate deepening of EVE's tree into a
silently truncated walk.

**Two guards are untriggered by real data and stay anyway.** Nothing states `parentGroupID: 0` and
nothing names a parent it does not carry, so the root-detection and dangling-parent handling are
defensive rather than load-bearing today. They cost nothing and the file comes from outside this
repository.

**The file does not warrant trimming.** ~137 KB as written, ~99 KB minified, against
`fullItemList.json`'s ~50,000 types is small,
and it gzips well given the repetitive shape. Publishing every group — including the ones holding no
types — is necessary rather than wasteful: the walk needs every node on a path to a root, not only the
groups items sit in directly.

## Reproducing it

The byte figures need a throwaway Go test in `worker/tasks/sde/update/conversion`: read the same
`marketGroups.jsonl`, call `GenerateMarketGroupsOutput`, and marshal the result both ways. Any other
encoder gives a different and wrong answer. The counts come from the raw source directly:

```bash
python3 - <<'PY'
import json
groups = {}
for line in open("marketGroups.jsonl"):
    d = json.loads(line)
    groups[d["_key"]] = {"parent": d.get("parentGroupID"), "name": (d.get("name") or {}).get("en")}
print("groups", len(groups))
print("roots", sum(1 for v in groups.values() if not v["parent"]))
print("dangling", sum(1 for v in groups.values() if v["parent"] and v["parent"] not in groups))
PY
```
