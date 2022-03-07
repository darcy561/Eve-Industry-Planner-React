const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const appCheckVerification =
  require("./Middleware/AppCheck").appCheckVerification;
const verifyEveToken = require("./Middleware/eveTokenVerify").verifyEveToken;
const ESIMarketQuery = require("./Item Prices/priceData").ESIMarketQuery;

admin.initializeApp();

const app = express();
const db = admin.firestore();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://eve-industry-planner-dev.firebaseapp.com",
      "https://www.eveindustryplanner.com",
      "https://eveindustryplanner.com",
    ],
    methods: "GET,PUT,POST",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use(helmet());
// app.use(appCheckVerification);

//Routes

//Generates JWT AuthToken
app.post("/auth/gentoken", verifyEveToken, async (req, res) => {
  if (req.body.UID != null) {
    try {
      const authToken = await admin.auth().createCustomToken(req.body.UID);
      functions.logger.log(`${req.body.UID} Auth Token Generated`);
      return res.status(200).send({
        access_token: authToken,
      });
    } catch (error) {
      functions.logger.error("Error generating firebase auth token");
      functions.logger.error(error);
      return res
        .status(500)
        .send("Error generating auth token, contact admin for assistance");
    }
  } else {
    functions.logger.warn("UID missing from request");
    functions.logger.info("Header " + JSON.stringify(req.header));
    functions.logger.info("Body " + JSON.stringify(req.body));
    return res.status(400);
  }
});

//Read Full Single Item
app.get("/item/:itemID", (req, res) => {
  (async () => {
    try {
      const document = db.collection("Items").doc(req.params.itemID);
      let product = await document.get();
      let response = product.data();
      functions.logger.log(`${req.params.itemID} Sent`);
      return res
        .status(200)
        .set("Cache-Control", "public, max-age=600, s-maxage=3600")
        .send(response);
    } catch (error) {
      functions.logger.error("Error retrieving item data");
      functions.logger.error(`Trying to retrieve ${req.params.itemID}`);
      functions.logger.error(error);
      return res
        .status(500)
        .send("Error retrieving item data, please try again.");
    }
  })();
});
app.post("/costs", async (req, res) => {
  if (req.body.typeIDs != null) {
      try {
        let returnArray = [];
        for (let typeID of req.body.typeIDs) {
          const itemRef = db.collection("Pricing").doc(typeID.toString());
          const itemDoc = await itemRef.get();
          if (itemDoc.exists) {
            if (
              Date.parse(itemDoc.data().lastUpdated.toDate()) + 14400000 <=
              Date.now()
            ) {
              const returnData = await ESIMarketQuery(typeID);
              returnArray.push(returnData);
            } else {
              returnArray.push(itemDoc.data());
            }
          } else {
            const returnData = await ESIMarketQuery(typeID);
            returnArray.push(returnData);
          }
        }
        return res
          .status(200)
          .setHeader("Content-Type", "application/json")
          .set("Cache-Control", "public, max-age=1800, s-maxage=3600")
          .send(returnArray);
      } catch (err) {
        functions.logger.error(err);
        return res
          .status(500)
          .send("Error retrieving item data, please try again.");
      }
    } else {
      return res.status(500).send("Item Data Missing From Request");
    }
  });

//Export the api to Firebase Cloud Functions
exports.api = functions.https.onRequest(app);
exports.user = require("./Triggered Functions/Users");
