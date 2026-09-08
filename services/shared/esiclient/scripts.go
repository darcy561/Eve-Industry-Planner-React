package esiclient

import "strconv"

// Lua run inside Redis, so a decision is atomic across every replica and reads
// the same clock. Both scripts take the time from Redis rather than a caller.
//
// Every number leaves as a string: Redis converts a Lua number to an integer on
// the way out, which would silently truncate a timestamp.

// reserveScript grants slots, or says when to come back.
//
//	KEYS  state, ledger, errors, downtime
//	ARGV  count, cost_each, class, floors, max_share, min_spacing,
//	      glide_from, probe_ttl, error_limit_stop, endpoint,
//	      downtime_probe_ttl
//
// floors is "class:floor,class:floor,…". A class may spend everything except
// what the others still need to reach their own floors, so a guarantee costs
// nothing while it goes unclaimed.
//
//	reply granted, kind, retry_at, available, limit, window, metered, probe,
//	      then id/slot pairs
//
// reserveArgs is the reserve script's arguments, in order.
var reserveArgs = scriptArgs{
	number("count"),
	number("cost_each"),
	text("class"),
	text("floors_spec"),
	number("max_share"),
	number("min_spacing"),
	number("glide_from"),
	number("probe_ttl"),
	number("error_limit_stop"),
	text("endpoint"),
	number("dt_probe_ttl"),
}

