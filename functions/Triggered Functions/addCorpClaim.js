import { getAuth } from "firebase-admin/auth";
import axios from "axios";
import { JwksClient } from "jwks-rsa";
import { decode, verify } from "jsonwebtoken";
import { error, log } from "firebase-functions/logger";
import { onCall } from "firebase-functions/v1/https";

import { FIREBASE_SERVER_REGION } from "../global-config-functions";

const client = JwksClient({
  jwksUri: "https://login.eveonline.com/oauth/jwks",
});

const updateCorpIDs = onCall(
  { region: FIREBASE_SERVER_REGION },
  async (data, context) => {
    async function setClaim() {
      let corpIDs = new Set();

      for (let charData of data) {
        const decodedToken = decode(charData.authToken);
        const kid = decodedToken.kid;
        const key = await client.getSigningKey(kid);
        const getSigningKey = key.getPublicKey();
        let tokenState = verify(
          charData.authToken,
          getSigningKey,
          (err, decoded) => {
            if (
              decoded.iss != "login.eveonline.com" &&
              decoded.iss != "https://login.eveonline.com"
            ) {
              error(`${context.auth.uid} failed to verify Eve Token`);
              error(JSON.stringify(decoded));
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
      log(`${context.auth.uid} Corporation Claims Updated`);
      await getAuth().setCustomUserClaims(context.auth.uid, {
        corporations: [...corpIDs],
      });
      return;
    }

    if (!context.auth) {
      error("Unathorised Claims User");
      return { error: "Unauthorised User" };
    }
    await setClaim();
    return null;
  }
);

export default updateCorpIDs;
