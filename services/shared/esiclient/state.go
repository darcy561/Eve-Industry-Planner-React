package esiclient

import (
	"context"
	"fmt"
	"slices"
	"strconv"
	"strings"
	"time"

	eipredis "eve-industry-planner/shared/redis"
)

// BucketState is what ESI last told us about a bucket, plus our own clock.
// Limit, Window and Metered are observations; nothing in code supplies them.
type BucketState struct {
	Limit      int
	Window     time.Duration
	Metered    bool
	Remaining  int
	ObservedAt time.Time
	GatedUntil time.Time
	NextSlot   time.Time
	ProbeUntil time.Time
	Spent      int
	// Unaccounted is the part of Spent that ESI charged this address but this
	// fleet never recorded: a ledger that started empty after a deploy, or
	// another caller sharing the address. It is held so our own reckoning does
	// not overstate what is left, and it is the honest measure of how far out of
	// step the two counts are.
	Unaccounted int
	// Overdrawn counts tokens taken out of a slot that was not holding them,
	// which happens when one reservation's hold is reversed twice. The tokens
	// belonged to whoever else was charged in that slot, so the fleet believes
	// it has budget it does not. Anything above zero is a defect, not a
	// threshold to tune.
	Overdrawn int
}

// Known reports whether a response has ever disclosed this bucket's allowance.
func (s BucketState) Known() bool { return s.Limit > 0 }

// Headroom is what a scheduler asks before publishing work. It is scoped to a
// class: what bulk may spend is not what the bucket holds.
type Headroom struct {
	Bucket Bucket
	Class  Class
	// Known is false until a response has disclosed the bucket's allowance.
	// Available is 0 in that case, which is not the same as having no budget:
	// nothing has said yet. Callers must not read it as a refusal.
	Known      bool
	Available  int
	Requests   int
	ResetAt    time.Time
	GatedUntil time.Time
	Sustained  float64
}

// Reservation is a granted slot. Every one is settled or released.
type Reservation struct {
	ID       string
	Bucket   Bucket
	Class    Class
	Endpoint string
	Slot     time.Time
	Cost     int
	Probe    bool
}

// Outcome is what a reservation turned into, for Settle.
type Outcome struct {
	// Attempted says a request actually reached the network. A reservation that
	// was released without being sent is not evidence about availability, and
	// must not be mistaken for the server failing to answer.
	Attempted  bool
	Status     int
	Cost       int
	ObservedAt time.Time
	Limit      int
	Window     time.Duration
	Remaining  int
	RetryAfter time.Duration
	Metered    bool
}

// Store is the Redis side of the limiter: the reservation clock, the token
// ledger, and what responses have disclosed. It knows nothing about HTTP and
// nothing about anything waiting.
type Store struct {
	redis   *eipredis.Redis
	cfg     Config
	reserve *eipredis.LuaScript
	settle  *eipredis.LuaScript
	observe *eipredis.LuaScript
}

// NewStore binds the scripts to a Redis client.
func NewStore(r *eipredis.Redis, cfg Config) *Store {
	return &Store{
		redis:   r,
		cfg:     cfg,
		reserve: eipredis.Script(reserveScript),
		settle:  eipredis.Script(settleScript),
		observe: eipredis.Script(observeScript),
	}
}

// Grant is the answer to a reservation request: slots, or when to come back.
type Grant struct {
	Granted      bool
	Kind         Kind
	RetryAt      time.Time
	Reservations []Reservation
	State        BucketState
	Available    int
	// Bound is which term held the call back, where the Kind alone does not say.
	// BoundNone on a grant, and on a refusal from a replica still running the
	// previous script.
	Bound Bound
}

// Reserve asks for count slots in a bucket. It never blocks: either slots come
// back with the times they mature, or a Kind and a time to return.
func (s *Store) Reserve(ctx context.Context, b Bucket, class Class, policy EndpointPolicy, count int) (Grant, error) {
	if count <= 0 {
		count = 1
	}
	spacing := policy.MinSpacing
	if spacing <= 0 {
		spacing = 50 * time.Millisecond
	}
	glide := policy.GlideFrom
	if glide <= 0 {
		glide = s.cfg.GlideFrom
	}
	endpoint := policy.Pattern
	if endpoint == "" {
		endpoint = "-"
	}

	raw, err := s.redis.Run(ctx, s.reserve,
		[]string{stateKey(b), ledgerKey(b), errorKey(time.Now()), downtimeKey},
		reserveArgs.values(map[string]any{
			"count":            count,
			"cost_each":        SuccessCost,
			"class":            strconv.Itoa(int(class)),
			"floors_spec":      s.cfg.floorsSpec(),
			"max_share":        policy.MaxShare,
			"min_spacing":      spacing.Seconds(),
			"glide_from":       glide,
			"probe_ttl":        s.cfg.ProbeTTL.Seconds(),
			"error_limit_stop": s.cfg.ErrorLimitStop,
			"endpoint":         endpoint,
			"dt_probe_ttl":     downtimeProbeTTL.Seconds(),
		})...,
	).Value()
	if err != nil {
		return Grant{}, fmt.Errorf("reserve %s: %w", b, err)
	}
	return parseGrant(raw, b, class, endpoint)
}

