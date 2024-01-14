const checkAppVersion =
  require("../sharedFunctions/appVersion").checkAppVersion;
const { logErrorAndRespond } = require("./eveTokenVerify");

function checkVersion(req, res, next) {
  let verify = checkAppVersion(req.header("appVersion"));

  if (!verify) {
    logErrorAndRespond(
      "Outdated App Version",
      res,
      next,
      401,
      req.header("appVersion")
    );
  } else {
    next();
  }
}
module.exports = {
  checkAppVersion: checkVersion,
};