var reserveScript = slotRules + `
local SYNC_MEMBER = '` + SyncMember + `'
local function now()
  local t = redis.call('TIME')
  return tonumber(t[1]) + tonumber(t[2]) / 1e6
end

local function fields(key)
  local flat = redis.call('HGETALL', key)
  local out = {}
  for i = 1, #flat, 2 do out[flat[i]] = flat[i + 1] end
  return out
end

-- bound says which term held the call back, for the refusals where more than one
-- could have. A refusal that names no term is BOUND_NONE, which is also what a
-- caller reading an older reply sees.
local BOUND_NONE, BOUND_BUCKET, BOUND_FLOOR, BOUND_SHARE = 0, 1, 2, 3

local function reply(granted, kind, retry_at, available, limit, window, metered, probe, slots, bound)
  local out = {
    tostring(granted), tostring(kind), string.format('%.6f', retry_at),
    string.format('%.6f', available), tostring(limit), tostring(window),
    tostring(metered), tostring(probe), tostring(bound or BOUND_NONE),
  }
  for i = 1, #slots do out[#out + 1] = slots[i] end
  return out
end

local KIND_QUEUED, KIND_DECELERATING, KIND_GATED = 0, 1, 2
local KIND_ERROR_LIMIT, KIND_DOWNTIME, KIND_DISCOVERING = 4, 5, 6

local state_key, ledger_key, errors_key, downtime_key = KEYS[1], KEYS[2], KEYS[3], KEYS[4]
` + reserveArgs.preamble() + `

local t = now()

-- Tranquility being away stops everything, so it is checked before any bucket.
-- While the fleet believes the server is down exactly one caller probes it, and
-- the rest are told when that probe is due.
local dt = fields(downtime_key)
if tonumber(dt['gated'] or 0) == 1 then
  local next_probe = tonumber(dt['next_probe'] or 0)
  local probing = tonumber(dt['probe_until'] or 0)
  if probing > t or next_probe > t then
    local retry = math.max(next_probe, probing)
    return reply(0, KIND_DOWNTIME, retry, 0, 0, 0, 0, 0, {})
  end
  redis.call('HSET', downtime_key, 'probe_until', string.format('%.6f', t + dt_probe_ttl))
  redis.call('EXPIRE', downtime_key, 86400)
  local id = redis.sha1hex(downtime_key .. ':' .. tostring(t))
  return reply(1, KIND_DOWNTIME, t, 0, 0, 0, 0, 1, { id, string.format('%.6f', t) })
end
local st = fields(state_key)
local limit    = tonumber(st['limit'] or 0)
local window   = tonumber(st['window'] or 0)
local metered  = tonumber(st['metered'] or 0)
local tat      = tonumber(st['tat'] or 0)

local gated_until = tonumber(st['gated_until'] or 0)
if gated_until > t then
  return reply(0, KIND_GATED, gated_until, 0, limit, window, metered, 0, {})
end

local errors = tonumber(redis.call('GET', errors_key) or 0)
if error_limit_stop > 0 and errors >= error_limit_stop then
  local next_minute = (math.floor(t / 60) + 1) * 60
  return reply(0, KIND_ERROR_LIMIT, next_minute, 0, limit, window, metered, 0, {})
end

-- Discovery: nothing has ever answered for this bucket, so its allowance is
-- unknown. Exactly one caller may find out; the rest wait on that.
if limit <= 0 then
  local probe_until = tonumber(st['probe_until'] or 0)
  if probe_until > t then
    return reply(0, KIND_DISCOVERING, probe_until, 0, 0, 0, 0, 0, {})
  end
  redis.call('HSET', state_key, 'probe_until', string.format('%.6f', t + probe_ttl))
  redis.call('EXPIRE', state_key, 3600)
  local id = redis.sha1hex(state_key .. ':' .. tostring(t) .. ':probe')
  return reply(1, KIND_QUEUED, t, 0, 0, 0, 0, 1, { id, string.format('%.6f', t) })
end

-- The ledger holds live charges, so it dies once every charge has aged out. The
-- allowance outlives that: it is a learned fact, not a running total, and a
-- bucket called once an hour would otherwise lose it between calls and drop out
-- of anything reading the fleet's buckets.
--
-- Eight windows is two hours here, comfortably past the hourly refreshes and
-- short enough that a bucket nothing calls any more stops being reported.
local ledger_ttl = math.max(math.floor(window * 2), 60)
local state_ttl = math.max(math.floor(window * 8), 600)

-- An unmetered route is not token-counted by ESI, so there is no ledger to keep
-- and spacing is the only control.
if metered == 0 then
  local slots, base = {}, math.max(t, tat)
  for i = 1, count do
    local slot = base + (i - 1) * min_spacing
    slots[#slots + 1] = redis.sha1hex(state_key .. ':' .. string.format('%.6f', slot) .. ':' .. tostring(i))
    slots[#slots + 1] = string.format('%.6f', slot)
  end
  redis.call('HSET', state_key, 'tat', string.format('%.6f', base + count * min_spacing))
  redis.call('EXPIRE', state_key, state_ttl)
  return reply(1, KIND_QUEUED, t, 0, limit, window, metered, 0, slots)
end

-- Slots expire themselves, so everything still here is inside the window and
-- the read costs what the traffic was varied, not how much of it there was.
local here = slot_of(t, window)

local spent, spent_endpoint = 0, 0
local spent_by_class = {}
local sync_cost = 0
local live_slots = {}
local flat = redis.call('HGETALL', ledger_key)
for i = 1, #flat, 2 do
  local value = tonumber(flat[i + 1]) or 0
  local fslot, fclass, fendpoint = parse_field(flat[i])
  spent = spent + value
  if fclass == SYNC_MEMBER then
    -- Counts against the bucket, but no class or endpoint spent it.
    sync_cost = value
  else
    spent_by_class[fclass] = (spent_by_class[fclass] or 0) + value
    if fendpoint == endpoint then spent_endpoint = spent_endpoint + value end
  end
  live_slots[#live_slots + 1] = { tonumber(fslot) or 0, value }
end

-- How full the bucket is, which is what pacing follows.
local remaining_at = tonumber(st['observed_at'] or 0)
local bucket_available = limit - spent
if remaining_at > 0 and (t - remaining_at) < window then
  bucket_available = math.min(bucket_available, tonumber(st['remaining'] or limit))
end
bucket_available = math.max(bucket_available, 0)

-- ESI counts what it charged this address, which can exceed what this fleet
-- recorded: a ledger that started empty after a deploy, or another caller behind
-- the same address. The difference is held as one charge so our own reckoning
-- stays right once the header goes stale and stops capping availability.
--
-- It is written here rather than on settle because the total it needs has just
-- been walked; doing it there would cost a second pass over the whole ledger.
if remaining_at > 0 and (t - remaining_at) < window then
  local gap = (limit - tonumber(st['remaining'] or limit)) - (spent - sync_cost)
  if gap < 0 then gap = 0 end
  if gap ~= sync_cost then
    -- One field holds the whole difference, so it is replaced rather than
    -- topped up. Clearing it first keeps it out of whichever slot it last sat in.
    for i = 1, #flat, 2 do
      local _, fclass = parse_field(flat[i])
      if fclass == SYNC_MEMBER then
        redis.call('HDEL', ledger_key, flat[i])
      end
    end
    charge_slot(ledger_key, here, SYNC_MEMBER, SYNC_MEMBER, gap, window, t)
    spent = spent - sync_cost + gap
    bucket_available = math.max(math.min(limit - spent, bucket_available), 0)
  end
end

-- A floor is a promise to the classes not asking right now, so what this class
-- may take is everything except what the others still need to reach theirs.
-- Holding an unclaimed share idle would make the promise cost throughput even
-- when nobody is collecting on it.
local reserved_for_others, own_floor, total_floors = 0, 0, 0
for spec in string.gmatch(floors_spec, '[^,]+') do
  local other_class, floor = string.match(spec, '^([^:]*):(.*)$')
  local value = tonumber(floor) or 0
  total_floors = total_floors + value
  if other_class == class then
    own_floor = value
  else
    local owed = value * limit - (spent_by_class[other_class] or 0)
    if owed > 0 then reserved_for_others = reserved_for_others + owed end
  end
end

-- Once the bank is nearly gone every floor is out of reach, and holding them all
-- back would stop every class at once. A class always keeps its floor's share of
-- whatever is actually left.
local proportional = 0
if total_floors > 0 then proportional = bucket_available * own_floor / total_floors end

-- A share smaller than one call is no share at all: with a few tokens left and
-- the floors summing past them, every class would round down to nothing and the
-- last of the bank would never be spent. Whoever asks may take one call while
-- the bucket can still afford one; the ledger stops the next.
if bucket_available >= cost_each and proportional < cost_each then
  proportional = cost_each
end

-- Three terms can each hold a call back, and they are kept apart so a refusal can
-- say which one did. After the bucket's own occupancy, the floor owed to other
-- classes is what a class may not take; the endpoint's share is a separate cap on
-- top of that.
local after_floors = math.max(bucket_available - reserved_for_others, proportional)

local available = after_floors
local bound = BOUND_BUCKET
if after_floors < bucket_available then
  -- The floors gave away less than the bucket holds, so they are the binding
  -- term rather than the bucket's own occupancy.
  bound = BOUND_FLOOR
end

if max_share > 0 then
  local share = max_share * limit - spent_endpoint
  if share < available then
    available = share
    bound = BOUND_SHARE
  end
end
available = math.max(available, 0)

local needed = count * cost_each
if available < needed then
  -- Come back when enough charges have expired, not at the next slot: the
  -- bucket would still be empty then.
  --
  -- Tokens come back a slot at a time, so the answer is the expiry of the
  -- oldest slots that between them free enough. Already read above, so this
  -- costs a sort rather than a second trip.
  local deficit = needed - available
  table.sort(live_slots, function(a, b) return a[1] < b[1] end)

  local freed, retry_at = 0, t + window
  for i = 1, #live_slots do
    freed = freed + live_slots[i][2]
    if freed >= deficit then
      retry_at = slot_expiry(live_slots[i][1], window)
      break
    end
  end
  redis.call('EXPIRE', state_key, state_ttl)
  return reply(0, KIND_DECELERATING, retry_at, available, limit, window, metered, 0, {}, bound)
end

-- Spend the bank, then glide into the refill rate rather than hitting the wall.
-- Fill is the bucket's own occupancy: a class cap limits how much of it one
-- class may hold, and must not be mistaken for the bank running low.
local fill = bucket_available / limit
local sustained = window * cost_each / limit
local interval = min_spacing
if fill < glide_from and glide_from > 0 then
  interval = min_spacing + (sustained - min_spacing) * (1 - fill / glide_from)
end
if interval < min_spacing then interval = min_spacing end

local slots = {}
local base = math.max(t, tat)
for i = 1, count do
  local slot = base + (i - 1) * interval
  local id = redis.sha1hex(state_key .. ':' .. string.format('%.6f', slot) .. ':' .. tostring(i))
  charge_slot(ledger_key, slot_of(slot, window), class, endpoint, cost_each, window, t)
  slots[#slots + 1] = id
  slots[#slots + 1] = string.format('%.6f', slot)
end

redis.call('HSET', state_key, 'tat', string.format('%.6f', base + count * interval))
redis.call('EXPIRE', state_key, state_ttl)
redis.call('EXPIRE', ledger_key, ledger_ttl)

return reply(1, KIND_QUEUED, t, available - needed, limit, window, metered, 0, slots)
`

