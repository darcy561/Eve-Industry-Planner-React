import { getAuth } from "firebase-admin/auth";
import { error, info, log, warn } from "firebase-functions/logger";

async function generateFirebaseToken(req, res) {
  const UID = req.body.UID;
  if (!UID) {
    warn("UID missing from request");
    info(JSON.stringify(req.header));
    info(JSON.stringify(req.body));
    return res.status(400).send("Malformed Request");
  }
  try {
    const authToken = getAuth().createCustomToken(UID);
    log(`FB Auth Token Generated - ${UID}`);
    return res.status(200).send({
      access_token: authToken,
    });
  } catch (err) {
    error("Error generating firebase auth token");
    return res
      .status(500)
      .send("Error generating auth token, contact admin for assistance");
  }
}

export default generateFirebaseToken;
