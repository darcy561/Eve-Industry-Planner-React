import GLOBAL_CONFIG from "../../../global-config-app";
import fetchAllPages from "../getAllPages";

async function getCharacterJournal(character) {
  try {
    if (!character || !character.aToken || !character.CharacterID) {
      throw new Error("Character information is incomplete.");
    }
    const { aToken, CharacterID } = character;
    const { ESI_DATE_PERIOD } = GLOBAL_CONFIG;
    const endpointURL = `https://esi.evetech.net/latest/characters/${CharacterID}/wallet/journal/?datasource=tranquility&token=${aToken}`;
    const currentDate = new Date();

    const journal = await fetchAllPages(endpointURL);

    return journal.filter(
      (item) =>
        currentDate - Date.parse(item.date) <=
        ESI_DATE_PERIOD * 24 * 60 * 60 * 1000
    );
  } catch (err) {
    console.error(`Error fetching character journal: ${err}`);
    return [];
  }
}

export default getCharacterJournal;
