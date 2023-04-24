function checkAppVersion(appVersion) {
  if (appVersion !== "0.6.0") {
    return false;
  }
  return true;
}

module.exports = {
  checkAppVersion: checkAppVersion,
};
