import jwt from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";
import { log } from "firebase-functions/logger";
import logErrorAndRespond from "../api/logErrorMessage.js";

async function verifyEveToken(req, res, next) {
  try {
    const accessToken = req.header("Access-Token");
    const requestedCharacterHash = req.body.CharacterHash;
    const requestedUserID = req.body.UID;

    if (!accessToken) {
      logErrorAndRespond("Missing Access Token", res, next, 401);
    } else if (!requestedCharacterHash || !requestedUserID) {
      logErrorAndRespond("Missing Character Data", res, next, 401);
    } else {
      const decodedToken = jwt.decode(accessToken);
      const kid = decodedToken?.kid;

      if (!kid) {
        logErrorAndRespond(
          "Invalid Eve Token - Missing Key ID",
          res,
          next,
          401
        );
      } else {
        const client = JwksClient({
          jwksUri: "https://login.eveonline.com/oauth/jwks",
        });
        const key = await client.getSigningKey(kid);
        const getSigningKey = key.getPublicKey();

        jwt.verify(accessToken, getSigningKey, (err, decoded) => {
          if (err) {
            logAndRespond("Error Validating Eve Token", res, next, 401, err);
          } else {
            const testID = decoded.owner?.replace(/[^a-zA-z0-9 ]/g, "");
            if (
              decoded.iss ===
              ("https://login.eveonline.com" || "login.eveonline.com")
            ) {
              if (
                decoded.owner === req.body.CharacterHash &&
                testID === req.body.UID
              ) {
                log(`Eve Token Verified - ${testID}`);
                next();
              } else {
                logErrorAndRespond(
                  "Invalid Eve Token",
                  res,
                  next,
                  401,
                  decoded
                );
              }
            } else {
              logErrorAndRespond(
                "Invalid Eve Token - Invalid Issuer",
                res,
                next,
                401,
                decoded
              );
            }
          }
        });
      }
    }
  } catch (error) {
    logErrorAndRespond("Error In Token Verification", res, next, 401, error);
  }
}

export default verifyEveToken;