// Settle reconciles one reservation against what its response cost, and folds in
// whatever that response disclosed about the bucket. Release is Settle with a
// zero cost.
func (s *Store) Settle(ctx context.Context, r Reservation, out Outcome) error {
	observed := out.ObservedAt
	if observed.IsZero() {
		observed = time.Now()
	}
	remaining := out.Remaining
	if out.Limit <= 0 {
		remaining = -1
	}

	// 1 the server answered, -1 it did not, 0 we never asked.
	availability := 0
	switch {
	case !out.Attempted:
	case out.Status >= 200 && out.Status < 500:
		availability = 1
	default:
		availability = -1
	}

	_, err := s.redis.Run(ctx, s.settle,
		[]string{stateKey(r.Bucket), ledgerKey(r.Bucket), errorKey(observed), downtimeKey},
		settleArgs.values(map[string]any{
			"id":              r.ID,
			"actual_cost":     out.Cost,
			"class":           strconv.Itoa(int(r.Class)),
			"endpoint":        r.Endpoint,
			"status":          out.Status,
			"observed_at":     float64(observed.UnixNano()) / 1e9,
			"limit":           out.Limit,
			"window":          int(out.Window.Seconds()),
			"remaining":       remaining,
			"retry_after":     out.RetryAfter.Seconds(),
			"metered":         boolToInt(out.Metered),
			"availability":    availability,
			"trip_after":      failuresBeforeConcluding,
			"probe_first":     downtimeProbeFirst.Seconds(),
			"probe_max":       downtimeProbeMax.Seconds(),
			"buckets_to_trip": sourcesToTripDowntime,
			"lone_failures":   loneSourceFailures,
			"held_at":         float64(r.Slot.UnixNano()) / 1e9,
			"held_cost":       r.Cost,
		})...,
	).Value()
	if err != nil {
		return fmt.Errorf("settle %s: %w", r.Bucket, err)
	}
	return nil
}

// Release drops a reservation whose request never happened. It says nothing
// about whether the server is up.
func (s *Store) Release(ctx context.Context, r Reservation) error {
	return s.Settle(ctx, r, Outcome{ObservedAt: time.Now(), Metered: true})
}

// SettleUnreachable records a reservation whose request was sent and produced no
// response, which is evidence the server is away.
func (s *Store) SettleUnreachable(ctx context.Context, r Reservation) error {
	return s.Settle(ctx, r, Outcome{Attempted: true, ObservedAt: time.Now(), Metered: true})
}

// State reads what is known about a bucket.
func (s *Store) State(ctx context.Context, b Bucket) (BucketState, error) {
	fields, err := s.redis.Fields(ctx, stateKey(b))
	if err != nil {
		return BucketState{}, fmt.Errorf("state %s: %w", b, err)
	}
	state := stateFromFields(fields)

	if state.Metered {
		spent, unaccounted, err := s.spend(ctx, b)
		if err != nil {
			return state, err
		}
		state.Spent = spent
		state.Unaccounted = unaccounted
	}
	return state, nil
}

// States is [Store.State] for many buckets in one round trip. Reading them one at a time costs two
// commands per bucket, which a reporting caller pays on every collection.
func (s *Store) States(ctx context.Context, buckets []Bucket) (map[Bucket]BucketState, error) {
	out := make(map[Bucket]BucketState, len(buckets))
	if len(buckets) == 0 {
		return out, nil
	}

	pipe, err := s.redis.Pipe()
	if err != nil {
		return nil, fmt.Errorf("states: %w", err)
	}
	fieldCmds := make([]*eipredis.FieldsResult, len(buckets))
	ledgerCmds := make([]*eipredis.FieldsResult, len(buckets))
	for i, b := range buckets {
		fieldCmds[i] = pipe.Fields(ctx, stateKey(b))
		ledgerCmds[i] = pipe.Fields(ctx, ledgerKey(b))
	}
	if err := pipe.Exec(ctx); err != nil {
		return nil, fmt.Errorf("states: %w", err)
	}

	for i, b := range buckets {
		fields, err := fieldCmds[i].Result()
		if err != nil && !eipredis.IsNotFound(err) {
			return nil, fmt.Errorf("state %s: %w", b, err)
		}
		state := stateFromFields(fields)
		if state.Metered {
			ledger, err := ledgerCmds[i].Result()
			if err != nil && !eipredis.IsNotFound(err) {
				return nil, fmt.Errorf("ledger %s: %w", b, err)
			}
			state.Spent, state.Unaccounted = spendFromFields(ledger)
		}
		out[b] = state
	}
	return out, nil
}

