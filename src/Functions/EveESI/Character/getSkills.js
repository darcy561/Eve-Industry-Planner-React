import skillsReference from "../../../RawData/bpSkills.json";

async function getCharacterSkills(character) {
  try {
    if (!character || !character.aToken || !character.CharacterID) {
      throw new Error("Character information is incomplete.");
    }
    const { aToken, CharacterID } = character;
    const skillsMap = {};
    const response = await fetch(
      `https://esi.evetech.net/latest/characters/${CharacterID}/skills/?datasource=tranquility&token=${aToken}`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();

    Object.values(skillsReference).forEach((ref) => {
      const skill = responseData.skills.find((s) => s.skill_id === ref.id);

      skillsMap[ref.id] = {
        id: ref.id,
        activeLevel: skill?.active_skill_level || 0,
        trainedLevel: skill?.trained_skill_level || 0,
      };
    });

    return skillsMap;
  } catch (err) {
    console.error(`Error fetching character skills: ${err}`);
    return {};
  }
}
export default getCharacterSkills;
