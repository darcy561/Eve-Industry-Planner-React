import { useContext } from "react";
import { UsersContext } from "../Context/AuthContext";
import { jobTypes } from "../Context/defaultValues";
import { blueprintVariables } from "../Components/Job Planner/JobPlanner";

export function useBlueprintCalc() {
  const { users } = useContext(UsersContext);

  const CalculateResources = (job) => {
    switch (job.jobType) {
      case 1:
        const newManArray = [...job.build.materials];
        for (let material of newManArray) {
          const rawIndex = job.rawData.materials.findIndex(
            (i) => i.typeID === material.typeID
          );
          material.quantity = manufacturingMaterialCalc(
            job.rawData.materials[rawIndex].quantity,
            job.runCount,
            job.jobCount,
            job.bpME,
            job.structureType,
            job.rigType,
            job.systemType
          );
        }

        job.build.products.totalQuantity =
          job.rawData.products[0].quantity * job.runCount * job.jobCount;
        job.build.products.quantityPerJob =
          job.rawData.products[0].quantity * job.runCount;

        job.build.materials = newManArray;
        return job;

      case 2:
        const newReacArray = [...job.build.materials];
        for (let material of newReacArray) {
          const rawIndex = job.rawData.materials.findIndex(
            (i) => i.typeID === material.typeID
          );
          material.quantity = reactionMaterialCalc(
            job.rawData.materials[rawIndex].quantity,
            job.runCount,
            job.jobCount,
            job.rigType,
            job.systemType
          );
        }
        job.build.products.totalQuantity =
          job.rawData.products[0].quantity * job.runCount * job.jobCount;
        job.build.products.quantityPerJob =
          job.rawData.products[0].quantity * job.runCount;

        job.build.materials = newReacArray;
        return job;
    }
    function manufacturingMaterialCalc(
      baseQty,
      itemRuns,
      itemJobs,
      bpME,
      structureType,
      rigType,
      systemType
    ) {
      let meModifier =
        (1 - bpME / 100) *
        (1 - structureType / 100) *
        (1 - (rigType / 100) * systemType);
      if (baseQty === 1) {
        meModifier = 1;
      }
      const x = Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
      // console.log(itemRuns)
      // console.log(baseQty)
      // console.log(meModifier);
      // console.log(itemJobs)
      // console.log(x);
      return x;
    }

    function reactionMaterialCalc(
      baseQty,
      itemRuns,
      itemJobs,
      rigType,
      systemMultiplyer
    ) {
      let meModifier = 1 - (rigType / 100) * systemMultiplyer;
      if (baseQty === 1) {
        meModifier = 1;
      }
      //console.log(meModifier);
      const x = Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
      //console.log(x);
      return x;
    }
  };

  const CalcualateTime = (job, updatedUser) => {
    let user = updatedUser;
    if (user === undefined) {
      user = users.find((i) => i.CharacterHash === job.build.buildChar);
    }
    let timeModifier = timeModifierCalc(job, user);
    let skillModifier = skillModifierCalc(job.skills, user);

    job.build.time = Math.floor(
      job.rawData.time * timeModifier * skillModifier * job.runCount
    );

    function timeModifierCalc(job, user) {
      if (job.jobType === jobTypes.manufacturing) {
        const indySkill = user.apiSkills.find((i) => i.id === 3380);
        const advIndySkill = user.apiSkills.find((i) => i.id === 3388);
        const strucData = blueprintVariables.manStructure.find(
          (i) => i.label === job.structureTypeDisplay
        );

        let teIndexer = 1;
        let indyIndexer = 1 - 0.04 * indySkill.activeLevel;
        let advIndyIndexer = 1 - 0.03 * advIndySkill.activeLevel;
        let strucIndexer = 1 - strucData.time;

        for (let x = 1; x <= job.bpTE * 2; x++) {
          teIndexer = teIndexer - 0.01;
          if (teIndexer < 0.8) {
            teIndexer = 0.8;
          }
        }
        if (indyIndexer < 0.8) {
          indyIndexer = 0.8;
        }
        if (advIndyIndexer < 0.85) {
          advIndyIndexer = 0.85;
        }

        let timeModifier =
          teIndexer * indyIndexer * advIndyIndexer * strucIndexer;
        return timeModifier;
      }
      if (job.jobType === jobTypes.reaction) {
        const reactionSkill = user.apiSkills.find((i) => i.id === 45746);
        const strucData = blueprintVariables.reactionStructure.find(
          (i) => i.label === job.structureTypeDisplay
        );

        let reacIndexer = 1 - 0.04 * reactionSkill.activeLevel;
        let strucIndexer = 1 - strucData.time;

        if (reacIndexer < 0.8) {
          reacIndexer = 0.8;
        }

        let timeModifier = reacIndexer * strucIndexer;

        return timeModifier;
      }
    }

    function skillModifierCalc(reqSkills, user) {
      let indexer = 1;
      reqSkills.forEach((skill) => {
        let charSkill = user.apiSkills.find((i) => i.id === skill.typeID);
        if (charSkill !== undefined) {
          if (
            charSkill.id !== 3380 &&
            charSkill.id !== 3388 &&
            charSkill.id !== 45746
          ) {
            indexer = indexer - 0.01 * charSkill.activeLevel;
          }
        }
      });
      return indexer;
    }

    return job;
  };

  return { CalculateResources, CalcualateTime };
}
