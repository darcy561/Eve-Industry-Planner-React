import fetchAllPages from "../getAllPages";

async function getCorpBlueprints(character) {
  try {
    if (!character || !character.aToken || !character.corporation_id) {
      throw new Error("Character information is incomplete.");
    }
    const { aToken, corporation_id } = character;
    const endpointURL = `https://esi.evetech.net/latest/corporations/${corporation_id}/blueprints/?token=${aToken}`;
    const blueprints = await fetchAllPages(endpointURL);

    return blueprints.map((bp) => ({
      ...bp,
      isCorp: true,
      corporation_id: corporation_id,
    }));
  } catch (err) {
    console.error(`Error fetching corporation blueprints: ${err}`);
    return [];
  }
}

export default getCorpBlueprints;
