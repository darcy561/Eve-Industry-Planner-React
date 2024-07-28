async function getCorpPublicInfo(character) {
  try {
    if (!character || !character.corporation_id) {
      throw new Error("Character information is incomplete.");
    }
    const { corporation_id } = character;
    const response = await fetch(
      `https://esi.evetech.net/latest/corporations/${corporation_id}/`
    );

    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    return { ...data, corporation_id };
  } catch (err) {
    console.error(`Error fetching public corporation data: ${err}`);
    return {};
  }
}

export default getCorpPublicInfo;
