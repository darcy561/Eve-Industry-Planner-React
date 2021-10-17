const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const express = require("express");
const app = express();
const cors = require("cors");
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

app.use(cors(
  {
  origin: ["http://localhost:3000", "https://eve-industry-planner-dev.firebaseapp.com"],
  methods: "GET,PUT,POST",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  }
));
app.use(express.json());

//Routes

//Generates JWT AuthToken
app.post("/auth/gentoken", async (req, res) => {
  if (req.body.CharacterHash != null) {
    try {
      const authToken = await admin
        .auth()
        .createCustomToken(req.body.CharacterHash);
      return res.status(200).send({
        access_token: authToken,
      });
    } catch (error) {
      return res.status(500).send(error);
    };
  } else {
    return res.status(400);
  };
});

//Post Single Item
app.post("/api/create",  (req, res) => {
  (async () => {
    try {
      await db
        .collection("items")
        .doc("/" + req.body.itemID + "/")
        .create({
          basePrice: req.body.basePrice,
          graphicID: req.body.graphicID,
          groupID: req.body.groupID,
          iconID: req.body.iconID,
          marketGroupID: req.body.marketGroupID,
          metaGroupID: req.body.metaGroupID,
          name: req.body.name,
          portionSize: req.body.portionSize,
          published: req.body.published,
          volume: req.body.volume,
          activities: req.body.activities,
          blueprintTypeID: req.body.blueprintTypeID,
          maxProductionLimit: req.body.maxProductionLimit,
          itemID: req.body.itemID,
        });

      return res.status(200).send("Successfully Added");
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  })();
});

//Read Full Single Item
app.get("/api/item/:itemID", (req, res) => {
  (async () => {
    try {
      const document = db.collection("items").doc(req.params.itemID);
      let product = await document.get();
      let response = product.data();

      return res.status(200).send(response);
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  })();
});

//Read All ItemNames & ID
app.get("/api/items", (req, res) => {
  (async () => {
    try {
      let query = db.collection("items");
      let response = [];

      await query.get().then((documentSnapshot) => {
        let docs = documentSnapshot.docs; //query results

        for (let doc of docs) {
          const selectedItem = {
            itemID: doc.data().itemID,
            name: doc.data().name,
          };
          response.push(selectedItem);
        }
        return response;
      });
      return res.status(200).send(response);
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  })();
});

//Update Existing Item
app.put("/api/update/:itemID", (req, res) => {
  (async () => {
    try {
      const document = db.collection("items").doc(req.params.itemID);

      await document.update({
        basePrice: req.body.basePrice,
        graphicID: req.body.graphicID,
        groupID: req.body.groupID,
        iconID: req.body.iconID,
        marketGroupID: req.body.marketGroupID,
        metaGroupID: req.body.metaGroupID,
        name: req.body.name,
        portionSize: req.body.portionSize,
        published: req.body.published,
        volume: req.body.volume,
        activities: req.body.activities,
        blueprintTypeID: req.body.blueprintTypeID,
        maxProductionLimit: req.body.maxProductionLimit,
        itemID: req.body.itemID,
      });

      return res.status(200).send("Successfully Updated");
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  })();
});

//Export the api to Firebase Cloud Functions
exports.app = functions.https.onRequest(app);
