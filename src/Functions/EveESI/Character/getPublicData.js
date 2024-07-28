async function getCharacterPublicInfo(characterID) {
  try {
    const response = await fetch(
      `https://esi.evetech.net/legacy/characters/${characterID}/?datasource=tranquility`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`Error fetching character data: ${err}`);
    throw err;
  }
}

export default getCharacterPublicInfo;
