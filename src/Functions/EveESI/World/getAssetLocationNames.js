async function getAssetLocationNames(
  character,
  locationIDs,
  scope = "character"
) {
  try {
    if (!character || !locationIDs) {
      throw new Error("Input information is incomplete.");
    }

    if (locationIDs instanceof Set) {
      locationIDs = [...locationIDs];
    } else if (!Array.isArray(locationIDs)) {
      throw new Error("locationIDs must be an array or a set.");
    }

    const { CharacterID, corporation_id, aToken } = character;

    const chunkSize = 1000;
    const namesMap = new Map();
    const selectedURLDestination =
      scope === "character"
        ? `characters/${CharacterID}`
        : `corporations/${corporation_id}`;

    for (let i = 0; i < locationIDs.length; i += chunkSize) {
      const chunk = locationIDs.slice(i, i + chunkSize);
      if (chunk.length === 0) continue;
      const response = await fetch(
        `https://esi.evetech.net/latest/${selectedURLDestination}/assets/names/?datasource=tranquility&token=${aToken}`,
        {
          method: "POST",
          body: JSON.stringify(chunk),
        }
      );

      if (!response.ok) {
        throw new Error(
          `API request failed with status ${response.status}: ${response.statusText}`
        );
      }

      const json = await response.json();

      for (let a of json) {
        if (a.name !== "None") {
          namesMap.set(a.item_id, a);
        }
      }
    }
    return namesMap;
  } catch (err) {
    console.error(`Error retrieving character asset location names: ${err}`);
    return new Map();
  }
}

export default getAssetLocationNames;
