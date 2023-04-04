import { useCallback, useContext, useEffect } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { PersonalESIDataContext } from "../../Context/EveDataContext";
import { CorpEsiDataContext } from "../../Context/EveDataContext";

export function useActiveSlotTotals() {
  const { users } = useContext(UsersContext);
  const { esiIndJobs, esiSkills } = useContext(PersonalESIDataContext);
  const { corpEsiIndJobs } = useContext(CorpEsiDataContext);
  let returnArray = [];
  useCallback(() => {
    for (let user of users) {
      let totalManufacturingSlots = 1;
      let totalActiveManufacturingSlots = 0;
      let totalReactionSlots = 1;
      let totalActiveReactionSlots = 0;
      let totalScienceSlots = 1;
      let totalActiveScienceSlots = 0;
      let corpJobsPresent = false;

      let userPersonalIndJobs = esiIndJobs.find(
        (i) => i.user === user.CharacterHash
      ).data;
      let userCorpIndJobs = corpEsiIndJobs.find(
        (i) => i.user === user.CharacterHash
      ).data;
      let userSkills = esiSkills.find(
        (i) => i.user === user.CharacterHash
      ).data;

      for (let job of userPersonalIndJobs) {
        if (job.status !== "active") continue;

        switch (job.activity_id) {
          case 1:
            totalActiveManufacturingSlots++;
            break;
          case 3:
            totalActiveScienceSlots++;
            break;
          case 4:
            totalActiveScienceSlots++;
            break;
          case 5:
            totalActiveScienceSlots++;
            break;
          case 8:
            totalActiveScienceSlots++;
            break;
          case 9:
            totalActiveReactionSlots++;
            break;
          default:
            continue;
        }
      }

      for (let job of userCorpIndJobs) {
        if (job.status !== "active") continue;
        switch (job.activity_id) {
          case 1:
            totalActiveManufacturingSlots++;
            corpJobsPresent = true;
            break;
          case 3:
            totalActiveScienceSlots++;
            corpJobsPresent = true;
            break;
          case 4:
            totalActiveScienceSlots++;
            corpJobsPresent = true;
            break;
          case 5:
            totalActiveScienceSlots++;
            corpJobsPresent = true;
            break;
          case 8:
            totalActiveScienceSlots++;
            corpJobsPresent = true;
            break;
          case 9:
            totalActiveReactionSlots++;
            corpJobsPresent = true;
            break;
          default:
            continue;
        }
      }

      let massPoductionSkillLevel = userSkills.find(
        (i) => i.id === 3387
      ).activeLevel;
      let advancedMassPoductionSkillLevel = userSkills.find(
        (i) => i.id === 24625
      ).activeLevel;
      let massReactionsSkillLevel = userSkills.find(
        (i) => i.id === 45748
      ).activeLevel;
      let advancedMassReactionsSkillLevel = userSkills.find(
        (i) => i.id === 45749
      ).activeLevel;
      let labOperationsSkillLevel = userSkills.find(
        (i) => i.id === 3406
      ).activeLevel;
      let advancedLabOperationsSkillLevel = userSkills.find(
        (i) => i.id === 24624
      ).activeLevel;

      totalManufacturingSlots +=
        massPoductionSkillLevel + advancedMassPoductionSkillLevel;
      totalReactionSlots +=
        massReactionsSkillLevel + advancedMassReactionsSkillLevel;
      totalScienceSlots +=
        labOperationsSkillLevel + advancedLabOperationsSkillLevel;

      returnArray.push({
        characterHash: user.CharacterHash,
        activeManufacturingJobs: totalActiveManufacturingSlots,
        manufacturingSlots: totalManufacturingSlots,
        activeReactionSlots: totalActiveReactionSlots,
        reactionSlots: totalReactionSlots,
        activeScienceSlots: totalActiveScienceSlots,
        scinceSlots: totalScienceSlots,
        corpJobsPresent: corpJobsPresent,
      });
    }
  }, [users, esiIndJobs, esiSkills, corpEsiIndJobs]);
  return returnArray;
}
