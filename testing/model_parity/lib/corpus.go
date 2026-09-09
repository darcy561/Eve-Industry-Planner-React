package modelparity

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// Corpus writes each document as the API serialises it, one JSON object per line.
//
// The SPA parity test needs what a client is actually handed, which is the model
// marshalled to JSON — not the stored document. Anything the model drops on the
// way out is already gone by the time the file is written, which is what makes
// the file a fair input to the class under test.
func Corpus[T any](ctx context.Context, coll *mongo.Collection, path string) (int, error) {
	if coll == nil {
		return 0, fmt.Errorf("modelparity: corpus: nil collection")
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return 0, fmt.Errorf("modelparity: corpus dir: %w", err)
	}
	file, err := os.Create(path)
	if err != nil {
		return 0, fmt.Errorf("modelparity: corpus file: %w", err)
	}
	defer file.Close()

	buffered := bufio.NewWriter(file)
	encoder := json.NewEncoder(buffered)

	cursor, err := coll.Find(ctx, bson.D{})
	if err != nil {
		return 0, fmt.Errorf("modelparity: corpus find: %w", err)
	}
	defer cursor.Close(ctx)

	written := 0
	for cursor.Next(ctx) {
		var model T
		if err := cursor.Decode(&model); err != nil {
			continue
		}
		if err := encoder.Encode(model); err != nil {
			return written, fmt.Errorf("modelparity: corpus encode: %w", err)
		}
		written++
	}
	if err := cursor.Err(); err != nil {
		return written, fmt.Errorf("modelparity: corpus iterate: %w", err)
	}
	if err := buffered.Flush(); err != nil {
		return written, fmt.Errorf("modelparity: corpus flush: %w", err)
	}
	return written, nil
}
