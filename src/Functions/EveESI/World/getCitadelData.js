async function getCitadelData(citadelID, character) {
  try {
    if (!citadelID) {
      return {};
    }
    if (!character) {
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
    const json = await response.json();
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

export default getCitadelData;
