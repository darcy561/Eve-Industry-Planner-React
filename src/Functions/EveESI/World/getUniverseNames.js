import { STATIONID_RANGE } from "../../../Context/defaultValues";

async function getUniverseNames(inputIDs, userObj) {
  try {
    if (!inputIDs || !userObj) {
      throw new Error("Input information is incomplete");
    }

    if (!(inputIDs instanceof Array || inputIDs instanceof Set)) {
      throw new Error("Input needs to be an Array or Set.");
    }

    const chunkSize = 1000;
    const promises = [];
    const locationSplit = { citadels: [], standard: [] };

    inputIDs.forEach((id) => {
      if (id >= STATIONID_RANGE.low && id <= STATIONID_RANGE.high) {
        locationSplit.standard.push(id);
      } else {
        locationSplit.citadels.push(id);
      }
    });

    for (let i = 0; i < locationSplit.standard.length; i += chunkSize) {
      const chunk = locationSplit.standard.slice(i, i + chunkSize);
      if (chunk.length === 0) continue;
      promises.push(fetchUniverseNames(chunk));
    }

    for (let id of locationSplit.citadels) {
      promises.push(fetchCitadelData(id, userObj));
    }

    const responses = (await Promise.all(promises)).flat();

    const returnObject = {};

    responses.forEach((obj) => {
      if (!obj) return;
      returnObject[obj.id] = obj;
    });
    return returnObject;
  } catch (err) {
    console.error(`Error in getUniverseNames: ${err}`);
    return {};
  }
}

async function fetchUniverseNames(requestedLocationIDs) {
  try {
    if (!requestedLocationIDs) {
      throw new Error("Input information is incomplete.");
    }
    if (
      !Array.isArray(requestedLocationIDs) &&
      !(requestedLocationIDs instanceof Set)
    ) {
      throw new Error("Input needs to be an Array or Set.");
    }

    const locationIDsArray = Array.isArray(requestedLocationIDs)
      ? requestedLocationIDs
      : [...requestedLocationIDs];

    const response = await fetch(
      `https://esi.evetech.net/latest/universe/names/?datasource=tranquility`,
      {
        method: "POST",
        body: JSON.stringify(locationIDsArray),
      }
    );

    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (err) {
    console.error(`Error retrieving universe data: ${err}`);
    return {};
  }
}

async function fetchCitadelData(citadelID, character) {
  try {
    if (!citadelID || !character) {
      throw new Error("Input information is incomplete");
    }

    const { aToken } = character;

    const response = await fetch(
      `https://esi.evetech.net/latest/universe/structures/${citadelID}/?datasource=tranquility&token=${aToken}`
    );
    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }
    const json = await request.json();
    json.id = citadelID;
    return json;
  } catch (err) {
    console.error(`Error retrieving citadel data: ${err}`);
    return {
      id: citadelID,
      name: `No Access To Location - ${citadelID}`,
      unResolvedLocation: true,
    };
  }
}

export default getUniverseNames;
