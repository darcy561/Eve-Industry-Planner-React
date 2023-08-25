import { useContext } from "react";
import { UsersContext } from "../Context/AuthContext";
import { jobTypes } from "../Context/defaultValues";
import { structureOptions } from "../Context/defaultValues";
import { PersonalESIDataContext } from "../Context/EveDataContext";

export function useBlueprintCalc() {
  const { users } = useContext(UsersContext);
  const { esiSkills } = useContext(PersonalESIDataContext);

  const CalculateResources = (calcData) => {
    switch (calcData.jobType) {
      case jobTypes.manufacturing:
        const manStructureData =
          structureOptions.manStructure[calcData.structureType];
        const manRigData = structureOptions.manRigs[calcData.rigType];
        const manSystemData = structureOptions.manSystem[calcData.systemType];

        for (let material of calcData.outputMaterials) {
          const rawIndex = calcData.rawMaterials.findIndex(
            (i) => i.typeID === material.typeID
          );
          material.quantity = manufacturingMaterialCalc(
            calcData.rawMaterials[rawIndex].quantity,
            calcData.runCount,
            calcData.jobCount,
            calcData.bpME,
            manStructureData.material,
            manRigData.material,
            manSystemData.value
          );
        }
        return calcData.outputMaterials;

      case jobTypes.reaction:
        const reactionRigData = structureOptions.reactionRigs[calcData.rigType];
        const reactionSystemData =
          structureOptions.reactionSystem[calcData.systemType];

        for (let material of calcData.outputMaterials) {
          const rawIndex = calcData.rawMaterials.findIndex(
            (i) => i.typeID === material.typeID
          );
          material.quantity = reactionMaterialCalc(
            calcData.rawMaterials[rawIndex].quantity,
            calcData.runCount,
            calcData.jobCount,
            reactionRigData.material,
            reactionSystemData.value
          );
        }
        return calcData.outputMaterials;
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
      return Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
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
      return Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
    }
  };

  const CalculateResources_New = (calcData) => {
    switch (calcData.jobType) {
      case jobTypes.manufacturing:
        const manStructureData =
          structureOptions.manStructure[calcData.structureID]?.material || 0;
        const manRigData =
          structureOptions.manRigs[calcData.rigID]?.material || 0;
        const manSystemData =
          structureOptions.manSystem[calcData.systemTypeID]?.value || 0;

        Object.values({ ...calcData.materialCount }).forEach((material) => {
          material.quantity = manufacturingMaterialCalc(
            material.rawQuantity,
            calcData.runCount,
            calcData.jobCount,
            calcData.ME,
            manStructureData,
            manRigData,
            manSystemData
          );
        });

        return calcData.materialCount;

      case jobTypes.reaction:
        const reactionRigData =
          structureOptions.reactionRigs[calcData.rigID]?.material || 0;
        const reactionSystemData =
          structureOptions.reactionSystem[calcData.systemTypeID]?.value || 0;

        Object.values({ ...calcData.materialCount }).forEach((material) => {
          material.quantity = reactionMaterialCalc(
            material.rawQuantity,
            calcData.runCount,
            calcData.jobCount,
            reactionRigData,
            reactionSystemData
          );
        });

        return calcData.materialCount;
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
      return Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
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
      return Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
    }
  };

  const CalculateTime = (calcData) => {
    let user = users.find((i) => i.CharacterHash === calcData.CharacterHash);
    if (!user) {
      user = users.find((i) => i.ParentUser);
    }

    let userSkills = esiSkills.find((i) => i.user === user.CharacterHash).data;

    let timeModifier = timeModifierCalc(calcData, userSkills);
    let skillModifier = skillModifierCalc(calcData.skills, userSkills);

    return Math.floor(
      calcData.rawTime * timeModifier * skillModifier * calcData.runCount
    );

    function timeModifierCalc(job, userSkills) {
      if (job.jobType === jobTypes.manufacturing) {
        const indySkill = userSkills[3380].activeLevel;
        const advIndySkill = userSkills[3388].activeLevel;
        const strucData = structureOptions.manStructure[job.structureType].time;
        const rigData = structureOptions.manRigs[job.rigType].time;

        let teIndexer = 1;
        let indyIndexer = 1 - 0.04 * indySkill;
        let advIndyIndexer = 1 - 0.03 * advIndySkill;
        let strucIndexer = 1 - strucData;
        let rigIndexer = 1 - rigData;

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
          teIndexer * indyIndexer * advIndyIndexer * strucIndexer * rigIndexer;
        return timeModifier;
      }
      if (job.jobType === jobTypes.reaction) {
        const reactionSkill = userSkills[45746].activeLevel;
        const strucData =
          structureOptions.reactionStructure[job.structureType].time;
        const rigData = structureOptions.reactionRigs[job.rigType].time;

        let reacIndexer = 1 - 0.04 * reactionSkill;
        let strucIndexer = 1 - strucData;
        let rigIndexer = 1 - rigData;

        if (reacIndexer < 0.8) {
          reacIndexer = 0.8;
        }

        let timeModifier = reacIndexer * strucIndexer * rigIndexer;

        return timeModifier;
      }
    }

    function skillModifierCalc(reqSkills, userSkills) {
      const skillsToIgnore = new Set([3380, 3388, 45746, 22242]);
      let indexer = 1;
      if (!reqSkills) {
        return indexer;
      }
      reqSkills.forEach((skill) => {
        let { id, activeLevel } = userSkills[skill.typeID];
        if (!id || !activeLevel) {
          return indexer;
        }
        if (skillsToIgnore.has(id)) return;

        indexer = indexer - 0.01 * activeLevel;
      });
      return indexer;
    }
  };
  const CalculateTime_New = (calcData, jobSkills) => {
    let user = users.find(
      (i) => i.CharacterHash === calcData.selectedCharacter
    );
    if (!user) {
      user = users.find((i) => i.ParentUser);
    }

    const userSkills = esiSkills.find(
      (i) => i.user === user.CharacterHash
    ).data;

    const timeModifier = timeModifierCalc(calcData, userSkills);
    const skillModifier = skillModifierCalc(jobSkills, userSkills);

    return Math.floor(
      calcData.rawTime * timeModifier * skillModifier * calcData.runCount
    );

    function timeModifierCalc(job, userSkills) {
      if (job.jobType === jobTypes.manufacturing) {
        const indySkill = userSkills[3380].activeLevel;
        const advIndySkill = userSkills[3388].activeLevel;
        const strucData = structureOptions.manStructure[job.structureID].time;
        const rigData = structureOptions.manRigs[job.rigID].time;

        let teIndexer = 1;
        let indyIndexer = 1 - 0.04 * indySkill;
        let advIndyIndexer = 1 - 0.03 * advIndySkill;
        let strucIndexer = 1 - strucData;
        let rigIndexer = 1 - rigData;

        for (let x = 1; x <= job.TE; x++) {
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
          teIndexer * indyIndexer * advIndyIndexer * strucIndexer * rigIndexer;
        return timeModifier;
      }
      if (job.jobType === jobTypes.reaction) {
        const reactionSkill = userSkills[45746].activeLevel;
        const strucData =
          structureOptions.reactionStructure[job.structureID].time;
        const rigData = structureOptions.reactionRigs[job.rigID].time;

        let reacIndexer = 1 - 0.04 * reactionSkill;
        let strucIndexer = 1 - strucData;
        let rigIndexer = 1 - rigData;

        if (reacIndexer < 0.8) {
          reacIndexer = 0.8;
        }

        let timeModifier = reacIndexer * strucIndexer * rigIndexer;

        return timeModifier;
      }
    }

    function skillModifierCalc(reqSkills, userSkills) {
      const skillsToIgnore = new Set([3380, 3388, 45746, 22242]);
      let indexer = 1;
      if (!reqSkills) {
        return indexer;
      }
      reqSkills.forEach((skill) => {
        let { id, activeLevel } = userSkills[skill.typeID];
        if (!id || !activeLevel) {
          return indexer;
        }
        if (skillsToIgnore.has(id)) return;

        indexer = indexer - 0.01 * activeLevel;
      });
      return indexer;
    }
  };

  return {
    CalculateResources,
    CalculateTime,
    CalculateTime_New,
    CalculateResources_New,
  };
}
