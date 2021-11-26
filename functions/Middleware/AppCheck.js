const admin = require("firebase-admin");

async function appCheckVerification(req, res, next) {
  const appCheckClaims = await verifyAppCheckToken(req.header("X-Firebase-AppCheck"));
  if (!appCheckClaims) {
    res.status(401);
    return next("Unauthorised");
  }
  next();
}

const verifyAppCheckToken = async (token) => {
    if (!token) {
        return null;
    }
    try {
        return admin.appCheck().verifyToken(token);
    } catch (err) {
        return null;
    };
};

module.exports = {
  appCheckVerification : appCheckVerification
}