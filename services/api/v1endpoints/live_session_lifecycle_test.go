// The session lifecycle where it reaches Mongo: a login that completes, and a
// rotation that completes.
//
// The rejection paths are covered without Mongo in session_lifecycle_test.go.
// These are the other half — what a browser actually receives when it logs in,
// and what is in Redis afterwards — and they need the documents a login
// resolves, so they run only against the stack's Mongo.
//
// Requires EIP_MONGO_PARITY_LIVE=1.
package v1endpoints_test

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"eve-industry-planner/api/apideps"
	"eve-industry-planner/api/helper/auth"
	"eve-industry-planner/api/v1endpoints"
	"eve-industry-planner/shared/models"
	"eve-industry-planner/shared/models/planner"
	eipmongo "eve-industry-planner/shared/mongo"
	eipredis "eve-industry-planner/shared/redis"
	"eve-industry-planner/shared/stackservices"
	"eve-industry-planner/testing/esifake"
	"eve-industry-planner/testing/evessofake"
	"eve-industry-planner/testing/mongolive"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// liveScratchHash is the character a live login test signs in as. The account
// id derives from it by stripping non-alphanumerics, so the documents to remove
// afterwards are known before the test runs.
const liveScratchHash = "eip-live-session-lifecycle"

func liveScratchAccount() string {
	return auth.GetAccountIDFromCharacterHash(liveScratchHash)
}

// liveSession is the session harness with real Mongo behind it. Redis stays a
// fake: sessions are what these tests assert on, and a shared Redis would let
// one run's keys reach another's.
type liveSession struct {
	*session
	mongo *eipmongo.Mongo
	sso   *evessofake.Server
}

func newLiveSession(t *testing.T) *liveSession {
	t.Helper()

	mongo := mongolive.Require(t)
	base := newSession(t)
	sso := base.withSSO(t)
	sso.SetCharacter(evessofake.Character{
		ID: "90000001", Name: "Scratch Pilot", Hash: liveScratchHash,
	})

	fake := base.fake
	deps := apideps.FromClients(
		&stackservices.Clients{Mongo: mongo, Redis: eipredis.NewRedis(fake.Client)}, nil, esifake.New(t), nil)

	live := &liveSession{
		session: &session{handlers: v1endpoints.New(deps), redis: eipredis.NewRedis(fake.Client), fake: fake},
		mongo:   mongo,
		sso:     sso,
	}
	t.Cleanup(func() { live.removeScratchAccount(t) })
	live.removeScratchAccount(t)
	return live
}

// removeScratchAccount deletes what a login creates, so a run leaves the stack's
// database as it found it. Run before as well as after: a previous run that
// died mid-test would otherwise make the next one read a first login as a
// returning one.
func (s *liveSession) removeScratchAccount(t *testing.T) {
	t.Helper()
	ctx := context.Background()

	accountID := liveScratchAccount()
	owner := models.AccountOwner(accountID)

	for _, target := range []struct {
		docs   *eipmongo.Docs
		filter bson.M
	}{
		{s.mongo.Users, bson.M{"_id": accountID}},
		{s.mongo.ApplicationSettings, bson.M{"_id": accountID}},
		{s.mongo.Planners, bson.M{"_id": owner.Key()}},
		{s.mongo.PlannerMemberships, bson.M{"_id": planner.MembershipID(owner.Key(), accountID)}},
		{s.mongo.PlannerSettings, bson.M{"_id": owner.Key()}},
	} {
		if _, err := target.docs.Collection().DeleteMany(ctx, target.filter); err != nil {
			t.Fatalf("clean up %v: %v", target.filter, err)
		}
	}
}

// loginResponse is the part of the login body these tests read. The handler
// sends more; a test that named every field would fail on an unrelated
// addition.
type loginResponse struct {
	RefreshToken string `json:"refresh_token"`
	SessionID    string `json:"session_id"`
	FirstLogin   bool   `json:"first_login"`
}

