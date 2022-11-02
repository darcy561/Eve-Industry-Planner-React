const admin = require("firebase-admin");
const functions = require("firebase-functions");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const client = jwksClient({
  jwksUri: "https://login.eveonline.com/oauth/jwks",
});

exports.updateCorpIDs = functions
  .region("europe-west1")
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
      await admin.auth().setCustomUserClaims(context.auth.uid, {
        corporations: [...corpIDs],
      });
      return;
    }

    if (context.auth === undefined) {
      return { error: "Unauthorised User" };
    }
    await setClaim();
    return null;
  });
