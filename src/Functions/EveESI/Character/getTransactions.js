import GLOBAL_CONFIG from "../../../global-config-app";
import fetchAllPages from "../getAllPages";

async function getCharacterTransactions(character) {
  try {
    if (!character || !character.aToken || !character.CharacterID) {
      throw new Error("Character information is incomplete.");
    }
    const { aToken, CharacterID } = character;
    const { ESI_DATE_PERIOD } = GLOBAL_CONFIG;
    const endpointURL = `https://esi.evetech.net/latest/characters/${CharacterID}/wallet/transactions/?datasource=tranquility&token=${aToken}`;
    const currentDate = new Date();

    const transactions = await fetchAllPages(endpointURL);

    return transactions.filter(
      (i) =>
        !i.is_buy &&
        currentDate - Date.parse(i.date) <=
          ESI_DATE_PERIOD * 24 * 60 * 60 * 1000
    );
  } catch (err) {
    console.error(`Error fetching character transactions: ${err}`);
    return [];
  }
}
export default getCharacterTransactions;
