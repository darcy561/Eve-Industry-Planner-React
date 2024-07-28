import GLOBAL_CONFIG from "../../../global-config-app";
import fetchAllPages from "../getAllPages";

async function getCorpIndustryJobs(character) {
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
    const endpointURL = `https://esi.evetech.net/latest/corporations/${corporation_id}/industry/jobs/?include_completed=true&token=${aToken}`;
    const indyJobs = await fetchAllPages(endpointURL);

    return indyJobs
      .filter(
        (job) =>
          !job.completed_date ||
          (new Date() - Date.parse(job.completed_date) <=
            ESI_DATE_PERIOD * 24 * 60 * 60 * 1000 &&
            job.installer_id === CharacterID)
      )
      .map((bp) => ({ ...bp, isCorp: true }));
  } catch (err) {
    console.error(`Error fetching corporation industry jobs: ${err}`);
    return [];
  }
}

export default getCorpIndustryJobs;
