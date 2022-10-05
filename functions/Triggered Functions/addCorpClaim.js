const functions = require("firebase-functions");

exports.addCorpClaim = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
      async function setClaim() {
          let corpIDs = new Set()
          for (let charData of data.CharacterRequest) {
            
        }
    }

    admin.auth().setCustomUserClaims(context.auth.uid, {
      corporations: [],
    });
  });
