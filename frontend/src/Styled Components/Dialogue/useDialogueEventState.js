import { useCallback, useEffect, useState } from "react";
import { subscribeToEvent } from "../../utils/EventSystem";

/**
 * Subscribes to an app event and merges payloads into dialogue state (skips `undefined` only;
 * explicit `null` is merged so callers can clear a field).
 * Use with {@link ContentDialogue} for the same open/merge pattern as legacy market/history dialogueues.
 *
 * @template T
 * @param {string} eventName - Event name passed to {@link subscribeToEvent}
 * @param {() => T} getInitialState - Factory for initial state (also used when {@link reset} runs)
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>, () => void]} state, setState, reset
 */
export function useDialogueEventState(eventName, getInitialState) {
  // Held rather than called again: `reset` has to hand back what the dialogue
  // opened with, and a factory called on every render would build a new object
  // each time for a value only the first render keeps.
  const [initial] = useState(getInitialState);
  const [state, setState] = useState(initial);

  useEffect(() => {
    return subscribeToEvent(eventName, (data) => {
      setState((prev) => {
        const next = { ...prev };
        if (data && typeof data === "object") {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
              next[key] = value;
            }
          });
        }
        return next;
      });
    });
  }, [eventName]);

  const reset = useCallback(() => {
    setState({ ...initial });
  }, [initial]);

  return [state, setState, reset];
}