func (s *liveSession) login(t *testing.T, token string) (*loginResponse, int) {
	t.Helper()

	rec := s.post(t, s.handlers.AuthHandler, "/api/v1/auth/eve-token",
		map[string]string{"token": token}, nil)
	if rec.Code != http.StatusOK {
		return nil, rec.Code
	}

	var out loginResponse
	if err := json.NewDecoder(rec.Body).Decode(&out); err != nil {
		t.Fatalf("decode login response: %v", err)
	}
	return &out, rec.Code
}

// A completed login hands the browser credentials and leaves them in Redis.
// Every rejection test asserts that nothing is minted; this is the one that
// says something is.
func TestLive_loginMintsASessionTheBrowserCanUse(t *testing.T) {
	s := newLiveSession(t)

	body, status := s.login(t, s.sso.AccessToken())
	if status != http.StatusOK {
		t.Fatalf("login = %d", status)
	}

	if strings.TrimSpace(body.RefreshToken) == "" {
		t.Fatal("login returned no refresh token")
	}
	if strings.TrimSpace(body.SessionID) == "" {
		t.Fatal("login returned no session id")
	}

	// What the browser was handed is what is stored, or the next request fails.
	if !s.stored(auth.RefreshTokenKeyPrefix + body.RefreshToken) {
		t.Error("the refresh token handed to the browser is not stored")
	}
	if !s.stored(auth.SessionIndexKeyPrefix + body.SessionID) {
		t.Error("the session id handed to the browser has no index")
	}
	if !s.stored(auth.AccountSessionsKeyPrefix + liveScratchAccount()) {
		t.Error("the account has no sessions record")
	}
}

// An account signing in for the first time is told so, and signing in again is
// not a first login. The flag drives what the SPA shows, and it is derived from
// the documents the login creates.
func TestLive_loginReportsTheFirstLoginOnce(t *testing.T) {
	s := newLiveSession(t)

	first, status := s.login(t, s.sso.AccessToken())
	if status != http.StatusOK {
		t.Fatalf("first login = %d", status)
	}
	if !first.FirstLogin {
		t.Error("a new account was not reported as a first login")
	}

	second, status := s.login(t, s.sso.AccessToken())
	if status != http.StatusOK {
		t.Fatalf("second login = %d", status)
	}
	if second.FirstLogin {
		t.Error("a returning account was reported as a first login")
	}

	// Two logins are two sessions, and both remain usable.
	if first.SessionID == second.SessionID {
		t.Error("the second login reused the first session id")
	}
	for _, token := range []string{first.RefreshToken, second.RefreshToken} {
		if !s.stored(auth.RefreshTokenKeyPrefix + token) {
			t.Errorf("token %q is not stored", token)
		}
	}
}

// Logging out ends the session the browser holds, and only that one. This is
// the lifecycle closing: login → logout, through the real handlers.
func TestLive_loginThenLogoutEndsOnlyThatSession(t *testing.T) {
	s := newLiveSession(t)

	keep, status := s.login(t, s.sso.AccessToken())
	if status != http.StatusOK {
		t.Fatalf("first login = %d", status)
	}
	ending, status := s.login(t, s.sso.AccessToken())
	if status != http.StatusOK {
		t.Fatalf("second login = %d", status)
	}

	rec := s.post(t, s.handlers.LogoutHandler, "/api/v1/sessions/logout",
		v1endpoints.LogoutRequest{RefreshToken: ending.RefreshToken},
		&identity{accountID: liveScratchAccount(), sessionID: ending.SessionID})
	if rec.Code != http.StatusNoContent {
		t.Fatalf("logout = %d, body %s", rec.Code, rec.Body.String())
	}

	if s.stored(auth.RefreshTokenKeyPrefix + ending.RefreshToken) {
		t.Error("the logged-out token is still stored")
	}
	if !s.stored(auth.RefreshTokenKeyPrefix + keep.RefreshToken) {
		t.Error("logging out of one session ended another")
	}
}
