import logErrorAndRespond from "../api/logErrorMessage";
import { getAppCheck } from("firebase-admin/app-check");


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
  try {
    if (!token) {
      return null;
    }
    return await getAppCheck().verifyToken(token);
  } catch (err) {
    logErrorAndRespond("Error Verifying AppCheck Token", null, null, null);
    return null;
  }
}

export default appCheckVerification;
