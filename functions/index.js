const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const appCheckVerification =
  require("./Middleware/AppCheck").appCheckVerification;
const verifyEveToken = require("./Middleware/eveTokenVerify").verifyEveToken;
const ESIMarketQuery = require("./sharedFunctions/priceData").ESIMarketQuery;
const checkAppVersion = require("./Middleware/appVersion").checkAppVersion;

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
    methods: "GET,POST",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use(helmet());
app.use(appCheckVerification);
app.use(checkAppVersion);

//Routes

//Generates JWT AuthToken
app.post("/auth/gentoken", verifyEveToken, async (req, res) => {
  if (req.body.UID === null) {
    functions.logger.warn("UID missing from request");
    functions.logger.info(`Header ${JSON.stringify(req.header)}`);
    functions.logger.info(`Body ${JSON.stringify(req.body)}`);
    return res.status(400).send("Malformed Request");
  }
  try {
    const authToken = await admin.auth().createCustomToken(req.body.UID);
    functions.logger.log(`${req.body.UID} Token Generated, Log In Successful`);
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
});

//Read Full Single Item Tranquilty
app.get("/item/:itemID", async (req, res) => {
  if (req.params.itemID === undefined) {
    return res.status(400).send("Item Data Missing From Request");
  }
  try {
    let document = db.collection("Items").doc(req.params.itemID);
    let product = await document.get();
    if (product.exists) {
      let response = product.data();
      functions.logger.log(
        `${req.params.itemID} Tranquilty Build Data Sent To ${req.header(
          "accountID"
        )} `
      );
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
});

app.post("/item", async (req, res) => {
  if (req.body.idArray === undefined) {
    return res.status(500).send("Item Data Missing From Request");
  }
  try {
    let returnArray = [];
    let missingIDs = [];
    let returnIDs = new Set();

    for (let itemID of req.body.idArray) {
      let document = await db.collection("Items").doc(itemID.toString()).get();
      if (document.exists) {
        let documentData = document.data();
        returnArray.push(documentData);
        returnIDs.add(itemID);
      } else {
        missingIDs.push(itemID);
      }
    }

    if (missingIDs.length > 0) {
      functions.logger.error(
        `${missingIDs.length} item/items missing: [${missingIDs}]`
      );
    }

    functions.logger.log(
      `${returnArray.length} items returned: [${[...returnIDs]}]`
    );

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
});

//Read Full Single Item Singularity
app.get("/item/sisiData/:itemID", async (req, res) => {
  if (req.params.itemID === undefined) {
    return res.status(400).send("Item Data Missing From Request");
  }
  try {
    let document = db.collection("sisiItems").doc(req.params.itemID);
    let product = await document.get();
    if (product.exists) {
      let response = product.data();
      functions.logger.log(
        `${req.params.itemID} Tranquilty Build Data Sent To ${req.header(
          "accountID"
        )} `
      );
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
});

app.post("/costs", async (req, res) => {
  if (req.body.idArray === undefined) {
    return res.status(500).send("Item Data Missing From Request");
  }
  try {
    let returnData = [];
    let missingItems = [];
    let liveObject = await db.collection("Pricing").doc("Live").get();
    let liveObjectData = liveObject.data();
    for (let itemID of req.body.idArray) {
      if (liveObjectData.hasOwnProperty(itemID.toString())) {
        returnData.push(liveObjectData[itemID.toString()]);
      } else {
        missingItems.push(itemID);
      }
    }

    if (missingItems.length > 0) {
      for (let id of missingItems) {
        let data = await ESIMarketQuery(id.toString(), true);
        returnData.push(data);
      }
    }
    functions.logger.log(
      `${req.body.idArray.length} Prices Returned for ${req.header(
        "accountID"
      )}, [${req.body.idArray}]`
    );

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
});

app.get("/systemindexes/:systemID", async (req, res) => {
  if (req.params.systemID === undefined) {
    return res.status(500).send("System Index Missing From Request");
  }
  const indexesRaw = await admin
    .storage()
    .bucket()
    .file("systemIndexes.json")
    .download();
  const indexesParsed = JSON.parse(indexesRaw);
});

//Export the api to Firebase Cloud Functions
exports.api = functions
  .region("europe-west1")
  .runWith({ maxInstances: 40 })
  .https.onRequest(app);
exports.buildUser = require("./Triggered Functions/Users");
exports.RefreshItemPrices = require("./Scheduled Functions/refreshItemPrices");
exports.RefreshSystemIndexes = require("./Scheduled Functions/refreshSystemIndexes");
exports.archivedJobProcess = require("./Scheduled Functions/archievedJobs");
exports.feedback = require("./Triggered Functions/storeFeedback");
exports.userClaims = require("./Triggered Functions/addCorpClaim");
exports.appVersion = require("./Triggered Functions/checkAppVersion");
