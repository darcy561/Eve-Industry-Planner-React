function checkAppVersion(appVersion) {
  if (appVersion !== "0.5.5") {
    return false;
  }
  return true;
}

module.exports = {
  checkAppVersion: checkAppVersion,
};
