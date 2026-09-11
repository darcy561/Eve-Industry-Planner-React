import { useCallback, useMemo, useState } from "react";
import useUsersStore from "../Zustand/usersStore";
import {
  buildJobStatusesDisplayList,
  readJobStatusExpandedMap,
  writeJobStatusExpandedMap,
} from "../Functions/Helper/jobStatuses";
import { useHasChanged } from "./useHasChanged";

/**
 * Planner job workflow stages: fixed ids/order, labels from application settings,
 * accordion expansion from localStorage (per account).
 *
 * @returns {{
 *   jobStatuses: Array<{ id: number, name: string, expanded: boolean, order: number }>,
 *   toggleExpanded: (id: number) => void,
 * }}
 */
export function useJobStatuses() {
  const accountId = useUsersStore((state) => state.account.accountID);
  const namesMap = useUsersStore(
    (state) => state.applicationSettings.jobStatuses,
  );

  const [expandedMap, setExpandedMap] = useState(() =>
    readJobStatusExpandedMap(accountId),
  );
  // The planner stays mounted across a sign-out, so the stages follow the
  // account rather than keeping the previous reader's.
  if (useHasChanged(accountId)) {
    setExpandedMap(readJobStatusExpandedMap(accountId));
  }

  const jobStatuses = useMemo(
    () => buildJobStatusesDisplayList(namesMap, expandedMap),
    [namesMap, expandedMap],
  );

  const toggleExpanded = useCallback(
    (id) => {
      const key = String(id);
      setExpandedMap((prev) => {
        const cur = prev[key] !== undefined ? prev[key] : true;
        const next = { ...prev, [key]: !cur };
        writeJobStatusExpandedMap(accountId, next);
        return next;
      });
    },
    [accountId],
  );

  return { jobStatuses, toggleExpanded };
}