// Headroom reports what one class may spend in a bucket now, so a scheduler can
// decide whether to publish work rather than let it bounce later.
func (s *Store) Headroom(ctx context.Context, b Bucket, class Class) (Headroom, error) {
	state, err := s.State(ctx, b)
	if err != nil {
		return Headroom{}, err
	}
	return s.headroomFrom(state, b, class), nil
}

// CanAfford is Headroom against a threshold, for the common scheduler question.
//
// An allowance nothing has disclosed yet affords the work. Refusing it would
// deadlock: the allowance is only ever learned from a call, so a caller that
// waits for a budget before calling waits forever. The limiter admits one
// caller to discover it and paces the rest.
func (s *Store) CanAfford(ctx context.Context, b Bucket, class Class, tokens int) (bool, Headroom, error) {
	room, err := s.Headroom(ctx, b, class)
	if err != nil {
		return false, Headroom{}, err
	}
	if !room.GatedUntil.IsZero() {
		return false, room, nil
	}
	if !room.Known {
		return true, room, nil
	}
	return room.Available >= tokens, room, nil
}

func (s *Store) headroomFrom(state BucketState, b Bucket, class Class) Headroom {
	room := Headroom{Bucket: b, Class: class, GatedUntil: state.GatedUntil, Known: state.Known()}
	if !room.Known {
		return room
	}

	bucketAvailable := state.Limit - state.Spent
	if state.ObservedAt.After(time.Now().Add(-state.Window)) && state.Remaining >= 0 {
		bucketAvailable = min(bucketAvailable, state.Remaining)
	}
	bucketAvailable = max(bucketAvailable, 0)

	// What this class may take is everything the others are not owed, or its
	// share of what remains — the same rule the reserve script applies.
	available := max(
		bucketAvailable-int(s.cfg.reservedForOthers(class)*float64(state.Limit)),
		int(s.cfg.floorShare(class)*float64(bucketAvailable)),
	)

	room.Available = max(available, 0)
	room.Requests = room.Available / SuccessCost
	room.Sustained = float64(state.Limit) / state.Window.Seconds() / SuccessCost
	room.ResetAt = state.ObservedAt.Add(state.Window)
	return room
}

// spend is what the bucket currently holds against it, and how much of that
// this fleet never recorded itself — spend ESI charged the address that came
// from somewhere else, or from before this ledger existed.
func (s *Store) spend(ctx context.Context, b Bucket) (total, unaccounted int, err error) {
	// Slots expire themselves, so whatever comes back is inside the window and
	// nothing needs filtering by time.
	fields, err := s.redis.Fields(ctx, ledgerKey(b))
	if err != nil {
		return 0, 0, fmt.Errorf("ledger %s: %w", b, err)
	}

	total, unaccounted = spendFromFields(fields)
	return total, unaccounted, nil
}

// spendFromFields totals a ledger hash, and the part of it charged to the sync
// marker rather than to a caller of ours. Both the single-bucket read and the
// batch call it, so the ledger has one walk rather than one per reader.
func spendFromFields(fields map[string]string) (total, unaccounted int) {
	for field, value := range fields {
		cost, err := strconv.Atoi(value)
		if err != nil {
			continue
		}
		total += cost

		// A field that does not parse still counts against the bucket - Redis
		// says the tokens are spent - but nothing can be claimed about who spent
		// them, so it is never read as the sync marker.
		parsed, ok := parseLedgerField(field)
		if ok && parsed.IsSync() {
			unaccounted += cost
		}
	}
	return total, unaccounted
}

