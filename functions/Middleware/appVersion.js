const functions = require("firebase-functions");
const checkAppVersion =
  require("../sharedFunctions/appVersion").checkAppVersion;

function checkVersion(req, res, next) {
  let verify = checkAppVersion(req.header("appVersion"));

  if (!verify) {
    res.status(400);
    res.send("Outdated App Version");
    return next(`Outdated App Version - ${req.header("appVersion")}`);
  }
  next();
}
module.exports = {
  checkAppVersion: checkVersion,
};
