import fetchAllPages from "../getAllPages";

async function getCorpMarketOrders(character) {
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

    const endpointURL = `https://esi.evetech.net/latest/corporations/${corporation_id}/orders?token=${aToken}`;
    const orders = await fetchAllPages(endpointURL);

    return orders
      .filter((item) => !item.is_buy_order && item.issued_by === CharacterID)
      .map((bp) => ({ ...bp, isCorp: true }));
  } catch (err) {
    console.error(`Error fetching corporation market orders: ${err}`);
    return [];
  }
}

export default getCorpMarketOrders;