// settleScript reconciles one reservation against what the response cost, and
// folds in whatever the response disclosed about the bucket.
//
//	KEYS  state, ledger, errors, downtime
//	ARGV  id, actual_cost, class, endpoint, status, observed_at,
//	      limit, window, remaining, retry_after, metered,
//	      availability, failures_to_trip, probe_first, probe_max,
//	      distinct_buckets_to_trip, lone_bucket_failures
//
// availabilityRules decide whether the servers are answering. They are shared
// between settle, which learns it from a call that spent a token, and observe,
// which learns it from one that did not — SSO token rotation is stopped by the
// same outage but has no bucket and costs nothing.
const availabilityRules = `local failing_key = downtime_key .. ':failing'

if availability == 1 then
  redis.call('HSET', downtime_key, 'gated', 0, 'failures', 0, 'last_ok', string.format('%.6f', observed_at))
  redis.call('HDEL', downtime_key, 'probe_until', 'next_probe', 'backoff')
  redis.call('DEL', failing_key)
  redis.call('EXPIRE', downtime_key, 86400)
elseif availability == -1 then
  local failures = tonumber(redis.call('HINCRBY', downtime_key, 'failures', 1))

  -- Tranquility being away fails everything, so failures spread across buckets.
  -- One endpoint failing repeatedly is that endpoint, not the server, and must
  -- not take the rest of the fleet down with it.
  redis.call('SADD', failing_key, state_key)
  redis.call('EXPIRE', failing_key, 300)
  local spread = tonumber(redis.call('SCARD', failing_key))

  local conclude = failures >= trip_after and
    (spread >= buckets_to_trip or failures >= lone_failures)
  if conclude then
    -- The backoff lengthens once per probe, not once per failed call. Deciding
    -- the server is away takes a burst of concurrent failures, and doubling on
    -- each of them runs straight to the ceiling before the gate has settled —
    -- which is paid back as recovery lag once the server returns.
    local next_probe = tonumber(redis.call('HGET', downtime_key, 'next_probe') or 0)
    if observed_at >= next_probe then
      local backoff = tonumber(redis.call('HGET', downtime_key, 'backoff') or 0)
      if backoff <= 0 then
        backoff = probe_first
      else
        backoff = math.min(backoff * 2, probe_max)
      end
      redis.call('HSET', downtime_key, 'backoff', backoff,
        'next_probe', string.format('%.6f', observed_at + backoff))
    end
    redis.call('HSET', downtime_key, 'gated', 1)
    redis.call('HDEL', downtime_key, 'probe_until')
  end
  redis.call('EXPIRE', downtime_key, 86400)
end
`

