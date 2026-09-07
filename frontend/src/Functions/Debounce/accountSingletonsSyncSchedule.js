/**
 * Collapses burst NATS deliveries (users + application_settings saves) into one API round-trip.
 */

import { syncAccountDocumentsFromServer } from "../../Realtime/syncAccountDocumentsFromServer.js";
import { createPersistDebounce } from "./helpers/createPersistDebounce.js";

const debounce = createPersistDebounce({
  delayMs: 120,
  shouldSchedule: () => true,
  onRun: () => {
    void syncAccountDocumentsFromServer();
  },
});

export function scheduleDebouncedAccountDocumentsSync() {
  debounce.schedule();
}
