import fetchAllPages from "../getAllPages";

async function getCorpAssets(character) {
  try {
    if (!character || !character.aToken || !character.corporation_id) {
      throw new Error("Character information is incomplete.");
    }
    const { aToken, corporation_id } = character;
    const endpointURL = `https://esi.evetech.net/latest/corporations/${corporation_id}/assets/?datasource=tranquility&token=${aToken}`;
    const assets = await fetchAllPages(endpointURL);

    return assets.map((asset) => ({
      ...asset,
      corporation_id,
    }));
  } catch (err) {
    console.error(`Error fetching corporation assets: ${err}`);
    return [];
  }
}
export default getCorpAssets;
