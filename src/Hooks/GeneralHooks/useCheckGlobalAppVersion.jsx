import { fetchAndActivate, getString } from "firebase/remote-config";
import { remoteConfig } from "../../firebase";

function useCheckGlobalAppVersion() {
  try {
    if (hasFetchFailed()) failedFetch();

    const remoteValue = getString(remoteConfig, "app_version_number");

    if (remoteValue === __APP_VERSION__) return true;

    return false;
  } catch (err) {
    console.error(err.message);
    return false;
  }

  function hasFetchFailed() {
    return remoteConfig.lastFetchStatus !== "success" ? true : false;
  }

  async function failedFetch() {
    await fetchAndActivate(remoteConfig);
  }
}

export default useCheckGlobalAppVersion;
