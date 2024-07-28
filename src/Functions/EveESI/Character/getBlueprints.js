import fetchAllPages from "../getAllPages";

async function getCharacterBlueprints(character) {
  try {
    if (
      !character ||
      !character.aToken ||
      !character.CharacterID ||
      !character.CharacterHash
    ) {
      throw new Error("Character information is incomplete.");
    }
    const { aToken, CharacterID, CharacterHash } = character;
    const endpointURL = `https://esi.evetech.net/latest/characters/${CharacterID}/blueprints/?datasource=tranquility&token=${aToken}`;
    const blueprints = await fetchAllPages(endpointURL);

    return blueprints.map((a) => ({
      ...a,
      CharacterHash: CharacterHash,
      isCorp: false,
    }));
  } catch (err) {
    console.error(`Error fetching blueprints: ${err}`);
    return [];
  }
}
export default getCharacterBlueprints