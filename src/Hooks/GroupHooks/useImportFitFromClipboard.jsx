import { useContext, useMemo } from "react";
import itemTypes from "../../RawData/searchIndex.json";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { useJobBuild } from "../useJobBuild";
import { useJobManagement } from "../useJobManagement";
import { IsLoggedInContext, UsersContext } from "../../Context/AuthContext";
import { useFirebase } from "../useFirebase";
import { EvePricesContext } from "../../Context/EveDataContext";
import { useRecalcuateJob } from "../GeneralHooks/useRecalculateJob";
import { useManageGroupJobs } from "./useManageGroupJobs";

export function useImportFitFromClipboard() {
  const { activeGroup } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray, groupArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { users } = useContext(UsersContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { buildJob } = useJobBuild();
  const { recalculateJobForNewTotal } = useRecalcuateJob();
  const { addMultipleJobsToGroup } = useManageGroupJobs();
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
    const activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);
    if (!itemArray) return;
    let newPriceIDs = new Set();
    let jobsToSave = new Set();

    const buildRequests = itemArray
      .map((itemEntry) => {
        if (itemEntry.included) {
          return {
            itemID: itemEntry.itemID,
            itemQty: itemEntry.itemCalculatedQty,
            groupID: activeGroup,
          };
        }
      })
      .filter((entry) => entry);

    const groupEntriesToModifiy = buildRequests.filter((entry) =>
      activeGroupObject.includedTypeIDs.includes(entry.itemID)
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

    const newGroupArray = addMultipleJobsToGroup(
      newJobData,
      [...groupArray],
      newJobArray
    );

    const itemPriceData = await Promise.all(itemPriceRequest);

    updateGroupArray(newGroupArray);
    updateJobArray(newJobArray);
    updateEvePrices((prev) => {
      const prevIds = new Set(prev.map((item) => item.typeID));
      const uniqueNewEvePrices = itemPriceData[0].filter(
        (item) => !prevIds.has(item.typeID)
      );
      return [...prev, ...uniqueNewEvePrices];
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
