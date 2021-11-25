const admin = require("firebase-admin");

const appCheckVerification = async (req, res, next) => {
  const appCheckClaims = await verifyAppCheckToken(req.header("X-Firebase-AppCheck"));
  if (!appCheckClaims) {
    res.status(401);
    return next("Unauthorised");
  }
  next();
};

const verifyAppCheckToken = async (token) => {
    if (!appCheckToken) {
        return null;
    }
    try {
        return admin.appCheck().verifyToken(token);
    } catch (err) {
        return null;
    };
};
