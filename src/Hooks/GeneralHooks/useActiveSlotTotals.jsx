import { useContext } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { PersonalESIDataContext } from "../../Context/EveDataContext";
import { CorpEsiDataContext } from "../../Context/EveDataContext";

export function useActiveSlotTotals() {
  const { users } = useContext(UsersContext);
  const { esiIndJobs, esiSkills } = useContext(PersonalESIDataContext);
  const { corpEsiIndJobs } = useContext(CorpEsiDataContext);

  function calculateActiveSlotsMultiple() {
    let returnArray = [];
    for (let user of users) {
      returnArray.push(calculateActiveSlotsSingle(user));
    }
    return returnArray;
  }

  function calculateActiveSlotsSingle(user) {
    const { CharacterHash, CharacterID, corporation_id } = user;
    const slots = {
      manufacturing: { total: 1, active: 0 },
      reaction: { total: 1, active: 0 },
      science: { total: 1, active: 0 },
    };
    let corpJobsPresent = false;

    const userIndJobs =
      esiIndJobs.find((i) => i.user === CharacterHash)?.data || [];
    const userCorpIndJobs =
      Object.entries(corpEsiIndJobs.get(corporation_id))
        .filter(([jobId, job]) => job.installer_id === CharacterID)
        .map(([jobId, job]) => job) || [];
    const userSkills =
      esiSkills.find((i) => i.user === CharacterHash)?.data || [];

    const jobActivityIds = {
      manufacturing: [1],
      science: [3, 4, 5, 8],
      reaction: [9],
    };

    for (let job of [...userIndJobs, ...userCorpIndJobs]) {
      if (job.status !== "active") continue;
      for (let [activity, ids] of Object.entries(jobActivityIds)) {
        if (ids.includes(job.activity_id)) {
          slots[activity].active++;
          if (!corpJobsPresent && job.corporation_id) {
            corpJobsPresent = true;
          }
          break;
        }
      }
    }

    const skillIds = {
      manufacturing: [3387, 24625],
      reaction: [45748, 45749],
      science: [3406, 24624],
    };

    for (let [activity, ids] of Object.entries(skillIds)) {
      const skillLevels = ids.map((id) => userSkills[id]?.activeLevel);
      const totalLevels = skillLevels
        .filter((lvl) => lvl !== undefined)
        .reduce((acc, lvl) => acc + lvl, 0);
      slots[activity].total += totalLevels;
    }

    return {
      characterHash: CharacterHash,
      activeManufacturingJobs: slots.manufacturing.active,
      manufacturingSlots: slots.manufacturing.total,
      activeReactionSlots: slots.reaction.active,
      reactionSlots: slots.reaction.total,
      activeScienceSlots: slots.science.active,
      scienceSlots: slots.science.total,
      corpJobsPresent: corpJobsPresent,
    };
  }

  return {
    calculateActiveSlotsSingle,
    calculateActiveSlotsMultiple,
  };
}
