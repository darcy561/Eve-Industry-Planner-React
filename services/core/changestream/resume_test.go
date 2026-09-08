package changestream

import (
	"fmt"
	"testing"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func TestResumeTokenFromEvent(t *testing.T) {
	idDoc := bson.M{"_data": "abc"}
	evt := bson.M{"_id": idDoc, "operationType": "insert"}
	raw, err := resumeTokenFromEvent(evt)
	if err != nil {
		t.Fatal(err)
	}
	if len(raw) == 0 {
		t.Fatal("empty token")
	}
	if _, err := resumeTokenFromEvent(bson.M{}); err == nil {
		t.Fatal("expected error")
	}
}

func TestIsInvalidResumeError(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name string
		err  error
		want bool
	}{
		{"nil", nil, false},
		{"286", mongo.CommandError{Code: 286, Message: "ChangeStreamHistoryLost"}, true},
		{"280", mongo.CommandError{Code: 280, Message: "ChangeStreamFatalError"}, true},
		{"260", mongo.CommandError{Code: 260, Message: "NonResumable"}, true},
		{"other code", mongo.CommandError{Code: 1, Message: "other"}, false},
		{"FailedToParse resume token", mongo.CommandError{Code: 9, Name: "FailedToParse", Message: "resume token string was not a valid hex string"}, true},
		{"FailedToParse unrelated", mongo.CommandError{Code: 9, Name: "FailedToParse", Message: "could not parse query"}, false},
		{"string corrupt hex", fmt.Errorf("(FailedToParse) resume token string was not a valid hex string"), true},
		{"wrapped 286", fmt.Errorf("watch: %w", mongo.CommandError{Code: 286, Message: "ChangeStreamHistoryLost"}), true},
		{"network no resume", fmt.Errorf("connection refused"), false},
		{"resume alone", fmt.Errorf("will resume shortly"), false},
		{"hex without resume", fmt.Errorf("invalid hex encoding"), false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			if got := isInvalidResumeError(tc.err); got != tc.want {
				t.Fatalf("isInvalidResumeError(%v)=%v want %v", tc.err, got, tc.want)
			}
		})
	}
}
