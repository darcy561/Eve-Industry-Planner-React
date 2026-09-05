package server

import "eve-industry-planner/shared/models"

func (s *Server) addToOwnerPoolsLocked(client *Client) {
	if client == nil || client.id == "" {
		return
	}
	client.Scopes.Each(func(key string) {
		if s.ownerKeyToClients[key] == nil {
			s.ownerKeyToClients[key] = make(map[string]bool)
		}
		s.ownerKeyToClients[key][client.id] = true
	})
}

func (s *Server) removeFromOwnerPoolsLocked(client *Client) {
	if client == nil || client.id == "" {
		return
	}
	client.Scopes.Each(func(key string) {
		pool := s.ownerKeyToClients[key]
		if pool == nil {
			return
		}
		delete(pool, client.id)
		if len(pool) == 0 {
			delete(s.ownerKeyToClients, key)
		}
	})
}

// setClientScopes replaces a client's scopes and moves it between owner pools to
// match, as one locked step so no fan-out sees the two disagree.
func (s *Server) setClientScopes(client *Client, next models.OwnerKeys) {
	s.ownerIndexMu.Lock()
	s.removeFromOwnerPoolsLocked(client)
	client.Scopes = next
	s.addToOwnerPoolsLocked(client)
	s.ownerIndexMu.Unlock()
	s.scheduleDocFanoutFilterReconcile()
}

// removeClientFromOwnerPools drops a client from every pool its scopes name, for
// a connection that is going away.
func (s *Server) removeClientFromOwnerPools(client *Client) {
	s.ownerIndexMu.Lock()
	s.removeFromOwnerPoolsLocked(client)
	s.ownerIndexMu.Unlock()
	s.scheduleDocFanoutFilterReconcile()
}

// clientsForOwner snapshots the clients receiving an owner's changes.
//
// A zero owner returns nothing: its key addresses no pool, and indexing on it
// would read one shared bucket rather than failing.
func (s *Server) clientsForOwner(owner models.Owner) []string {
	if owner.IsZero() {
		return nil
	}
	s.ownerIndexMu.RLock()
	defer s.ownerIndexMu.RUnlock()
	return copyClientIDSet(s.ownerKeyToClients[owner.Key()])
}
