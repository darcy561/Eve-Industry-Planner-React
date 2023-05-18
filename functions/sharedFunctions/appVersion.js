const GLOBAL_CONFIG = require("../global-config-functions");

const { APP_VERSION } = GLOBAL_CONFIG;

function checkAppVersion(requestedAppVersion) {
  if (requestedAppVersion !== APP_VERSION) {
    return false;
  }
  return true;
}

module.exports = {
  checkAppVersion: checkAppVersion,
};
