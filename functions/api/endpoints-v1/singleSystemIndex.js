import { getDatabase } from "firebase-admin/database";
import { log } from "firebase-functions/logger";
import { get, ref } from "firebase/database";
import buildMissingSystemIndexValue from "../../sharedFunctions/misingSystemIndexValue.js";

async function retrieveSystemIndex(req, res) {
  try {
    const db = getDatabase();
    const systemID = req.params.systemID;

    if (isNaN(systemID)) {
      return res.status(400).send("Invalid System ID");
    }

    const idResponse = await get(
      ref(db, `live-data/system-indexes/${systemID}`)
    );

    const idData = idResponse.val();

    if (!idData) {
      log(`No System Data Found - ${systemID}`);
      return res.status(200).send(buildMissingSystemIndexValue(systemID));
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
