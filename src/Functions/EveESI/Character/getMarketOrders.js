async function getCharacterMarketOrders(character) {
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
    const response = await fetch(
      `https://esi.evetech.net/latest/characters/${CharacterID}/orders/?datasource=tranquility&token=${aToken}`
    );

    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    return data
      .filter((order) => !order.is_buy_order)
      .map((order) => ({ ...order, CharacterHash: CharacterHash }));
  } catch (err) {
    console.error(`Error fetching character orders: ${err}`);
    return [];
  }
}

export default getCharacterMarketOrders