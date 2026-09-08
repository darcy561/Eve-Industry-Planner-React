package changestream

import (
	"errors"
	"fmt"
	"strings"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// resumeTokenFromEvent extracts the Mongo change-stream resume token (_id).
func resumeTokenFromEvent(changeEvent bson.M) (bson.Raw, error) {
	id, ok := changeEvent["_id"]
	if !ok || id == nil {
		return nil, fmt.Errorf("change event missing _id resume token")
	}
	if raw, ok := id.(bson.Raw); ok {
		return raw, nil
	}
	b, err := bson.Marshal(id)
	if err != nil {
		return nil, fmt.Errorf("marshal resume token: %w", err)
	}
	return bson.Raw(b), nil
}

// isInvalidResumeError reports tokens that cannot be resumed (clear + cold start).
func isInvalidResumeError(err error) bool {
	if err == nil {
		return false
	}
	if cmd, ok := errors.AsType[mongo.CommandError](err); ok {
		// 286 ChangeStreamHistoryLost, 280 ChangeStreamFatalError, 260 NonResumableChangeStreamError
		switch cmd.Code {
		case 286, 280, 260:
			return true
		}
		// Corrupt StartAfter often surfaces as FailedToParse (code 9) with a resume-token message.
		if (cmd.Code == 9 || strings.EqualFold(cmd.Name, "FailedToParse")) &&
			strings.Contains(strings.ToLower(cmd.Message), "resume") {
			return true
		}
	}
	msg := strings.ToLower(err.Error())
	if !strings.Contains(msg, "resume") {
		return false
	}
	// History-lost wording, missing token, or corrupt StartAfter text when codes aren't unwrapable.
	if strings.Contains(msg, "history") ||
		strings.Contains(msg, "not found") ||
		strings.Contains(msg, "invalid") ||
		strings.Contains(msg, "malformed") ||
		strings.Contains(msg, "failedtoparse") {
		return true
	}
	// e.g. "resume token string was not a valid hex string"
	return strings.Contains(msg, "token") && (strings.Contains(msg, "hex") || strings.Contains(msg, "parse"))
}
