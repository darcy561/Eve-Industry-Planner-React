async function getCharacterStandings(character) {
  try {
    if (!character || !character.aToken || !character.CharacterID) {
      throw new Error("Character information is incomplete.");
    }

    const { aToken, CharacterID } = character;
    const response = await fetch(
      `https://esi.evetech.net/latest/characters/${CharacterID}/standings/?datasource=tranquility&token=${aToken}`
    );

    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (err) {
    console.error(`Error fetching character standings: ${err}`);
    return [];
  }
}
export default getCharacterStandings;
