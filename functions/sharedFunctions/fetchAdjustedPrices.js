import { ref, set } from "firebase/database";
import { error } from "firebase-functions/logger";
import axios from "axios";

async function ESIItemAdjustedPriceQuery(selectedDatabase) {
  try {
    const responseData = await fetchAdjustedPrices();
    if (!responseData) return null;

    const databaseObject = buildDatabaseObject(responseData);

    await saveAdjustedPriceToDatabase(databaseObject, selectedDatabase);

    return databaseObject;
  } catch (err) {
    error(`An error occured: ${err}`);
    return null;
  }
}

async function fetchAdjustedPrices() {
  try {
    const response = await axios.get(
      `https://esi.evetech.net/latest/markets/prices/`
    );
    if (response.status !== 200) return null;

    return [...response.data];
  } catch (err) {
    error(err);
    return null;
  }
}

function buildDatabaseObject(initialArray) {
  const hashObject = {};

  for (let i = 0; i < initialArray.length; i++) {
    const item = initialArray[i];

    hashObject[item.type_id] = item;
  }

  return hashObject;
}

async function saveAdjustedPriceToDatabase(databaseObject, selectedDatabase) {
  try {
    await set(
      ref(selectedDatabase, `live-data/adjusted-prices`),
      databaseObject
    );
  } catch (err) {
    error(err);
  }
}

export default ESIItemAdjustedPriceQuery;
