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
      // "http://localhost:3000",
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
      return res
        .status(200)
        .set("Cache-Control", "public, max-age=600, s-maxage=3600")
        .send({
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

//Read Full Single Item Sing
app.get("/item/:itemID", async (req, res) => {
  if (req.params.itemID !== undefined) {
    try {
      functions.logger.log(`Sing Data Used`);
      let document = db.collection("Items").doc(req.params.itemID);
      let product = await document.get();
      if (product.exists) {
        let response = product.data();
        functions.logger.log(`${req.params.itemID} Build Data Sent`);
        return res
          .status(200)
          .set("Cache-Control", "public, max-age=600, s-maxage=3600")
          .send(response);
      } else {
        functions.logger.error("Error retrieving item data");
        functions.logger.error(`Trying to retrieve ${req.params.itemID}`);
        functions.logger.error(error);
        return res
          .status(500)
          .send("Error retrieving item data, please try again.");
      }
    } catch (error) {
      functions.logger.error("Error retrieving item data");
      functions.logger.error(`Trying to retrieve ${req.params.itemID}`);
      functions.logger.error(error);
      return res
        .status(500)
        .send("Error retrieving item data, please try again.");
    }
  } else {
    return res.status(400).send("Item Data Missing From Request");
  }
});

//Read Full Single Item Sisi
app.get("/item/sisiData/:itemID", async (req, res) => {
  if (req.params.itemID !== undefined) {
    try {
      functions.logger.log(`Sisi Data Used`);
      let document = db.collection("sisiItems").doc(req.params.itemID);
      let product = await document.get();
      if (product.exists) {
        let response = product.data();
        functions.logger.log(`${req.params.itemID} Build Data Sent`);
        return res.status(200).send(response);
      } else {
        functions.logger.error("Error retrieving item data");
        functions.logger.error(`Trying to retrieve ${req.params.itemID}`);
        functions.logger.error(error);
        return res
          .status(500)
          .send("Error retrieving item data, please try again.");
      }
    } catch (error) {
      functions.logger.error("Error retrieving item data");
      functions.logger.error(`Trying to retrieve ${req.params.itemID}`);
      functions.logger.error(error);
      return res
        .status(500)
        .send("Error retrieving item data, please try again.");
    }
  } else {
    return res.status(400).send("Item Data Missing From Request");
  }
});

app.get("/costs/:itemID", async (req, res) => {
  if (req.params.itemID !== undefined) {
    try {
      let returnData = null;
      const itemDoc = await db
        .collection("Pricing")
        .doc(req.params.itemID)
        .get();
      if (itemDoc.exists) {
        returnData = itemDoc.data();
      } else {
        returnData = await ESIMarketQuery(req.params.itemID);
      }
      functions.logger.log(`${req.params.itemID} Price Data Sent`);
      return res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .set("Cache-Control", "public, max-age=3600, s-maxage=7200")
        .send(returnData);
    } catch (err) {
      functions.logger.error(err);
      return res
        .status(500)
        .send("Error retrieving item data, please try again.");
    }
  } else {
    return res.status(400).send("Item Data Missing From Request");
  }
});

app.post("/costs/bulkPrices", async (req, res) => {
  if (req.body.idArray !== undefined) {
    try {
      let returnData = [];
      let missingItems = [];
      for (let x = 0; x < req.body.idArray.length; x += 10) {
        let chunk = req.body.idArray.slice(x, x + 10);
        let chunkData = await db
          .collection("Pricing")
          .where("typeID", "in", chunk)
          .get();
        chunkData.forEach((doc) => {
          let docData = doc.data();
          if (chunk.includes(docData.typeID)) {
            let index = chunk.indexOf(docData.typeID);
            chunk.splice(index, 1);
            returnData.push(docData);
          }
        });
        missingItems = missingItems.concat(chunk);
      }

      if (missingItems.length > 0) {
        for (let id of missingItems) {
          let data = await ESIMarketQuery(id.toString());
          returnData.push(data);
        }
      }
      functions.logger.log(`${req.body.idArray} Prices Returned`);
      return res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .send(returnData);
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
exports.RefreshItemPrices = require("./Scheduled Functions/refreshItemPrices");
