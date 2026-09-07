import { useEffect } from "react";
import {
  parkRealtimeForMaintenance,
  resumeRealtimeAfterMaintenance,
} from "../../Realtime/realtimeClient.js";

/**
 * Parks the realtime layer while maintenance is on and resumes it when the
 * window ends.
 *
 * @param {boolean} isMaintenanceMode Live `maintenance_mode` from app-config.
 */
export default function useMaintenanceRealtimePark(isMaintenanceMode) {
  useEffect(() => {
    if (isMaintenanceMode) {
      parkRealtimeForMaintenance();
      return;
    }
    resumeRealtimeAfterMaintenance();
  }, [isMaintenanceMode]);
}