// slotRules turn a moment into the slot that holds its charges. A slot is a
// fixed span of the window, so however many calls land in one they cost a
// single field — which is what stops the ledger growing with traffic.
//
// SlotsPerWindow is the read cost: one field per slot actually used, times the
// class and endpoint combinations seen in it.
var slotRules = `
local SEP = '` + fieldSeparator + `'

-- A ledger field is <slot>SEP<class>SEP<endpoint>. The endpoint takes whatever
-- remains, separators included, so it matches what Go's parseLedgerField reads.
local function parse_field(field)
  return string.match(field, '^([^` + fieldSeparator + `]*)` + fieldSeparator + `([^` + fieldSeparator + `]*)` + fieldSeparator + `(.*)$')
end

local function slot_size(window)
  return math.max(math.floor(window / ` + strconv.Itoa(SlotsPerWindow) + `), 1)
end

local function slot_of(at, window)
  return math.floor(at / slot_size(window))
end

-- When a slot's charges stop counting. Derived from the slot rather than from
-- now, so writing into it again never extends its life.
local function slot_expiry(sl, window)
  return (sl + 1) * slot_size(window) + window
end

local function slot_field(sl, class, endpoint)
  return sl .. SEP .. class .. SEP .. endpoint
end

local function charge_slot(key, sl, class, endpoint, cost, window, at, state_key)
  if cost == 0 then return end
  local field = slot_field(sl, class, endpoint)
  local after = redis.call('HINCRBY', key, field, cost)
  if after <= 0 then
    -- Below zero means a reversal took out more than the slot was holding, which
    -- happens when one hold is given back twice. The tokens it took belonged to
    -- whoever else was in the field, so the count is kept rather than discarded
    -- with the field. Only a reversal can do it: every other caller charges a
    -- positive cost, and reconciliation clamps its own to zero.
    if after < 0 and cost < 0 and state_key then
      redis.call('HINCRBY', state_key, 'overdrawn', -after)
    end
    -- A charge given back in full leaves nothing to expire.
    redis.call('HDEL', key, field)
    return
  end
  -- HEXPIRE takes a remaining span rather than an instant, so it is measured
  -- back from the slot's own expiry: a later write to the same slot sets a
  -- shorter span, never a longer one.
  local left = math.ceil(slot_expiry(sl, window) - at)
  if left <= 0 then
    redis.call('HDEL', key, field)
    return
  end
  redis.call('HEXPIRE', key, left, 'FIELDS', 1, field)
end
`

