async function getCorpDivisions(character) {
  try {
    if (!character || !character.aToken || !character.corporation_id) {
      throw new Error("Character information is incomplete.");
    }
    const { aToken, corporation_id } = character;
    const response = await fetch(
      `https://esi.evetech.net/latest/corporations/${corporation_id}/divisions?token=${aToken}`
    );
    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    return { ...data, corporation_id };
  } catch (err) {
    console.error(`Error fetching corporation divisions: ${err}`);
    return {};
  }
}

export default getCorpDivisions
