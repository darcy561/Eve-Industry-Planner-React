package primaryhandoff

import (
	"context"
	"encoding/base64"
	"slices"
	"testing"

	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/testing/redisfake"

	"go.mongodb.org/mongo-driver/v2/bson"

	"github.com/redis/go-redis/v9"
)

func store(t *testing.T, fake *redisfake.Redis) *ResumeTokens {
	t.Helper()
	handle := eipredis.NewRedis(fake.Client)
	return NewResumeTokens(handle)
}

func TestResumeTokenRoundTrips(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	token := bson.Raw([]byte{0x16, 0x00, 0x00, 0x00})
	s.Save(ctx, "planner", token)

	got, found := s.Load(ctx, "planner")
	if !found {
		t.Fatalf("load = %v, %v", got, found)
	}
	if !slices.Equal(got, token) {
		t.Fatalf("token = %v, want %v", got, token)
	}
}

// The value the old code wrote must still read back, or a deploy loses every
// group's position and cold-starts its change stream.
func TestResumeTokenReadsWhatTheOldCodeWrote(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)

	token := bson.Raw([]byte{0x16, 0x00, 0x00, 0x00})
	encoded := base64.StdEncoding.EncodeToString(token)
	if err := fake.Client.Set(ctx, ResumeTokenKey("planner"), encoded, 0).Err(); err != nil {
		t.Fatalf("seed: %v", err)
	}

	got, found := store(t, fake).Load(ctx, "planner")
	if !found {
		t.Fatalf("load = %v, %v", got, found)
	}
	if !slices.Equal(got, token) {
		t.Fatalf("token = %v, want %v", got, token)
	}
}

// A value that is not base64 is read as its own bytes rather than discarded.
func TestResumeTokenReadsAnUnencodedValue(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)

	raw := "\x16\x00\x00\x00"
	if err := fake.Client.Set(ctx, ResumeTokenKey("planner"), raw, 0).Err(); err != nil {
		t.Fatalf("seed: %v", err)
	}

	got, found := store(t, fake).Load(ctx, "planner")
	if !found {
		t.Fatalf("load = %v, %v", got, found)
	}
	if string(got) != raw {
		t.Fatalf("token = %q, want %q", got, raw)
	}
}

func TestResumeTokenWritesTheSameKey(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)

	store(t, fake).Save(ctx, "planner", bson.Raw([]byte{1}))

	const want = "eip:core:handoff:v1:cs:resume:planner"
	if !fake.Server.Exists(want) {
		t.Fatalf("key %q was not written; keys = %v", want, fake.Server.Keys())
	}
	// A resume token outlives the process that wrote it.
	if ttl := fake.Server.TTL(want); ttl != 0 {
		t.Fatalf("ttl = %v, want none", ttl)
	}
}

func TestResumeTokenAbsentIsNotAnError(t *testing.T) {
	got, found := store(t, redisfake.New(t)).Load(context.Background(), "planner")
	if found || got != nil {
		t.Fatalf("load = %v, %v; want absent", got, found)
	}
}

// A token is a position, not the data, so an unreachable Redis means a cold
// start rather than a failure the change stream has to handle.
func TestResumeTokenTreatsAnUnreachableRedisAsAColdStart(t *testing.T) {
	ctx := context.Background()

	for name, s := range map[string]*ResumeTokens{
		"no handle": NewResumeTokens(nil),
		"a server that refuses": NewResumeTokens(eipredis.NewRedis(
			redis.NewClient(&redis.Options{Addr: "127.0.0.1:1"}))),
	} {
		t.Run(name, func(t *testing.T) {
			if got, found := s.Load(ctx, "planner"); found || got != nil {
				t.Errorf("load = %v, %v; want a cold start", got, found)
			}
			// Neither of these may panic or block: the caller has no error to take.
			s.Save(ctx, "planner", bson.Raw([]byte{1}))
			s.Clear(ctx, "planner")
		})
	}
}

func TestResumeTokenIgnoresAnEmptyGroup(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	s.Save(ctx, "  ", bson.Raw([]byte{1}))
	if _, found := s.Load(ctx, ""); found {
		t.Fatal("an empty group id resolved to a token")
	}
	if keys := fake.Server.Keys(); len(keys) != 0 {
		t.Fatalf("an empty group id wrote %v", keys)
	}
}

func TestResumeTokenClear(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	s.Save(ctx, "planner", bson.Raw([]byte{1}))
	s.Clear(ctx, "planner")
	if _, found := s.Load(ctx, "planner"); found {
		t.Fatal("token survived a clear")
	}
	// Clearing what is not there is a no-op.
	s.Clear(ctx, "planner")
}

// A group id is trimmed everywhere or nowhere: trimming only the check writes a
// key that the same id cannot read back.
func TestResumeTokenTrimsTheGroupEverywhere(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	s.Save(ctx, " planner ", bson.Raw([]byte{0x16}))

	if !fake.Server.Exists(ResumeTokenKey("planner")) {
		t.Fatalf("untrimmed save wrote %v", fake.Server.Keys())
	}
	if _, found := s.Load(ctx, "planner"); !found {
		t.Fatal("a token saved under an untrimmed id could not be read back")
	}
	if _, found := s.Load(ctx, " planner "); !found {
		t.Fatal("an untrimmed id could not read its own token")
	}
}

func TestResumeTokenStoredListsEveryGroup(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	want := []string{"planner", "jobs", "groups"}
	for _, groupID := range want {
		s.Save(ctx, groupID, bson.Raw([]byte{1}))
	}
	// A key under the handoff prefix but not a resume token must not be listed.
	if err := fake.Client.Set(ctx, Prefix+"other", "v", 0).Err(); err != nil {
		t.Fatalf("seed other: %v", err)
	}

	got, err := s.Stored(ctx)
	if err != nil {
		t.Fatalf("stored: %v", err)
	}
	slices.Sort(got)
	slices.Sort(want)
	if !slices.Equal(got, want) {
		t.Fatalf("stored = %v, want %v", got, want)
	}
}

func TestResumeTokenDrop(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := store(t, fake)

	for _, groupID := range []string{"planner", "retired"} {
		s.Save(ctx, groupID, bson.Raw([]byte{1}))
	}

	if err := s.Drop(ctx, "retired"); err != nil {
		t.Fatalf("drop: %v", err)
	}
	if err := s.Drop(ctx); err != nil {
		t.Fatalf("drop nothing: %v", err)
	}

	got, err := s.Stored(ctx)
	if err != nil {
		t.Fatalf("stored: %v", err)
	}
	if !slices.Equal(got, []string{"planner"}) {
		t.Fatalf("stored = %v, want [planner]", got)
	}
}

// A key built for a group names the key that group's token was stored under,
// whatever whitespace the id carries. The store trims on every read and write,
// so a builder that did not would address a key nothing wrote.
func TestResumeTokenKeyMatchesWhatTheStoreWrote(t *testing.T) {
	ctx := context.Background()
	fake := redisfake.New(t)
	s := NewResumeTokens(eipredis.NewRedis(fake.Client))

	s.Save(ctx, " spacey ", bson.Raw([]byte{5, 0, 0, 0, 0}))
	if !fake.Server.Exists(ResumeTokenKey(" spacey ")) {
		t.Errorf("the key builder names %q, which holds nothing", ResumeTokenKey(" spacey "))
	}
}
