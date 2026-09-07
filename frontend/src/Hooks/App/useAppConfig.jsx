import { useEffect, useState } from "react";
import GLOBAL_CONFIG from "../../global-config-app";
import { considerRemoteAppVersion } from "../../Functions/App/appVersionCheck.js";
import {
  DEFAULT_APP_CONFIG,
  getAppConfig,
  getAppVersionNumber,
  getLastAppConfigFetchMeta,
  refreshAppConfig,
  subscribeToAppConfig,
} from "../../Functions/Endpoints/Public/appConfig.js";

const { DEFAULT_APP_VERSION_CHECK_INTERVAL } = GLOBAL_CONFIG;

async function checkForVersionUpdate() {
  try {
    await refreshAppConfig();
    const fetchMeta = getLastAppConfigFetchMeta();
    if (fetchMeta.notModified) {
      return;
    }
    considerRemoteAppVersion(getAppVersionNumber());
  } catch (error) {
    console.error("Error checking app version:", error);
  }
}

/**
 * Subscribes to the shared in-memory app config. Set `shouldFetchOnMount: true` only
 * in `App.jsx` so the initial fetch and optional timers run once; other callers only
 * subscribe and avoid a network call on every route / menu mount.
 *
 * @param {object} [options]
 * @param {boolean} [options.enableAutoRefresh] Poll app-config on `refreshIntervalMs`.
 * @param {number} [options.refreshIntervalMs] Poll interval; a 304 when nothing changed.
 * @param {boolean} [options.enableVersionCheck] Poll for a new app version.
 * @param {number} [options.versionCheckIntervalMs] Interval for the version check.
 * @param {boolean} [options.shouldFetchOnMount] Fetch on mount and run the timers.
 * @returns {object} The shared app config.
 */
function useAppConfig({
  enableAutoRefresh = false,
  refreshIntervalMs = 0,
  enableVersionCheck = false,
  versionCheckIntervalMs = DEFAULT_APP_VERSION_CHECK_INTERVAL * 60 * 1000,
  shouldFetchOnMount = false,
} = {}) {
  const [config, setConfig] = useState(
    () => getAppConfig() || DEFAULT_APP_CONFIG
  );

  useEffect(() => {
    const unsubscribe = subscribeToAppConfig(setConfig);
    if (shouldFetchOnMount) {
      void refreshAppConfig();
    }
    return unsubscribe;
  }, [shouldFetchOnMount]);

  useEffect(() => {
    if (!shouldFetchOnMount || !enableAutoRefresh || refreshIntervalMs <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      void refreshAppConfig();
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [shouldFetchOnMount, enableAutoRefresh, refreshIntervalMs]);

  useEffect(() => {
    if (!shouldFetchOnMount || !enableVersionCheck || versionCheckIntervalMs <= 0) {
      return undefined;
    }

    void checkForVersionUpdate();
    const interval = setInterval(() => {
      void checkForVersionUpdate();
    }, versionCheckIntervalMs);

    return () => clearInterval(interval);
  }, [shouldFetchOnMount, enableVersionCheck, versionCheckIntervalMs]);

  return config;
}

export default useAppConfig;
