const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { object } = require("firebase-functions/v1/storage");
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
app.use(appCheckVerification);



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
      let promiseArray = [];
      let addedCacheItems = 0;
      let addedCacheItemsDoc = 0;
      let returnedFromCache = 0;
      for (let typeID of req.body.typeIDs) {
        if (!functionCache.some((i) => i.typeID === typeID)) {
          const itemRef = db.collection("Pricing").doc(typeID.toString());
          const itemDoc = await itemRef.get();
          if (itemDoc.exists) {
            if (itemDoc.data().lastUpdated + 14400000 <= Date.now()) {
              const returnData = ESIMarketQuery(typeID);
              promiseArray.push(returnData);
            } else {
              returnArray.push(itemDoc.data());
              functionCache.push(itemDoc.data());
              addedCacheItems++
              addedCacheItemsDoc++
            }
          } else {
            const returnData = ESIMarketQuery(typeID);
            promiseArray.push(returnData);
          }
        } else {
          let cachedData = functionCache.find((i) => i.typeID === typeID);
          if (cachedData + 14400000 <= Date.now()) {
            const returnData = ESIMarketQuery(typeID);
            promiseArray.push(returnData);
            addedCacheItemsDoc++
            functions.logger.info("Price Data In Cache Out Of Date");
          } else {
            returnArray.push(cachedData);
            returnedFromCache++
          }
        }
      }

      if (promiseArray.length > 0) {
        let returnedPromise = await Promise.all(promiseArray);

        for (let promise of returnedPromise) {
          returnArray.push(promise);
          if (!functionCache.some((i) => i.typeID === promise.typeID)) {
            addedCacheItems++;
            functionCache.push(promise);
          }
        }
        functionCache.map(
          (cObj) =>
            returnedPromise.find((nObj) => nObj.typeID === cObj.typeID) || cObj
        );
      }
      functions.logger.info(`${addedCacheItemsDoc} Items From Docs`);
      functions.logger.info(`${returnedFromCache} Items From Cache`);
      functions.logger.info(`${addedCacheItems} Items Added To Cache`);
      functions.logger.info(`${functionCache.length} Items In Cache`);
      return res
        .status(200)
        .setHeader("Content-Type", "application/json")
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
