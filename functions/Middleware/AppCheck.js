const admin = require("firebase-admin");
const { logErrorAndRespond } = require("./eveTokenVerify");

async function appCheckVerification(req, res, next) {
  const appCheckClaims = await verifyAppCheckToken(
    req.header("X-Firebase-AppCheck")
  );
  if (!appCheckClaims) {
    logErrorAndRespond(
      "Unauthorised App Check Token",
      res,
      next,
      401,
      req.header("X-Firebase-AppCheck")
    );
  } else {
    next();
  }
}

async function verifyAppCheckToken(token) {
  if (!token) {
    return null;
  }
  try {
    return await admin.appCheck().verifyToken(token);
  } catch (err) {
    logErrorAndRespond("Error Verifying AppCheck Token", null, null, null);
    return null;
  }
}

module.exports = {
  appCheckVerification: appCheckVerification,
};
