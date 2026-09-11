import { useEffect, useEffectEvent, useRef } from "react";
import { useDialogueEventState } from "./useDialogueEventState";

/**
 * Subscribes via {@link useDialogueEventState} and applies `applyPayload` when the
 * serialised snapshot changes, skipping the first snapshot (no spurious apply on mount).
 *
 * @template T
 * @param {string} eventName
 * @param {() => T} getInitialState
 * @param {(data: T) => string} serialise
 * @param {(data: T) => void} applyPayload
 * @param {{ enabled?: boolean }} [options] - When `enabled` is false, skips sync (ref unchanged), matching assets-dialogue guard while logged out.
 * @returns {[T, import("react").Dispatch<import("react").SetStateAction<T>>, () => void]}
 */
export function useSyncedDialogueEventState(
  eventName,
  getInitialState,
  serialize,
  applyPayload,
  options = {},
) {
  const { enabled = true } = options;
  const tuple = useDialogueEventState(eventName, getInitialState);
  const messageData = tuple[0];
  const lastSerialized = useRef(null);

  // Both callbacks are rebuilt every render, closing over the state they read.
  // As an effect event this always runs the latest pair without the snapshot
  // itself counting as a change, which is what decides when the sync runs.
  const syncSnapshot = useEffectEvent((data) => {
    const serialized = serialize(data);
    if (lastSerialized.current === serialized) {
      return;
    }
    if (lastSerialized.current !== null) {
      applyPayload(data);
    }
    lastSerialized.current = serialized;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    syncSnapshot(messageData);
  }, [enabled, messageData]);

  return tuple;
}
