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
    res.status(401);
    return next("Unauthorised");
  } else {
    jwt.verify(req.header("Access-Token"), getSigningKey, (err, decoded) => {
      if (
        decoded.iss != "login.eveonline.com" &&
        decoded.iss != "https://login.eveonline.com" &&
        decoded.owner != req.body.CharacterHash
      ) {
        res.status(401);
        return next("Invalid Eve Token");
      } else {
        next();
      }
    });
  }
};

module.exports = { verifyEveToken: verifyEveToken };