// Observe records whether the servers answered, from a caller that has no
// bucket and spends no token.
//
// EVE SSO is the case this exists for: token rotation talks to
// login.eveonline.com, is stopped by the same outage as everything else, and is
// not rate limited. Its failures are evidence like any other, and its successes
// clear the gate — if SSO is answering, the servers are back.
//
// source names where the observation came from. An outage is concluded from
// failures spreading across sources, so SSO counts as one rather than being
// folded into a bucket it does not have.
func (s *Store) Observe(ctx context.Context, source string, reachable bool) error {
	availability := -1
	if reachable {
		availability = 1
	}

	err := s.redis.Run(ctx, s.observe,
		[]string{downtimeKey},
		observeArgs.values(map[string]any{
			"state_key":       "source:" + source,
			"availability":    availability,
			"observed_at":     float64(time.Now().UnixNano()) / 1e9,
			"trip_after":      failuresBeforeConcluding,
			"probe_first":     downtimeProbeFirst.Seconds(),
			"probe_max":       downtimeProbeMax.Seconds(),
			"buckets_to_trip": sourcesToTripDowntime,
			"lone_failures":   loneSourceFailures,
		})...,
	).Err()
	if err != nil {
		return fmt.Errorf("observe %s: %w", source, err)
	}
	return nil
}

// Downtime reports what the fleet currently believes about availability.
func (s *Store) Downtime(ctx context.Context) (DowntimeState, error) {
	fields, err := s.redis.Fields(ctx, downtimeKey)
	if err != nil {
		return DowntimeState{}, fmt.Errorf("downtime: %w", err)
	}
	return DowntimeState{
		Gated:     fields["gated"] == "1",
		NextProbe: unixFloat(fields["next_probe"]),
		Failures:  atoiOr(fields["failures"], 0),
		LastOK:    unixFloat(fields["last_ok"]),
	}, nil
}

// ttlPathGroup is how long a learned path-to-group mapping is trusted. ESI
// changes them rarely, and a stale one costs one misrouted call before the
// response discloses the right group again.
const ttlPathGroup = 24 * time.Hour

// LearnGroup records which rate limit group a path belongs to, as the response
// disclosed it, so the next call to that path knows its bucket before it starts.
func (s *Store) LearnGroup(ctx context.Context, path, group string) error {
	if path == "" || group == "" {
		return nil
	}
	return s.redis.PutString(ctx, pathKey(path), group, ttlPathGroup)
}

// GroupFor returns the group a path was last seen to belong to.
func (s *Store) GroupFor(ctx context.Context, path string) (string, bool, error) {
	group, err := s.redis.GetString(ctx, pathKey(path))
	switch {
	case eipredis.IsNotFound(err):
		return "", false, nil
	case err != nil:
		return "", false, fmt.Errorf("group for %s: %w", path, err)
	default:
		return group, group != "", nil
	}
}

// ErrorCount is how many non-2xx/3xx responses the fleet has taken this minute,
// which the 420 guard watches.
func (s *Store) ErrorCount(ctx context.Context) (int, error) {
	count, err := s.redis.GetInt(ctx, errorKey(time.Now()))
	switch {
	case eipredis.IsNotFound(err):
		return 0, nil
	case err != nil:
		return 0, fmt.Errorf("error count: %w", err)
	default:
		return count, nil
	}
}

// Buckets is every bucket Redis holds state for, for gauges and for the
// operator CLI. The fleet shares this state, so it reports what every replica
// has learned, not only what this process has touched.
func (s *Store) Buckets(ctx context.Context) ([]Bucket, error) {
	const suffix = ":state"
	prefix := keyPrefix + "b:"

	var out []Bucket
	err := s.redis.ScanPrefix(ctx, prefix, func(keys []string) error {
		for _, key := range keys {
			name, ok := strings.CutPrefix(key, prefix)
			if !ok {
				continue
			}
			name, ok = strings.CutSuffix(name, suffix)
			if !ok {
				continue
			}
			bucket, ok := bucketFromKey(name)
			if !ok {
				continue
			}
			out = append(out, bucket)
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("scan bucket state: %w", err)
	}

	slices.SortFunc(out, func(a, b Bucket) int { return strings.Compare(a.Key(), b.Key()) })
	return out, nil
}

// Forget drops the allowance the limiter learned from ESI, so the next call
// rediscovers it. Everything else about the bucket is left alone.
//
// Two things must survive, and deleting the whole state hash destroys both.
// The ledger records spend inside a window ESI is still counting, so dropping
// it lets every replica spend the same budget again and earn a 429. The
// "metered" flag is what makes the limiter consult that ledger at all — clear
// it and the bucket is treated as untracked, which spends without accounting
// just as effectively as an empty ledger would.
//
// With the allowance gone and metered intact, the bucket falls into discovery:
// one caller probes, the rest wait on it, and normal accounting resumes against
// the ledger that was never lost.
func (s *Store) Forget(ctx context.Context, b Bucket) (int64, error) {
	deleted, err := s.redis.RemoveFields(ctx, stateKey(b), "limit", "window", "remaining", "observed_at")
	if err != nil {
		return 0, fmt.Errorf("forget %s: %w", b.Key(), err)
	}
	return deleted, nil
}
