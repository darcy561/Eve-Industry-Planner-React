import GLOBAL_CONFIG from "../../../global-config-app";


async function getCharacterIndustryJobs(character) {
  try {
    if (!character || !character.aToken || !character.CharacterID) {
      throw new Error("Character information is incomplete.");
    }
    const { aToken, CharacterID } = character;
    const { ESI_DATE_PERIOD } = GLOBAL_CONFIG;

    const response = await fetch(
      `https://esi.evetech.net/latest/characters/${CharacterID}/industry/jobs/?datasource=tranquility&include_completed=true&token=${aToken}`
    );

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return data
      .filter(
        (job) =>
          !job.completed_date ||
          new Date() - Date.parse(job.completed_date) <=
            ESI_DATE_PERIOD * 24 * 60 * 60 * 1000
      )
      .map((a) => ({ ...a, isCorp: false }));
  } catch (err) {
    console.error(`Error fetching character industry jobs: ${err}`);
    return [];
  }
}

export default getCharacterIndustryJobs;
