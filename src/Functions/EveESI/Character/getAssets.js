import fetchAllPages from "../getAllPages";

async function getCharacterAssets(character) {
  try {
    if (!character || !character.aToken || !character.CharacterID) {
      throw new Error("Character information is incomplete.");
    }

    const { aToken, CharacterID } = character;
    const endpointURL = `https://esi.evetech.net/latest/characters/${CharacterID}/assets/?datasource=tranquility&token=${aToken}`;

    const returnedData = await fetchAllPages(endpointURL);

    return returnedData;
  } catch (err) {
    console.error(`Error fetching character assets: ${err}`);
    return [];
  }
}

export default getCharacterAssets;
