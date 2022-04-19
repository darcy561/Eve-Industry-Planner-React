const functions = require("firebase-functions");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const verifyEveToken = async (req, res, next) => {
  const client = jwksClient({
    jwksUri: "https://login.eveonline.com/oauth/jwks",
  });
  const decodedToken = jwt.decode(req.header("Access-Token"));
  const kid = decodedToken.kid;
  const key = await client.getSigningKey(kid);
  const getSigningKey = key.getPublicKey();

  if (!req.header("Access-Token")) {
    functions.logger.warn("Missing Access Token");
    functions.logger.warn(JSON.stringify(req.header("Access-Token")));
    res.status(401);
    return next("Unauthorised");
  } else {
    jwt.verify(req.header("Access-Token"), getSigningKey, (err, decoded) => {
      try {
        const testID = decoded.owner.replace(/[^a-zA-z0-9 ]/g, "");
        if (testID != undefined) {
          if (
            decoded.iss != "login.eveonline.com" &&
            decoded.iss != "https://login.eveonline.com" &&
            decoded.owner != req.body.CharacterHash &&
            testID != req.body.UID
          ) {
            functions.logger.warn("Invalid Eve Token");
            functions.logger.warn(JSON.stringify(decoded));
            res.status(401);
            return next("Invalid Eve Token");
          } else {
            next();
          }
        } else {
          functions.logger.error("Invalid Eve Token");
          functions.logger.error(JSON.stringify(decoded));
          res.status(401);
          return next("Invalid Eve Token");
        }
      } catch {
        functions.logger.error("Error Validating Eve Token");
        functions.logger.error(JSON.stringify(decoded));
        res.status(401);
        return next("Error Validating Eve Token");
      }
    });
  }
};

module.exports = { verifyEveToken: verifyEveToken };
