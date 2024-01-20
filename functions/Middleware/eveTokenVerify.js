const functions = require("firebase-functions");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

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
        const client = jwksClient({
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
                functions.logger.log(`Eve Token Verified - ${testID}`);
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

function logErrorAndRespond(returnMessage, res, next, statusCode, error) {
  functions.logger.error(returnMessage);
  if (error) {
    functions.logger.error(JSON.stringify(error));
  }
  if (res && next && statusCode) {
    res.status(statusCode);
    next(returnMessage);
  }
}

module.exports = { verifyEveToken, logErrorAndRespond };
