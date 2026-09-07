package nats

// The vocabulary a realtime message uses to describe itself to a browser.
//
// Two fields rather than one: a family says how to route the message at all, and
// a kind says what to do with it inside that family. Before them, "this is a
// document change" was implicit in the shape, so anything that was not one had
// nowhere to go and was dropped without a word.
const (
	// ClientMessageDocument is a change to a document, carrying its collection
	// and body. Producers of these predate the field and send none, so an absent
	// family reads as this one.
	ClientMessageDocument = "document"
	// ClientMessageNotification carries no document. It says something happened,
	// and the client decides whether it cares.
	ClientMessageNotification = "notification"
	// ClientMessageMaintenance says the stack entered a maintenance window. It is
	// sent to every connected client immediately before its socket is closed.
	ClientMessageMaintenance = "maintenance"
)

// Notification kinds within [ClientMessageNotification].
const (
	// NotificationArchiveStatsProcessed says an owner's archived-job statistics
	// have been written. It carries no figures: a client that is not showing them
	// has nothing to do, and one that is refetches what it has on screen.
	NotificationArchiveStatsProcessed = "archiveStatsProcessed"
)

// ClientMessageKinds is the vocabulary itself, family to kinds.
//
// The SPA cannot import these, so both sides are checked against one shared
// corpus — `testing/fixtures/realtime-messages/kinds.json` — and adding a kind
// here without adding it there fails the test.
var ClientMessageKinds = map[string][]string{
	ClientMessageDocument:     {},
	ClientMessageNotification: {NotificationArchiveStatsProcessed},
	ClientMessageMaintenance:  {},
}

// MaintenanceMessage is a [ClientMessageMaintenance] frame. Flat rather than
// enveloped, like the other frames the websocket server originates.
type MaintenanceMessage struct {
	Type    string `json:"type"`
	Enabled bool   `json:"enabled"`
	Message string `json:"message"`
}

// ArchiveStatsProcessedNotification is the body of a
// [NotificationArchiveStatsProcessed] message.
//
// The owner is named so a client holding more than one can tell whose figures
// moved, and the timestamp is what was written rather than when the message was
// sent, so a client can tell two notifications apart.
type ArchiveStatsProcessedNotification struct {
	OwnerKind   string `json:"ownerKind"`
	AccountID   string `json:"accountID"`
	ProcessedAt string `json:"processedAt"`
}
