import { useContext } from "react";
import itemTypes from "../../RawData/searchIndex.json";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { useJobBuild } from "../useJobBuild";
import { useJobManagement } from "../useJobManagement";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { useFirebase } from "../useFirebase";
import { EvePricesContext } from "../../Context/EveDataContext";
import { useRecalcuateJob } from "../GeneralHooks/useRecalculateJob";
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";

export function useImportFitFromClipboard() {
  const { activeGroup } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray, groupArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { buildJob } = useJobBuild();
  const { recalculateJobForNewTotal } = useRecalcuateJob();
  const { generatePriceRequestFromJob } = useJobManagement();
  const { addNewJob, getItemPrices } = useFirebase();
  const { findParentUser } = useHelperFunction();

  const parentUser = findParentUser();

  async function importFromClipboard() {
    const itemNameRegex = /^\[(?<itemName>.+),\s*(?<fittingName>.+)\]/g;
    const itemMatchesRegex =
      /^(?![^\r\n,]*,)(?<module>[^\[\r\n]+)|^(?:(?![^\r\n,]*,)(?!\[|\sx\d).)+/gm;
    const itemWithQuantitiesRegex = /^(?<module>[^\n]*?)\s*x(?<quantity>\d+)/gm;
    const itemsWithChargesRegex =
      /^(?![^\r\n,]*[\[\]])(?=.*,)(?<module>[^,\r\n]+),\s*(?<charge>[^,\r\n]+)$/gm;

    const importedText = await navigator.clipboard.readText();
    const itemNameMatch = [...importedText.matchAll(itemNameRegex)];
    const itemMatches = [...importedText.matchAll(itemMatchesRegex)];
    const itemsWithQuantities = [
      ...importedText.matchAll(itemWithQuantitiesRegex),
    ];
    const itemsWithCharges = [...importedText.matchAll(itemsWithChargesRegex)];
    const shipNameAndFittingName = itemNameMatch[0];

    if (!shipNameAndFittingName) {
      return { importedItems: [], fittingName: "" };
    }
    const { itemName, fittingName } = shipNameAndFittingName.groups;

    const objectArray = [
      {
        itemName: itemName,
        itemBaseQty: 1,
        itemCalculatedQty: 1,
        included: false,
        buildable: false,
      },
    ];

    const filteredItemMatches = itemMatches
      .filter((match) => !match[0].match(/\sx\d/))
      .map((match) => match[0].trim());

    filteredItemMatches.forEach((itemName) => {
      updateObjectArray(itemName);
    });

    itemsWithQuantities.forEach((match) => {
      updateObjectArray(match.groups.module, match.groups.quantity);
    });

    itemsWithCharges.forEach((match) => {
      updateObjectArray(match.groups.module);
      updateObjectArray(match.groups.charge);
    });

    objectArray.forEach((item) => {
      const matchingItemType = itemTypes.find(
        (itemType) => itemType.name === item.itemName
      );
      if (matchingItemType) {
        item.itemID = matchingItemType.itemID;
        item.included = true;
        item.buildable = true;
      }
    });

    function updateObjectArray(itemName, quantity = 1) {
      const foundItem = objectArray.find((item) => item.itemName === itemName);
      if (foundItem) {
        foundItem.itemBaseQty += quantity;
        foundItem.itemCalculatedQty += quantity;
      } else {
        objectArray.push({
          itemName,
          itemBaseQty: +quantity,
          itemCalculatedQty: +quantity,
          included: false,
          buildable: false,
        });
      }
    }

    return { importedItems: objectArray, fittingName };
  }

  function convertImportedItemsToBuildRequests(inputArray) {
    return inputArray
      .map((itemEntry) => {
        if (itemEntry.included && itemEntry.buildable) {
          return {
            itemID: itemEntry.itemID,
            itemQty: itemEntry.itemCalculatedQty,
          };
        }
      })
      .filter((entry) => entry);
  }

  const finalBuildRequests = async (itemArray) => {
    const activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);
    if (!itemArray) return;
    let newPriceIDs = new Set();
    let jobsToSave = new Set();
    const newGroupArray = [...groupArray];

    const buildRequests = convertImportedItemsToBuildRequests(itemArray);

    buildRequests.forEach((request) => {
      request.groupID = activeGroup;
    });

    const groupEntriesToModifiy = buildRequests.filter((entry) =>
      activeGroupObject.includedTypeIDs.has(entry.itemID)
    );
    const itemsToBuild = buildRequests.filter(
      (entry) => !groupEntriesToModifiy.some((i) => i.itemID === entry.itemID)
    );

    const newJobData = await buildJob(itemsToBuild);

    const newJobArray = [...jobArray, ...newJobData];

    for (const job of newJobData) {
      newPriceIDs = new Set(newPriceIDs, generatePriceRequestFromJob(job));
      jobsToSave.add(job.jobID);

      job.build.materials.forEach((material) => {
        let materialMatch = newJobArray.find(
          (i) => i.itemID === material.typeID && i.groupID === activeGroup
        );
        if (materialMatch) {
          materialMatch.parentJob.push(job.jobID);
          job.build.childJobs[material.typeID].push(materialMatch.jobID);
          jobsToSave.add(materialMatch.jobID);
        }
      });
    }

    const itemPriceRequest = [getItemPrices([...newPriceIDs], parentUser)];

    for (const entry of groupEntriesToModifiy) {
      const job = newJobArray.find((i) => i.itemID === entry.itemID);
      if (!job) continue;
      const newQuantity = job.build.products.totalQuantity + entry.itemQty;

      recalculateJobForNewTotal(job, newQuantity);
      jobsToSave.add(job.jobID);
    }

    const matchedGroup = newGroupArray.find(
      (i) => i.groupID === jobObject.groupID
    );
    matchedGroup.addJobsToGroup(newJobs);

    const itemPriceResult = await Promise.all(itemPriceRequest);

    updateGroupArray(newGroupArray);
    updateJobArray(newJobArray);
    updateEvePrices((prev) => ({
      ...prev,
      ...itemPriceResult,
    }));
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
    convertImportedItemsToBuildRequests,
  };
}
