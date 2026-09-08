package models

import "time"

// MetaData is the shared `_meta` block every scoped document carries.
//
// ClientID is the WebSocket tab id (X-WS-Client-ID) of the write that last
// touched the document, for changestream / WS echo suppression.
//
// Owner has no JSON tag deliberately: for the org kinds its id is a ref, so a
// response naming an owner builds a handle instead.
// Version counts writes to this document. Nothing reads it yet: it is seeded so
// the conditional write that will compare it never meets a document without one.
// Zero means unversioned.
type MetaData struct {
	LastModified time.Time `bson:"lastModified" json:"lastModified"`
	Owner        Owner     `bson:"owner" json:"-"`
	Version      int64     `bson:"version,omitempty" json:"version,omitempty"`
	ClientID     string    `bson:"clientID,omitempty" json:"clientID,omitempty"`
	SessionID    string    `bson:"sessionID,omitempty" json:"sessionID,omitempty"`
}

// MetaFieldOwner is the `_meta` key holding the owner, for the changestream,
// which reads a raw subdocument with no struct to decode into.
const MetaFieldOwner = "owner"

// MetaFieldVersion is the `_meta` key holding the write counter.
const MetaFieldVersion = "version"

// InitialDocumentVersion is the version a document is seeded with.
const InitialDocumentVersion int64 = 1
