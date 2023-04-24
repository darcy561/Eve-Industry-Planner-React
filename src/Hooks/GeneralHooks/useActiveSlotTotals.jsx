import { useContext } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { PersonalESIDataContext } from "../../Context/EveDataContext";
import { CorpEsiDataContext } from "../../Context/EveDataContext";

export function useActiveSlotTotals() {
  const { users } = useContext(UsersContext);
  const { esiIndJobs, esiSkills } = useContext(PersonalESIDataContext);
  const { corpEsiIndJobs } = useContext(CorpEsiDataContext);

  // const calculateActiveSlotsSingle = (CharacterHash) => {
  //   let totalManufacturingSlots = 1;
  //   let totalActiveManufacturingSlots = 0;
  //   let totalReactionSlots = 1;
  //   let totalActiveReactionSlots = 0;
  //   let totalScienceSlots = 1;
  //   let totalActiveScienceSlots = 0;
  //   let corpJobsPresent = false;

  //   let userPersonalIndJobs = esiIndJobs.find((i) => i.user === CharacterHash);
  //   let userCorpIndJobs = corpEsiIndJobs.find((i) => i.user === CharacterHash);
  //   let userSkills = esiSkills.find((i) => i.user === CharacterHash).data;

  //   if (userPersonalIndJobs !== undefined) {
  //     for (let job of userPersonalIndJobs.data) {
  //       if (job.status !== "active") continue;

  //       switch (job.activity_id) {
  //         case 1:
  //           totalActiveManufacturingSlots++;
  //           break;
  //         case 3:
  //           totalActiveScienceSlots++;
  //           break;
  //         case 4:
  //           totalActiveScienceSlots++;
  //           break;
  //         case 5:
  //           totalActiveScienceSlots++;
  //           break;
  //         case 8:
  //           totalActiveScienceSlots++;
  //           break;
  //         case 9:
  //           totalActiveReactionSlots++;
  //           break;
  //         default:
  //           continue;
  //       }
  //     }
  //   }
  //   if (userCorpIndJobs !== undefined) {
  //     for (let job of userCorpIndJobs.data) {
  //       if (job.status !== "active") continue;
  //       switch (job.activity_id) {
  //         case 1:
  //           totalActiveManufacturingSlots++;
  //           corpJobsPresent = true;
  //           break;
  //         case 3:
  //           totalActiveScienceSlots++;
  //           corpJobsPresent = true;
  //           break;
  //         case 4:
  //           totalActiveScienceSlots++;
  //           corpJobsPresent = true;
  //           break;
  //         case 5:
  //           totalActiveScienceSlots++;
  //           corpJobsPresent = true;
  //           break;
  //         case 8:
  //           totalActiveScienceSlots++;
  //           corpJobsPresent = true;
  //           break;
  //         case 9:
  //           totalActiveReactionSlots++;
  //           corpJobsPresent = true;
  //           break;
  //         default:
  //           continue;
  //       }
  //     }
  //   }
  //   let massPoductionSkill = userSkills.find((i) => i.id === 3387);
  //   let advancedMassPoductionSkill = userSkills.find((i) => i.id === 24625);
  //   let massReactionsSkill = userSkills.find((i) => i.id === 45748);
  //   let advancedMassReactionsSkill = userSkills.find((i) => i.id === 45749);
  //   let labOperationsSkill = userSkills.find((i) => i.id === 3406);
  //   let advancedLabOperationsSkill = userSkills.find((i) => i.id === 24624);

  //   if (
  //     massPoductionSkill.activeLevel !== undefined &&
  //     advancedMassPoductionSkill.activeLevel !== undefined
  //   ) {
  //     totalManufacturingSlots +=
  //       massPoductionSkill.activeLevel + advancedMassPoductionSkill.activeLevel;
  //   }
  //   if (
  //     massReactionsSkill.activeLevel !== undefined &&
  //     advancedMassReactionsSkill.activeLevel !== undefined
  //   ) {
  //     totalReactionSlots +=
  //       massReactionsSkill.activeLevel + advancedMassReactionsSkill.activeLevel;
  //   }
  //   if (
  //     labOperationsSkill.activeLevel !== undefined &&
  //     advancedLabOperationsSkill.activeLevel !== undefined
  //   ) {
  //     totalScienceSlots +=
  //       labOperationsSkill.activeLevel + advancedLabOperationsSkill.activeLevel;
  //   }
  //   return {
  //     characterHash: CharacterHash,
  //     activeManufacturingJobs: totalActiveManufacturingSlots,
  //     manufacturingSlots: totalManufacturingSlots,
  //     activeReactionSlots: totalActiveReactionSlots,
  //     reactionSlots: totalReactionSlots,
  //     activeScienceSlots: totalActiveScienceSlots,
  //     scinceSlots: totalScienceSlots,
  //     corpJobsPresent: corpJobsPresent,
  //   };
  // };

  const calculateActiveSlotsMultiple = () => {
    let returnArray = [];
    for (let user of users) {
      returnArray.push(calculateActiveSlotsSingle(user.CharacterHash));
    }
    return returnArray;
  };

  const calculateActiveSlotsSingle = (CharacterHash) => {
    const slots = {
      manufacturing: { total: 1, active: 0 },
      reaction: { total: 1, active: 0 },
      science: { total: 1, active: 0 },
    };
    let corpJobsPresent = false;

    const userIndJobs =
      esiIndJobs.find((i) => i.user === CharacterHash)?.data || [];
    const userCorpIndJobs =
      corpEsiIndJobs.find((i) => i.user === CharacterHash)?.data || [];
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
      const skillLevels = ids.map(
        (id) => userSkills.find((i) => i.id === id)?.activeLevel
      );
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
  };

  return {
    calculateActiveSlotsSingle,
    calculateActiveSlotsMultiple,
  };
}
