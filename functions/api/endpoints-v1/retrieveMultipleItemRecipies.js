import { initializeApp } from "firebase-admin";
import { error, log } from "firebase-functions/logger";
import { doc, getDoc, getFirestore } from "firebase/firestore";

async function retrieveMultipleItemRecipies(req, res) {
  try {
    const app = initializeApp();
    const db = getFirestore(app);

    const { idArray } = req.body;
    if (!idArray || !Array.isArray(idArray) || idArray.length === 0) {
      return res.status(400).send("Invalid or empty ID array");
    }
    const returnArray = [];
    const missingIDs = [];
    const returnIDs = new Set(req.body.idArray);

    const promises = idArray.map((id) => {
      const docRef = doc(db, "Items", id.toString());
      return getDoc(docRef);
    });

    const results = await Promise.all(promises);

    for (let i = 0; i, results.length; i++) {
      const doc = results[i];
      if (doc.exists()) {
        const docData = doc.data();
        returnArray.push(docData);
      } else {
        missingIDs.push(idArray[i]);
        returnIDs.delete(idArray[i]);
      }
    }

    if (missingIDs.length > 0) {
      error(`${missingIDs.length} item/items missing: [${missingIDs}]`);
    }

    log(
      `${returnArray.length} items returned to ${req.header("accountID")}: [${[
        ...returnIDs,
      ]}]`
    );

    return res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .send(returnArray);
  } catch (err) {
    error(err);
    return res
      .status(500)
      .send("Error retrieving item data, please try again.");
  }
}

export default retrieveMultipleItemRecipies
