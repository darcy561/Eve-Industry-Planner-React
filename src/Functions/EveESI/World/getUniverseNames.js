async function getUniverseNames(requestedLocationIDs) {
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

export default getUniverseNames;
