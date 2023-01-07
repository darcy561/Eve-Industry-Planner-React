function checkAppVersion(appVersion) {
  if (appVersion !== "0.5.6") {
    return false;
  }
  return true;
}

module.exports = {
  checkAppVersion: checkAppVersion,
};
