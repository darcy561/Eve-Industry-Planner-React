import { initializeApp } from "firebase-admin";
import { log } from "firebase-functions/logger";
import { getDatabase, ref } from "firebase/database";

async function retrieveSystemIndex(req, res) {
  try {
    const app = initializeApp();
    const db = getDatabase();
    const systemID = req.params.systemID;

    if (isNaN(systemID)) {
      return res.status(400).send("Invalid System ID");
    }

    const idResponse = await ref(
      db,
      `live-data/system-indexes/${systemID}`
    ).once("value");

    const idData = idResponse.val();

    if (!idData) {
      log(`No System Data Found - ${systemID}`);
      return res.status(200).send(BuildMissingSystemIndexValue(systemID));
    }
    return res.status(200).send(idData);
  } catch (err) {
    log(err.message);
    return res
      .status(500)
      .send("Error retrieving system data, please try again.");
  }
}

export default retrieveSystemIndex;
