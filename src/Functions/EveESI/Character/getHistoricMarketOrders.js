import GLOBAL_CONFIG from "../../../global-config-app";
import fetchAllPages from "../getAllPages";

async function getCharacterHistoricMarketOrders(character) {
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
    const { ESI_DATE_PERIOD } = GLOBAL_CONFIG;

    const endpointURL = `https://esi.evetech.net/latest/characters/${CharacterID}/orders/history/?datasource=tranquility&token=${aToken}`;

    const orders = await fetchAllPages(endpointURL);
    const currentDate = Date.now();

    return orders
      .filter(
        (item) =>
          !item.is_buy_order &&
          currentDate - Date.parse(item.issued) <=
            ESI_DATE_PERIOD * 24 * 60 * 60 * 1000
      )
      .map((a) => ({
        ...a,
        CharacterHash: CharacterHash,
      }));
  } catch (err) {
    console.error(`Error fetching historical market orders: ${err}`);
    return [];
  }
}

export default getCharacterHistoricMarketOrders;
