import { useEffect } from "react";
import useUsersStore from "../../Zustand/usersStore.js";
import GLOBAL_CONFIG from "../../global-config-app";

const { DEFAULT_MARKET_OPTION, DEFAULT_ORDER_OPTION } = GLOBAL_CONFIG;

/**
 * Drops a job's own market hub or order type once it matches what the account
 * defaults to, so the job carries an override only while it differs.
 *
 * @param {Object} activeJob
 * @param {(layoutPatch: Object) => void} updateActiveJobLayout
 */
export function useStripRedundantJobMarketHubOverrides(
  activeJob,
  updateActiveJobLayout,
) {
  const defaultMarketLocation = useUsersStore(
    (s) => s.applicationSettings.defaultMarketLocation,
  );
  const defaultOrderType = useUsersStore(
    (s) => s.applicationSettings.defaultOrderType,
  );

  useEffect(() => {
    if (!activeJob?.layout) return;

    const canonMarket = defaultMarketLocation ?? DEFAULT_MARKET_OPTION;
    const canonOrder = defaultOrderType ?? DEFAULT_ORDER_OPTION;

    const layout = activeJob.layout;
    const redundant = {};

    if (
      layout.localMarketDisplay != null &&
      layout.localMarketDisplay === canonMarket
    ) {
      redundant.localMarketDisplay = null;
    }
    if (
      layout.localOrderDisplay != null &&
      layout.localOrderDisplay === canonOrder
    ) {
      redundant.localOrderDisplay = null;
    }

    if (Object.keys(redundant).length > 0) {
      updateActiveJobLayout(redundant);
    }
  }, [
    activeJob,
    activeJob?.layout?.localMarketDisplay,
    activeJob?.layout?.localOrderDisplay,
    defaultMarketLocation,
    defaultOrderType,
    updateActiveJobLayout,
  ]);
}
