const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const appCheckVerification =
  require("./Middleware/appCheck").appCheckVerification;
const verifyEveToken = require("./Middleware/eveTokenVerify").verifyEveToken;

admin.initializeApp();


const app = express();
const db = admin.firestore();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://eve-industry-planner-dev.firebaseapp.com",
    ],
    methods: "GET,PUT,POST",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use(appCheckVerification);

//Routes

//Generates JWT AuthToken
app.post("/auth/gentoken", verifyEveToken, async (req, res) => {
  if (req.body.UID != null) {
    try {
      const authToken = await admin
        .auth()
        .createCustomToken(req.body.UID);
      return res.status(200).send({
        access_token: authToken,
      });
    } catch (error) {
      functions.logger.error("Error generating firebase auth token");
      functions.logger.error(error);
      return res.status(500).send("Error generating auth token, contact admin for assistance");
    }
  } else {
    functions.logger.warn("UID missing from request")
    functions.logger.info("Header " + JSON.stringify(req.header))
    functions.logger.info("Body " + JSON.stringify(req.body))
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
      functions.logger.log(`${req.params.itemID} Sent`)
      res.status(200)
      res.set('Cache-Control', 'public, max-age=600, s-maxage=3600')
      return send(response);
    } catch (error) {
      functions.logger.error("Error retrieving item data")
      functions.logger.error(`Trying to retrieve ${req.params.itemID}`)
      functions.logger.error(error);
      return res.status(500).send("Error retrieving item data, please try again.");
    }
  })();
});

//Export the api to Firebase Cloud Functions
exports.api = functions.https.onRequest(app);
exports.user = require("./Triggered Functions/Users");
exports.firestore = require("./Triggered Functions/Firestore");
