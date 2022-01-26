const admin = require("firebase-admin");
const functions = require("firebase-functions");

async function appCheckVerification(req, res, next) {
  const appCheckClaims = await verifyAppCheckToken(
    req.header("X-Firebase-AppCheck")
  );
  if (!appCheckClaims) {
    functions.logger.warn("Unauthorised App Check Token");
    functions.logger.warn(JSON.stringify(req.header("X-Firebase-AppCheck")));
    res.status(401);
    return next("Unauthorised");
  }
  functions.logger.log("App Check Token Authorised")
  next();
}

const verifyAppCheckToken = async (token) => {
  if (!token) {
    return null;
  }
  try {
    return admin.appCheck().verifyToken(token);
  } catch (err) {
    functions.logger.error("Error Verifying AppCheck Token");
    functions.logger.error(err);
    return null;
  }
};

module.exports = {
  appCheckVerification: appCheckVerification,
};
