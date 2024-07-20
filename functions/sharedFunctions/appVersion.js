import { APP_VERSION } from "../global-config-functions.js";

function checkAppVersion(requestedAppVersion) {
  if (requestedAppVersion !== APP_VERSION) {
    return false;
  }
  return true;
}

export default checkAppVersion;
