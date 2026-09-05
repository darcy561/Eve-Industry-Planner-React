package server

import (
	"sort"
	"strings"

	"eve-industry-planner/shared/models"
)

// Hosted-tenant helpers are a read-only view over connection indexes already maintained
// for fan-out and per-account caps — no second store:
//
//	account:{id}  → userConnections (non-empty client set)
//	every other   → ownerKeyToClients, already keyed by the tenant key itself
//
// "Hosted" means the outer map has that id with at least one client id — not the size of
// Clients. Socket load for soft/full still uses len(Clients).
//
// Lock order when taking both: userConnMu, then ownerIndexMu.

// HostsTenant reports whether this replica has any local client for the tenant key.
func (s *Server) HostsTenant(tenantKey string) bool {
	if s == nil {
		return false
	}
	owner, err := models.ParseOwnerKey(strings.TrimSpace(tenantKey))
	if err != nil {
		return false
	}
	if owner.Kind == models.OwnerAccount {
		s.userConnMu.RLock()
		hosted := len(s.userConnections[owner.ID]) > 0
		s.userConnMu.RUnlock()
		return hosted
	}
	return len(s.clientsForOwner(owner)) > 0
}

// HostedTenants returns a sorted snapshot of tenant keys this replica hosts
// (one entry per owner with a local client).
func (s *Server) HostedTenants() []string {
	if s == nil {
		return nil
	}
	s.userConnMu.RLock()
	s.ownerIndexMu.RLock()
	out := make([]string, 0, len(s.userConnections)+len(s.ownerKeyToClients))
	for id, clients := range s.userConnections {
		if len(clients) == 0 {
			continue
		}
		if owner := models.AccountOwner(id); owner.Validate() == nil {
			out = append(out, owner.Key())
		}
	}
	for key, clients := range s.ownerKeyToClients {
		if len(clients) == 0 {
			continue
		}
		if _, err := models.ParseOwnerKey(key); err != nil {
			continue
		}
		out = append(out, key)
	}
	s.ownerIndexMu.RUnlock()
	s.userConnMu.RUnlock()
	sort.Strings(out)
	return out
}

// HostedTenantCount returns the number of distinct hosted tenant keys
// (accounts plus every other owner), not the number of sockets.
func (s *Server) HostedTenantCount() int {
	if s == nil {
		return 0
	}
	s.userConnMu.RLock()
	s.ownerIndexMu.RLock()
	n := 0
	for _, clients := range s.userConnections {
		if len(clients) > 0 {
			n++
		}
	}
	for _, clients := range s.ownerKeyToClients {
		if len(clients) > 0 {
			n++
		}
	}
	s.ownerIndexMu.RUnlock()
	s.userConnMu.RUnlock()
	return n
}
