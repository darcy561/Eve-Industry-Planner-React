import { useContext, useMemo } from "react";
import itemTypes from "../../RawData/searchIndex.json";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { useJobBuild } from "../useJobBuild";
import { useBlueprintCalc } from "../useBlueprintCalc";
import { useJobManagement } from "../useJobManagement";
import { IsLoggedInContext, UsersContext } from "../../Context/AuthContext";
import { useFirebase } from "../useFirebase";
import { EvePricesContext } from "../../Context/EveDataContext";

export function useImportFitFromClipboard() {
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray, groupArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { users } = useContext(UsersContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { buildJob, recalculateItemQty } = useJobBuild();
  const { CalculateResources, CalculateTime } = useBlueprintCalc();
  const { generatePriceRequestFromJob } = useJobManagement();
  const { addNewJob, getItemPrices } = useFirebase();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const importFromClipboard = async () => {
    const itemNameRegex = /^\[(?<itemName>.+),\s*(?<fittingName>.+)\]/g;
    const itemMatchesRegex = /^[^\[\r\n]+|^(?:(?!\[|\sx\d).)+/gm;
    const itemWithQuantitiesRegex = /^(?<item>[^\n]*?)\s*x(?<quantity>\d+)/gm;

    const importedText = await navigator.clipboard.readText();
    const itemNameMatch = [...importedText.matchAll(itemNameRegex)];
    const itemMatches = [...importedText.matchAll(itemMatchesRegex)];
    const itemsWithQuantities = [
      ...importedText.matchAll(itemWithQuantitiesRegex),
    ];

    if (itemNameMatch.length === 0) {
      return [];
    }

    const filteredItemMatches = itemMatches
      .filter((match) => !match[0].match(/\sx\d/))
      .map((match) => match[0].trim());

    const objectArray = [
      {
        itemName: itemNameMatch[0].groups.itemName,
        itemBaseQty: 1,
        itemCalculatedQty: 1,
        included: true,
      },
    ];

    filteredItemMatches.forEach((itemName) => {
      const foundItem = objectArray.find((item) => item.itemName === itemName);
      if (foundItem) {
        foundItem.itemBaseQty += 1;
        foundItem.itemCalculatedQty += 1;
      } else {
        objectArray.push({
          itemName,
          itemBaseQty: 1,
          itemCalculatedQty: 1,
          included: true,
        });
      }
    });

    itemsWithQuantities.forEach((match) => {
      const foundItem = objectArray.find(
        (item) => item.itemName === match.groups.item
      );
      if (foundItem) {
        foundItem.itemBaseQty += Number(match.groups.quantity);
        foundItem.itemCalculatedQty += Number(match.groups.quantity);
      } else {
        objectArray.push({
          itemName: match.groups.item,
          itemBaseQty: Number(match.groups.quantity),
          itemCalculatedQty: Number(match.groups.quantity),
          included: true,
        });
      }
    });

    for (let i = objectArray.length - 1; i >= 0; i--) {
      const matchingItemType = itemTypes.find(
        (itemType) => itemType.name === objectArray[i].itemName
      );
      if (matchingItemType) {
        objectArray[i].itemID = matchingItemType.itemID;
      } else {
        objectArray.splice(i, 1);
      }
    }

    return objectArray;
  };

  const finalBuildRequests = async (itemArray) => {
    if (!itemArray) return;
    let newJobArray = [...jobArray];
    let newPriceIDs = new Set();
    let jobsToSave = new Set();

    const buildRequests = itemArray
      .map((itemEntry) => {
        if (itemEntry.included) {
          return {
            itemID: itemEntry.itemID,
            itemQty: itemEntry.itemCalculatedQty,
            groupID: activeGroup.groupID,
          };
        }
      })
      .filter((entry) => entry);

    const groupEntriesToModifiy = buildRequests.filter((entry) =>
      activeGroup.includedTypeIDs.includes(entry.itemID)
    );
    const itemsToBuild = buildRequests.filter(
      (entry) => !groupEntriesToModifiy.some((i) => i.itemID === entry.itemID)
    );

    const newJobData = await buildJob(itemsToBuild);

    for (const job of newJobData) {
      newPriceIDs = new Set(newPriceIDs, generatePriceRequestFromJob(job));
      jobsToSave.add(job.jobID);

      job.build.materials.forEach((material) => {
        let materialMatch = newJobArray.find(
          (i) =>
            i.itemID === material.typeID && i.groupID === activeGroup.groupID
        );
        if (materialMatch) {
          materialMatch.parentJob.push(job.jobID);
          material.childJob.push(materialMatch.jobID);
          jobsToSave.add(materialMatch.jobID);
        }
      });
    }

    const itemPriceRequest = [getItemPrices([...newPriceIDs], parentUser)];

    for (const entry of groupEntriesToModifiy) {
      const job = newJobArray.find((i) => i.itemID === entry.itemID);
      if (!job) continue;
      const newQuantity = job.build.products.totalQuantity + entry.itemQty;

      recalculateItemQty(job, newQuantity);

      job.build.materials = CalculateResources({
        jobType: job.jobType,
        rawMaterials: job.rawData.materials,
        outputMaterials: job.build.materials,
        runCount: job.runCount,
        jobCount: job.jobCount,
        bpME: job.bpME,
        structureType: job.structureType,
        rigType: job.rigType,
        systemType: job.systemType,
      });
      job.build.products.totalQuantity =
        job.rawData.products[0].quantity * job.runCount * job.jobCount;

      job.build.products.quantityPerJob =
        job.rawData.products[0].quantity * job.jobCount;

      job.build.time = CalculateTime({
        jobType: job.jobType,
        CharacterHash: job.build.buildChar,
        structureType: job.structureType,
        rigType: job.rigType,
        runCount: job.runCount,
        bpTE: job.bpTE,
        rawTime: job.rawData.time,
        skills: job.skills,
      });
      jobsToSave.add(job.jobID);
    }

    const {
      newIncludedTypeIDs,
      newIncludedJobIDs,
      newOuputJobCount,
      newMaterialIDs,
    } = newJobData.reduce(
      (prev, entry) => {
        prev.newIncludedJobIDs.add(entry.jobID);
        prev.newIncludedTypeIDs.add(entry.itemID);
        prev.newOuputJobCount++;

        entry.build.materials.forEach((mat) => {
          prev.newMaterialIDs.add(mat.typeID);
        });

        return prev;
      },
      {
        newIncludedTypeIDs: new Set(),
        newIncludedJobIDs: new Set(),
        newOuputJobCount: 1,
        newMaterialIDs: new Set(),
      }
    );

    const itemPriceData = await Promise.all(itemPriceRequest);
    newJobArray = newJobArray.concat(newJobData);
    updateActiveGroup((prev) => ({
      ...prev,
      includedJobIDs: [
        ...new Set([...prev.includedJobIDs, ...newIncludedJobIDs]),
      ],
      includedTypeIDs: [
        ...new Set([...prev.includedTypeIDs, ...newIncludedTypeIDs]),
      ],
      outputJobCount: prev.outputJobCount + newOuputJobCount,
      materialIDs: [...new Set([...prev.materialIDs, ...newMaterialIDs])],
    }));
    updateJobArray(newJobArray);
    updateEvePrices((prev) => {
      let newEvePrices = itemPriceData[0].filter(
        (n) => !prev.some((p) => p.typeID === n.typeID)
      );
      return prev.concat(newEvePrices);
    });
    if (isLoggedIn) {
      jobsToSave.forEach((id) => {
        let matchedJob = newJobArray.find((i) => i.jobID === id);
        if (!matchedJob) return;
        addNewJob(matchedJob);
      });
    }
  };

  return {
    finalBuildRequests,
    importFromClipboard,
  };
}
