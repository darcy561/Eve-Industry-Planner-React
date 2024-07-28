import GLOBAL_CONFIG from "../../../global-config-app";
import fetchAllPages from "../getAllPages";

async function getCorpHistoricMarketOrders(character) {
  try {
    if (
      !character ||
      !character.CharacterID ||
      !character.aToken ||
      !character.corporation_id
    ) {
      throw new Error("Character information is incomplete.");
    }
    const { aToken, CharacterID, corporation_id } = character;
    const { ESI_DATE_PERIOD } = GLOBAL_CONFIG;
    const endpointURL = `https://esi.evetech.net/latest/corporations/${corporation_id}/orders/history/?token=${aToken}`;
    const currentDate = Date.now();

    const orders = await fetchAllPages(endpointURL);

    return orders
      .filter(
        (item) =>
          !item.is_buy_order &&
          item.issued_by === CharacterID &&
          currentDate - Date.parse(item.issued) <=
            ESI_DATE_PERIOD * 24 * 60 * 60 * 1000
      )
      .map((bp) => ({ ...bp, isCorp: true }));
  } catch (err) {
    console.error(`Error fetching historic corporation market orders: ${err}`);
    return [];
  }
}

export default getCorpHistoricMarketOrders;
