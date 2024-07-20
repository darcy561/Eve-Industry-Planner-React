import logErrorAndRespond from "../api/logErrorMessage.js";
import checkAppVersion from "../sharedFunctions/appVersion.js";

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
export default checkVersion;
