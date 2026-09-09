// Package modelparity sweeps every document in a live Mongo and reports where the
// Go models and the stored data disagree.
//
// The live parity tests under services/shared/mongo assert one behaviour against
// a scratch account. This sweeps the whole corpus instead and reports a census:
// what fails to decode, what changes value on a decode/encode round trip, and
// which stored fields no model writes back.
//
// A field no model writes back is not lost — the upsert builds $set from the
// struct, so an unmodelled key stays on disk untouched and drifts from whatever
// replaced it. Finding those is most of the point.
//
// CLI: go build -o ../.tmp/model_parity ./model_parity
// Tests: go test ./model_parity/lib/...
//
// The corpus phase writes the job documents as the API serialises them, which is
// the input to the SPA-class parity test in frontend/src/Classes. It carries real
// account data: it is written under .tmp and must not be committed.
package modelparity
