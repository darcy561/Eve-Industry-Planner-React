import { APP_VERSION } from "../global-config-functions";

function checkAppVersion(requestedAppVersion) {
  if (requestedAppVersion !== APP_VERSION) {
    return false;
  }
  return true;
}

export default checkAppVersion;
