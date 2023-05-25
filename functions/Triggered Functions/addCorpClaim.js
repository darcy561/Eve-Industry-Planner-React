const admin = require("firebase-admin");
const functions = require("firebase-functions");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { GLOBAL_CONFIG } = require("../global-config-functions");

const { FIREBASE_SERVER_REGION } = GLOBAL_CONFIG

const client = jwksClient({
  jwksUri: "https://login.eveonline.com/oauth/jwks",
});

exports.updateCorpIDs = functions
  .region(FIREBASE_SERVER_REGION)
  .https.onCall(async (data, context) => {
    async function setClaim() {
      let corpIDs = new Set();

      for (let charData of data) {
        const decodedToken = jwt.decode(charData.authToken);
        const kid = decodedToken.kid;
        const key = await client.getSigningKey(kid);
        const getSigningKey = key.getPublicKey();
        let tokenState = jwt.verify(
          charData.authToken,
          getSigningKey,
          (err, decoded) => {
            if (
              decoded.iss != "login.eveonline.com" &&
              decoded.iss != "https://login.eveonline.com"
            ) {
              functions.logger.error(
                `${context.auth.uid} failed to verify Eve Token`
              );
              functions.logger.error(JSON.stringify(decoded));
              return false;
            } else {
              return true;
            }
          }
        );

        if (tokenState) {
          let response = await axios.get(
            `https://esi.evetech.net/legacy/characters/${Number(
              decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]
            )}/?datasource=tranquility`
          );
          if (response.status === 200) {
            corpIDs.add(response.data.corporation_id);
          }
        }
      }
      functions.logger.log(`${context.auth.uid} Corporation Claims Updated`);
      await admin.auth().setCustomUserClaims(context.auth.uid, {
        corporations: [...corpIDs],
      });
      return;
    }

    if (!context.auth) {
      functions.logger.error("Unathorised Claims User");
      return { error: "Unauthorised User" };
    }
    await setClaim();
    return null;
  });
