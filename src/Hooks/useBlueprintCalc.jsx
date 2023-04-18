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
      case 1:
        for (let material of calcData.outputMaterials) {
          const rawIndex = calcData.rawMaterials.findIndex(
            (i) => i.typeID === material.typeID
          );
          material.quantity = manufacturingMaterialCalc(
            calcData.rawMaterials[rawIndex].quantity,
            calcData.runCount,
            calcData.jobCount,
            calcData.bpME,
            calcData.structureType,
            calcData.rigType,
            calcData.systemType
          );
        }
        return calcData.outputMaterials;

      case 2:
        for (let material of calcData.outputMaterials) {
          const rawIndex = calcData.rawMaterials.findIndex(
            (i) => i.typeID === material.typeID
          );
          material.quantity = reactionMaterialCalc(
            calcData.rawMaterials[rawIndex].quantity,
            calcData.runCount,
            calcData.jobCount,
            calcData.rigType,
            calcData.systemType
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
      // console.log(itemRuns)
      // console.log(baseQty)
      // console.log(meModifier);
      // console.log(itemJobs)
      // console.log(x);
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
      return Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
      //console.log(x);
    }
  };

  const CalculateTime = (calcData) => {
    let user = users.find((i) => i.CharacterHash === calcData.CharacterHash);
    if (user === undefined) {
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
        const indySkill = userSkills.find((i) => i.id === 3380);
        const advIndySkill = userSkills.find((i) => i.id === 3388);
        const strucData = structureOptions.manStructure.find(
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
        const reactionSkill = userSkills.find((i) => i.id === 45746);
        const strucData = structureOptions.reactionStructure.find(
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

    function skillModifierCalc(reqSkills, userSkills) {
      let indexer = 1;
      if (reqSkills === undefined) {
        return indexer;
      }
      reqSkills.forEach((skill) => {
        let charSkill = userSkills.find((i) => i.id === skill.typeID);
        if (charSkill === undefined) {
          return;
        }
        if (
          charSkill.id !== 3380 &&
          charSkill.id !== 3388 &&
          charSkill.id !== 45746 &&
          charSkill.id !== 22242
        ) {
          indexer = indexer - 0.01 * charSkill.activeLevel;
        }
      });
      return indexer;
    }
  };

  return { CalculateResources, CalculateTime };
}