// SlotsPerWindow is how finely the window is divided. Finer means a truer
// picture of when tokens come back and more fields to read; coarser means the
// opposite.
const SlotsPerWindow = 180

// SyncMember marks the ledger charge that holds the difference between what ESI
// says it has charged this address and what this fleet recorded. It stands in
// for a class and an endpoint so the difference counts against the bucket
// without being attributed to a floor or a share that did not spend it.
const SyncMember = "esi-sync"

// settleArgs is the settle script's arguments, in order. Adding one appends a
// line here and a value at the call site; the Lua's indices follow on their own.
var settleArgs = scriptArgs{
	text("id"),
	number("actual_cost"),
	text("class"),
	text("endpoint"),
	number("status"),
	number("observed_at"),
	number("limit"),
	number("window"),
	number("remaining"),
	number("retry_after"),
	number("metered"),
	number("availability"),
	number("trip_after"),
	number("probe_first"),
	number("probe_max"),
	number("buckets_to_trip"),
	number("lone_failures"),
	// What the reservation was holding, and where. A slot holds no
	// per-reservation identity, so the caller says which charge to give back.
	number("held_at"),
	number("held_cost"),
}

var settleScript = slotRules + `
local SYNC_MEMBER = '` + SyncMember + `'
local state_key, ledger_key, errors_key, downtime_key = KEYS[1], KEYS[2], KEYS[3], KEYS[4]
` + settleArgs.preamble() + `

-- Availability is read from what the server actually answered. A reply of any
-- kind means it is up, however unwelcome that reply; only a 5xx or no reply at
-- all counts against it.
` + availabilityRules + `

local stored_window = tonumber(redis.call('HGET', state_key, 'window') or 0)
local effective_window = window
if effective_window <= 0 then effective_window = stored_window end
local ledger_ttl = math.max(math.floor(effective_window * 2), 60)
local state_ttl = math.max(math.floor(effective_window * 8), 600)

-- The reservation was charged at the pessimistic cost when it was granted.
-- Give that back where it was taken from, then charge what the call really
-- cost. A slot holds no per-reservation identity, so the caller says which one.
local removed = 0
if effective_window > 0 then
  if held_cost > 0 then
    charge_slot(ledger_key, slot_of(held_at, effective_window), class, endpoint, -held_cost, effective_window, observed_at, state_key)
    removed = 1
  end
  if actual_cost > 0 then
    charge_slot(ledger_key, slot_of(observed_at, effective_window), class, endpoint, actual_cost, effective_window, observed_at)
    redis.call('EXPIRE', ledger_key, ledger_ttl)
  end
end

-- A slow response must not overwrite a fresher reading of the same bucket.
local stored_at = tonumber(redis.call('HGET', state_key, 'observed_at') or 0)
if observed_at >= stored_at then
  redis.call('HSET', state_key, 'observed_at', string.format('%.6f', observed_at))
  redis.call('HSET', state_key, 'metered', tostring(metered))
  if limit > 0 then redis.call('HSET', state_key, 'limit', tostring(limit)) end
  if window > 0 then redis.call('HSET', state_key, 'window', tostring(window)) end
  if remaining >= 0 then redis.call('HSET', state_key, 'remaining', tostring(remaining)) end
end

-- Discovery is over either way: on success the allowance is known, on failure
-- the next caller should get its turn.
redis.call('HDEL', state_key, 'probe_until')

if retry_after > 0 then
  redis.call('HSET', state_key, 'gated_until', string.format('%.6f', observed_at + retry_after))
end
redis.call('EXPIRE', state_key, state_ttl)

if status > 0 and (status < 200 or status >= 400) then
  local count = redis.call('INCR', errors_key)
  if tonumber(count) == 1 then redis.call('EXPIRE', errors_key, 120) end
end

return tostring(removed)
`

// observeScript records whether the servers answered, for a caller with no
// bucket and no token to spend.
//
//	KEYS  downtime
//	ARGV  source, availability, observed_at, failures_to_trip,
//	      probe_first, probe_max, distinct_buckets_to_trip, lone_bucket_failures
//
// observeArgs is the observe script's arguments, in order.
var observeArgs = scriptArgs{
	text("state_key"),
	number("availability"),
	number("observed_at"),
	number("trip_after"),
	number("probe_first"),
	number("probe_max"),
	number("buckets_to_trip"),
	number("lone_failures"),
}

var observeScript = `
local downtime_key = KEYS[1]
` + observeArgs.preamble() + `
` + availabilityRules + `
return tostring(availability)
`
