# `POST /universe/names` — what one bad id does to a batch

Measured against live ESI (`https://esi.evetech.net/latest/universe/names/`, tranquility) on
2026-09-12, answering the plan's open question "Does an unknown id fail a whole `/universe/names`
batch?".

| Request body | HTTP | Body |
|--------------|------|------|
| `[60003760,10000002,30000142]` | 200 | Jita IV - Moon 4 - Caldari Navy Assembly Plant, The Forge, Jita |
| `[60003760,10000002,30000142,999999999]` | 404 | `{"error":"Ensure all IDs are valid before resolving."}` |
| `[999999999]` | 404 | same |
| `[60003760,999999999]` | 404 | same |
| `[1]` | 404 | same |
| `[2117028121]` (a character) | 200 | `{"category":"character",...}` |
| `[34]` (an inventory type) | 200 | `{"category":"inventory_type","name":"Tritanium"}` |
| `[60003760,1035466617946]` (a structure id) | 400 | `{"error":"failed to coerce value '1035466617946' into type integer (format: int32), 'ids' is required"}` |

## What this settles

**The call is all-or-nothing.** One id ESI cannot resolve refuses the entire batch with a 404 and
names nothing, and the body says nothing about which id was at fault. A batch of a thousand ids
therefore resolves a thousand names or none.

**An id ESI rejects is not merely omitted.** The loader's original reading — that ESI answers 200 and
leaves an id it does not know out of the list — did not happen for any id probed here: each was
refused outright instead. Every id probed was one that was never valid, though. An id that was valid
once and has since gone from ESI's data — a decommissioned station, a deleted corporation — was not
tested, so whether that shape is refused or quietly omitted is unmeasured, and the loader still
handles both.

**A structure id must never reach this endpoint.** Upwell structure ids exceed int32, so the request
is rejected outright at 400 before any id is resolved. The loader already splits structures out by
range, and this is why that split is load-bearing rather than an optimisation.

## What the endpoint will answer for at all

Its own schema (`https://esi.evetech.net/meta/openapi.json`) gives the categories it can return:
`alliance`, `character`, `constellation`, `corporation`, `inventory_type`, `region`, `solar_system`,
`station`, `faction`. Of the things that arrive as a location, that is regions, constellations,
solar systems and stations — and nothing else. Probed against live ESI:

| Request body | HTTP | Body |
|--------------|------|------|
| `[20000020]` (constellation) | 200 | Kimotoro |
| `[98000001]` (corporation) | 200 | Vertex Dryrun Test Corp |
| `[500001]` (faction) | 200 | Caldari State |
| `[40009077]` (a planet in Jita) | 404 | `{"error":"Ensure all IDs are valid before resolving."}` |
| `[50001248]` (a stargate out of Jita) | 404 | same |

A celestial and a stargate are therefore not merely unnamed by this endpoint — batching one refuses
the whole call. Both can appear as a location: a starbase's modules sit at a moon.

## Three kinds of refusal, not one

The endpoint separates a request it will not accept from ids it cannot resolve, and coerces rather
than rejecting where it can. Probed against live ESI:

| Request body | HTTP | Body |
|--------------|------|------|
| `[]` | 400 | `{"error":"too few items for 'ids', 'ids' is required"}` |
| `[60003760,60003760]` | 400 | `{"error":"'ids' items are not all unique, 'ids' is required"}` |
| `[60003760,1035466617946]` | 400 | `{"error":"failed to coerce value '1035466617946' into type integer (format: int32), 'ids' is required"}` |
| `[-1]` | 404 | `{"error":"Ensure all IDs are valid before resolving."}` |
| `[999999999]` | 404 | same |
| `["60003760"]` (a string) | 200 | named — coerced |
| `[60003760.5]` (a float) | 200 | named — truncated |
| `[0]` | 200 | `{"category":"inventory_type","id":0,"name":"#System"}` |

**400 means the request itself is wrong** — empty, holding a duplicate, or carrying a number outside
int32 — and no id in it is resolved. It is permanent: the same body will be refused every time.

**404 means the request was fine and an id in it resolves to nothing.** That is data, and it is what
the batch-splitting answers.

Two consequences for the loader. Duplicates are a 400, so the batch it sends must be a set —
`getUniverseNames` builds its body from one rather than trusting each caller. And a structure id is
a 400 rather than a 404, so it would not be found by splitting: it has to be kept out by
classification, which is what `locationNameSource` does.

## What it cost to answer

Eighteen requests: six 404s and three 400s. A 4xx costs five tokens against ESI's error budget
where a 2xx costs two, so the probe spent roughly 63 tokens of a budget that refills each minute.
