import { useContext, useMemo } from "react";
import {
  SnackBarDataContext,
  DataExchangeContext,
  MassBuildDisplayContext,
} from "../Context/LayoutContext";
import { UserJobSnapshotContext, UsersContext } from "../Context/AuthContext";
import {
  ApiJobsContext,
  JobArrayContext,
  LinkedIDsContext,
} from "../Context/JobContext";
import { IsLoggedInContext } from "../Context/AuthContext";
import { useFirebase } from "./useFirebase";
import { trace } from "@firebase/performance";
import { performance } from "../firebase";
import { jobTypes } from "../Context/defaultValues";
import { getAnalytics, logEvent } from "firebase/analytics";
import {
  CorpEsiDataContext,
  EvePricesContext,
  PersonalESIDataContext,
} from "../Context/EveDataContext";
import { useJobBuild } from "./useJobBuild";
import { useEveApi } from "./useEveApi";
import { useFindJobObject } from "./GeneralHooks/useFindJobObject";
import { useJobSnapshotManagement } from "./JobHooks/useJobSnapshots";
import { useManageGroupJobs } from "./GroupHooks/useManageGroupJobs";
import { STATIONID_RANGE } from "../Context/defaultValues";

export function useJobManagement() {
  const { jobArray, groupArray, updateJobArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { updateMassBuildDisplay } = useContext(MassBuildDisplayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const {
    linkedJobIDs,
    updateLinkedJobIDs,
    linkedOrderIDs,
    updateLinkedOrderIDs,
    linkedTransIDs,
    updateLinkedTransIDs,
  } = useContext(LinkedIDsContext);
  const { esiBlueprints, esiSkills, esiStandings } = useContext(
    PersonalESIDataContext
  );
  const { corpEsiBlueprints } = useContext(CorpEsiDataContext);
  const {
    addNewJob,
    getItemPrices,
    removeJob,
    uploadGroups,
    uploadJob,
    uploadUserJobSnapshot,
    userJobListener,
  } = useFirebase();
  const { stationData } = useEveApi();
  const { buildJob, checkAllowBuild } = useJobBuild();
  const { findJobData } = useFindJobObject();
  const { newJobSnapshot, updateJobSnapshot } = useJobSnapshotManagement();
  const { addJobToGroup } = useManageGroupJobs();

  const analytics = getAnalytics();

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const newJobProcess = async (buildRequest) => {
    const t = trace(performance, "CreateJobProcessFull");
    let newUserJobSnapshot = [...userJobSnapshot];
    let newGroupArray = [...groupArray];
    let newJobArray = [...jobArray];
    let isActiveGroup = false;

    t.start();
    if (!checkAllowBuild()) {
      return;
    }
    updateDataExchange(true);
    const newJob = await buildJob(buildRequest);
    if (!newJob) {
      return;
    }
    let itemPriceRequest = [
      getItemPrices(generatePriceRequestFromJob(newJob), parentUser),
    ];
    if (!newJob.groupID) {
      newUserJobSnapshot = newJobSnapshot(newJob, newUserJobSnapshot);
    }
    newJobArray.push(newJob);

    addJobToGroup: if (newJob.groupID) {
      newGroupArray = addJobToGroup(newJob, newGroupArray, newJobArray);
    }

    if (isLoggedIn) {
      if (!buildRequest.hasOwnProperty("groupID")) {
        uploadUserJobSnapshot(newUserJobSnapshot);
      }
      addNewJob(newJob);
      userJobListener(parentUser, newJob.jobID);
    }

    updateJobArray(newJobArray);
    logEvent(analytics, "New Job", {
      loggedIn: isLoggedIn,
      UID: parentUser.accountID,
      name: newJob.name,
      itemID: newJob.itemID,
    });

    const itemPriceResult = await Promise.all(itemPriceRequest);

    if (buildRequest.hasOwnProperty("groupID")) {
      updateGroupArray(newGroupArray);
      if (isLoggedIn) {
        uploadGroups(newGroupArray);
      }
    } else {
      updateUserJobSnapshot(newUserJobSnapshot);
    }
    updateEvePrices((prev) => ({
      ...prev,
      ...itemPriceResult,
    }));
    updateDataExchange(false);
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${newJob.name} Added`,
      severity: "success",
      autoHideDuration: 3000,
    }));
    if (buildRequest.hasOwnProperty("parentJobs")) {
      return newJob;
    }
    t.stop();
  };

  const massBuildMaterials = async (inputJobIDs) => {
    const r = trace(performance, "MassCreateJobProcessFull");
    r.start();
    let finalBuildCount = [];
    let childJobs = [];
    let materialPriceIDs = new Set();
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];
    let jobsToSave = new Set();

    for (let inputJobID of inputJobIDs) {
      let inputJob = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );

      inputJob.build.materials.forEach((material) => {
        materialPriceIDs = new Set(
          materialPriceIDs,
          generatePriceRequestFromJob(inputJob)
        );
        if (inputJob.build.childJobs[material.typeID].length > 0) {
          return;
        }
        if (
          material.jobType !== jobTypes.manufacturing &&
          material.jobType !== jobTypes.reaction
        ) {
          return;
        }

        if (!finalBuildCount.some((i) => i.itemID === material.typeID)) {
          finalBuildCount.push({
            itemID: material.typeID,
            itemQty: material.quantity,
            parentJobs: new Set([inputJob.jobID]),
          });
        } else {
          const index = finalBuildCount.findIndex(
            (i) => i.itemID === material.typeID
          );
          if (index !== -1) {
            finalBuildCount[index].itemQty += material.quantity;
            finalBuildCount[index].parentJobs.add(inputJob.jobID);
          }
        }
      });
    }

    logEvent(analytics, "Mass Build", {
      UID: parentUser.accountID,
      buildCount: finalBuildCount.length,
      loggedIn: isLoggedIn,
    });

    updateMassBuildDisplay((prev) => ({
      ...prev,
      open: true,
      currentJob: 0,
      totalJob: finalBuildCount.length,
    }));

    let newJobs = await buildJob(finalBuildCount);

    for (let newJob of newJobs) {
      materialPriceIDs = new Set(
        materialPriceIDs,
        generatePriceRequestFromJob(newJob)
      );
      childJobs.push(newJob);
      logEvent(analytics, "New Job", {
        loggedIn: isLoggedIn,
        UID: parentUser.accountID,
        name: newJob.name,
        itemID: newJob.itemID,
      });
      updateMassBuildDisplay((prev) => ({
        ...prev,
        currentJob: prev.currentJob + 1,
      }));
    }

    for (let inputJobID of inputJobIDs) {
      let updatedJob = newJobArray.find((i) => i.jobID === inputJobID);
      for (let material of updatedJob.build.materials) {
        if (
          material.jobType !== jobTypes.manufacturing &&
          material.jobType !== jobTypes.reaction
        ) {
          continue;
        }
        let match = childJobs.find((i) => i.itemID === material.typeID);
        if (!match) {
          continue;
        }
        updatedJob.build.childJobs[material.typeID].push(match.jobID);
      }
      newUserJobSnapshot = updateJobSnapshot(updatedJob, newUserJobSnapshot);

      jobsToSave.add(updatedJob.jobID);
    }

    childJobs.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    for (let childJob of childJobs) {
      newUserJobSnapshot = newJobSnapshot(childJob, newUserJobSnapshot);

      if (isLoggedIn) {
        addNewJob(childJob);
      }
      newJobArray.push(childJob);
    }

    if (isLoggedIn) {
      jobsToSave.forEach((jobID) => {
        let job = newJobArray.find((i) => i.jobID === jobID);
        if (!job) {
          return;
        }
        uploadJob(job);
      });
      uploadUserJobSnapshot(newUserJobSnapshot);
    }
    updateMassBuildDisplay((prev) => ({
      ...prev,
      totalPrice: [...materialPriceIDs].length,
    }));
    const itemPriceResult = await getItemPrices(
      [...materialPriceIDs],
      parentUser
    );
    updateEvePrices((prev) => ({
      ...prev,
      ...itemPriceResult,
    }));
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateMassBuildDisplay((prev) => ({
      ...prev,
      open: false,
    }));
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${childJobs.length} Job/Jobs Added`,
      severity: "success",
      autoHideDuration: 3000,
    }));
    r.stop();
  };

  const buildItemPriceEntry = async (inputJobIDs) => {
    const finalInputList = [];
    const finalPriceEntry = [];
    const newUserJobSnapshot = [...userJobSnapshot];
    const newJobArray = [...jobArray];

    for (const inputID of inputJobIDs) {
      if (inputID.includes("group")) {
        const inputGroup = groupArray.find((i) => i.groupID === inputID);
        if (!inputGroup) continue;

        const groupInputJobIDs = inputGroup.includedJobIDs || [];
        finalInputList.push(...groupInputJobIDs);
      } else {
        finalInputList.push(inputID);
      }
    }

    for (const inputJobID of finalInputList) {
      const inputJob = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );
      inputJob.build.materials.forEach((material) => {
        const childJobs = inputJob.build.childJobs[material.typeID];
        if (
          material.quantityPurchased >= material.quantity ||
          childJobs.length > 0
        ) {
          return;
        }

        const existingEntryIndex = finalPriceEntry.findIndex(
          (i) => i.typeID === material.typeID
        );
        if (existingEntryIndex !== -1) {
          finalPriceEntry[existingEntryIndex].quantity += material.quantity;
          finalPriceEntry[existingEntryIndex].jobRef.push(inputJob.jobID);
        } else {
          finalPriceEntry.push({
            name: material.name,
            typeID: material.typeID,
            quantity: material.quantity,
            itemPrice: 0,
            confirmed: false,
            jobRef: [inputJob.jobID],
          });
        }
      });
    }

    finalPriceEntry.sort((a, b) => a.name.localeCompare(b.name));

    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    return finalPriceEntry;
  };

  const mergeJobsNew = async (inputJobIDs) => {
    const r = trace(performance, "mergeJobsProcessFull");
    r.start();
    let buildData = [];
    let newJobHold = [];
    let jobsToSave = new Set();
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newApiJobsArary = [...apiJobs];
    let newLinkedJobIDs = new Set(linkedJobIDs);
    let newLinkedOrderIDs = new Set(linkedOrderIDs);
    let newLinkedTransIDs = new Set(linkedTransIDs);

    for (let inputJobID of inputJobIDs) {
      let currentJob = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );
      if (!currentJob) {
        continue;
      }
      let buildEntry = buildData.find((i) => i.typeID === currentJob.itemID);

      if (!buildEntry) {
        let childJobArray = [];
        currentJob.build.materials.forEach((mat) => {
          if (currentJob.build.childJobs[mat.typeID].length === 0) return;
          childJobArray.push({
            typeID: mat.typeID,
            childJobs: new Set(currentJob.build.childJobs[mat.typeID]),
          });
        });

        buildData.push({
          inputJobCount: 1,
          typeID: currentJob.itemID,
          parentJobs: new Set(currentJob.parentJob),
          childJobs: childJobArray,
          totalItemQuantity: currentJob.build.products.totalQuantity,
          oldJobIDs: new Set([currentJob.jobID]),
          newJobIDs: new Set(),
        });
      } else {
        buildEntry.inputJobCount++;
        buildEntry.parentJobs = new Set([
          ...buildEntry.parentJobs,
          ...currentJob.parentJob,
        ]);
        buildEntry.totalItemQuantity += currentJob.build.products.totalQuantity;
        buildEntry.oldJobIDs.add(currentJob.jobID);

        currentJob.build.materials.forEach((mat) => {
          let childJobEntry = buildEntry.childJobs.find(
            (i) => i.typeID === mat.typeID
          );
          if (!childJobEntry) {
            buildEntry.childJobs.push({
              typeID: mat.typeID,
              childJobs: new Set(currentJob.build.childJobs[mat.typeID]),
            });
          } else {
            childJobEntry.childJobs = new Set([
              ...childJobEntry.childJobs,
              ...currentJob.build.childJobs[mat.typeID],
            ]);
          }
        });
      }
    }

    buildData = buildData.filter(
      (i) => i.inputJobCount > 1 && i.parentJobs.size > 0
    );

    for (let buildItem of buildData) {
      let newJob = await buildJob({
        itemID: buildItem.typeID,
        itemQty: buildItem.totalItemQuantity,
        parentJobs: [...buildItem.parentJobs],
        childJobs: [...buildItem.childJobs],
      });
      buildItem.newJobIDs.add(newJob.jobID);
      newJobHold.push(newJob);
    }

    for (let buildItem of buildData) {
      for (let material of buildItem.childJobs) {
        let replacementJob = newJobHold.find(
          (i) => i.itemID === material.typeID
        );
        if (!replacementJob) {
          continue;
        }
        replacementJob.parentJob = replacementJob.parentJob.concat([
          ...buildItem.newJobIDs,
        ]);
        replacementJob.parentJob = replacementJob.parentJob.filter(
          (i) => !buildItem.oldJobIDs.has(i)
        );
      }
    }

    for (let buildItem of buildData) {
      if (buildItem.inputJobCount < 2) {
        continue;
      }
      buildItem.parentJobs.forEach((parentJobID) => {
        let parentJob = newJobArray.find((i) => i.jobID === parentJobID);
        if (!parentJob) {
          return;
        }

        let parentMaterial = parentJob.build.childJobs[buildItem.typeID];

        parentMaterial = parentMaterial.filter(
          (i) => !buildItem.oldJobIDs.has(i)
        );
        parentMaterial = parentMaterial.concat([...buildItem.newJobIDs]);
        jobsToSave.add(parentJob.jobID);
      });
      for (let itemType of buildItem.childJobs) {
        itemType.childJobs.forEach((id) => {
          let matchingJob = newJobArray.find((i) => i.jobID === id);
          if (!matchingJob) {
            return;
          }
          matchingJob.parentJob = matchingJob.parentJob.filter(
            (i) => !buildItem.oldJobIDs.has(i)
          );
          matchingJob.parentJob = matchingJob.parentJob.concat([
            ...buildItem.newJobIDs,
          ]);
          jobsToSave.add(matchingJob.jobID);
        });
      }
      for (let replacementJob of newJobHold) {
        let matchingMaterial = replacementJob.build.childJobs[buildItem.typeID];
        if (!matchingMaterial) continue;
        matchingMaterial = matchingMaterial.concat([...buildItem.newJobIDs]);
        matchingMaterial = matchingMaterial.filter(
          (i) => !buildItem.oldJobIDs.has(i)
        );
      }
    }

    for (let buildItem of buildData) {
      buildItem.oldJobIDs.forEach((oldJobID) => {
        let oldJob = newJobArray.find((i) => i.jobID === oldJobID);
        if (!oldJob) {
          return;
        }

        oldJob.apiJobs.forEach((jobID) => {
          newLinkedJobIDs.delete(jobID);
        });

        oldJob.build.sale.transactions.forEach((trans) => {
          newLinkedTransIDs.delete(trans.order_id);
        });

        oldJob.build.sale.marketOrders.forEach((order) => {
          newLinkedOrderIDs.delete(order.order_id);
        });
        if (isLoggedIn) {
          removeJob(oldJob);
        }
      });
      newJobArray = newJobArray.filter(
        (i) => !buildItem.oldJobIDs.has(i.jobID)
      );
      newUserJobSnapshot = newUserJobSnapshot.filter(
        (i) => !buildItem.oldJobIDs.has(i.jobID)
      );
    }
    for (let job of newJobHold) {
      newUserJobSnapshot = newJobSnapshot(job, newUserJobSnapshot);
      if (isLoggedIn) {
        addNewJob(job);
      }
    }

    newJobArray = newJobArray.concat(newJobHold);

    jobsToSave.forEach((id) => {
      let job = newJobArray.find((i) => i.jobID === id);
      if (!job) {
        return;
      }
      newUserJobSnapshot = updateJobSnapshot(job, newUserJobSnapshot);
      if (isLoggedIn) {
        uploadJob(job);
      }
    });

    logEvent(analytics, "Merge Jobs", {
      UID: parentUser.accountID,
      MergeCount: buildData.length,
      SaveCount: jobsToSave.size,
      loggedIn: isLoggedIn,
    });

    if (isLoggedIn) {
      uploadUserJobSnapshot(newUserJobSnapshot);
    }
    updateLinkedJobIDs([...newLinkedJobIDs]);
    updateLinkedOrderIDs([...newLinkedOrderIDs]);
    updateLinkedTransIDs([...newLinkedTransIDs]);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateJobArray(newJobArray);
    updateApiJobs(newApiJobsArary);

    if (newJobHold.length > 0) {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `${newJobHold.length} Jobs Merged Successfully`,
        severity: "success",
        autoHideDuration: 3000,
      }));
    } else {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `0 Jobs Merged`,
        severity: "success",
        autoHideDuration: 3000,
      }));
    }
    r.stop();
  };

  async function calcBrokersFee(marketOrder) {
    let brokerFeePercentage = parentUser.settings.editJob.citadelBrokersFee;

    if (
      marketOrder.location_id >= STATIONID_RANGE.low &&
      marketOrder.location_id <= STATIONID_RANGE.high
    ) {
      const userSkills = esiSkills.find(
        (i) => i.user === marketOrder.CharacterHash
      )?.data;
      const userStandings = esiStandings.find(
        (i) => i.user === marketOrder.CharacterHash
      )?.data;

      const brokerSkill = userSkills[3446];
      const stationInfo = await stationData(marketOrder.location_id);

      const factionStanding =
        userStandings?.find((i) => i.from_id === stationInfo.race_id)
          ?.standing || 0;
      const corpStanding =
        userStandings?.find((i) => i.from_id === stationInfo.owner)?.standing ||
        0;

      brokerFeePercentage =
        3 -
        0.3 * (brokerSkill?.activeLevel || 0) -
        0.03 * factionStanding -
        0.02 * corpStanding;
    }

    const brokersFee =
      (brokerFeePercentage / 100) *
      (marketOrder.price * marketOrder.volume_total);

    return Math.max(brokersFee, 100);
  }

  function lockUserJob(CharacterHash, jobID, newUserJobSnapshot) {
    let snapshot = newUserJobSnapshot.find((i) => i.jobID === jobID);

    snapshot.isLocked = true;
    snapshot.lockedTimestamp = Date.now();
    snapshot.lockedUser = CharacterHash;

    return newUserJobSnapshot;
  }

  function unlockUserJob(newUserJobSnapshot, jobID) {
    let snapshot = newUserJobSnapshot.find((i) => i.jobID === jobID);

    snapshot.isLocked = false;
    snapshot.lockedTimestamp = null;
    snapshot.lockedUser = null;

    return newUserJobSnapshot;
  }

  function timeRemainingCalc(inputTime) {
    const returnArray = [];
    const now = Date.now();
    const timeLeft = inputTime - now;
    const day = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hour = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    let min = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (day <= 0 && hour <= 0 && min <= 0) {
      returnArray.push("complete");
    }
    if (day > 0) {
      returnArray.push(`${day}D`);
    }
    if (hour > 0) {
      returnArray.push(`${hour}H`);
    }
    if (min > 0) {
      returnArray.push(`${min}M`);
    }

    return returnArray.join(" ");
  }

  function generatePriceRequestFromJob({ itemID, build }) {
    const materialTypeIDs = build.materials.map((mat) => mat.typeID);
    return [...new Set([itemID, ...materialTypeIDs])];
  }

  function generatePriceRequestFromSnapshot({ itemID, materialIDs }) {
    return [...new Set([itemID, ...materialIDs])];
  }

  function findBlueprintType(blueprintID) {
    if (!blueprintID) {
      return "bpc";
    }

    let blueprintData = [
      ...esiBlueprints.flatMap((entry) => entry.data),
      ...Array.from(corpEsiBlueprints.values())
        .filter((obj) => Object.keys(obj).length > 0)
        .map(Object.values)
        .reduce((acc, val) => acc.concat(val), []),
    ].find((i) => i.item_id === blueprintID);

    if (!blueprintData) {
      return "bpc";
    }

    if (blueprintData.quantity === -2) {
      return "bpc";
    }

    return "bp";
  }

  function deepCopyJobObject(inputJob) {
    const newApiJobs = new Set(inputJob.apiJobs);
    const newApiOrders = new Set(inputJob.apiOrders);
    const newApiTransactions = new Set(inputJob.apiTransactions);

    let deepCopy = structuredClone(inputJob);
    deepCopy.apiJobs = newApiJobs;
    deepCopy.apiOrders = newApiOrders;
    deepCopy.apiTransactions = newApiTransactions;

    return deepCopy;
  }

  function findAllChildJobCountOrIDs(
    childJobsFromJobObject,
    temporaryChildJobObject,
    parentChildCache
  ) {
    const childJobObjectCombinedIDs = Object.values(
      childJobsFromJobObject
    ).flat();

    const temporaryChildJobObjectIDs = Object.values(
      temporaryChildJobObject
    ).flatMap(({ jobID }) => jobID);

    const { parentCacheIDsToAdd, parentCacheIDsToRemove } = Object.values(
      parentChildCache
    ).reduce(
      (prev, materialObject) => ({
        parentCacheIDsToAdd: [
          ...prev.parentCacheIDsToAdd,
          ...materialObject.add,
        ],
        parentCacheIDsToRemove: [
          ...prev.parentCacheIDsToRemove,
          ...materialObject.remove,
        ],
      }),
      {
        parentCacheIDsToAdd: [],
        parentCacheIDsToRemove: [],
      }
    );

    const finalfilteredArray = [
      ...new Set(
        [
          ...childJobObjectCombinedIDs,
          ...temporaryChildJobObjectIDs,
          ...parentCacheIDsToAdd,
        ].filter((i) => !parentCacheIDsToRemove.includes(i))
      ),
    ];

    return {
      childJobIDs: finalfilteredArray,
      childJobCount: finalfilteredArray.length,
    };
  }

  return {
    buildItemPriceEntry,
    calcBrokersFee,
    deepCopyJobObject,
    findAllChildJobCountOrIDs,
    findBlueprintType,
    generatePriceRequestFromJob,
    generatePriceRequestFromSnapshot,
    lockUserJob,
    massBuildMaterials,
    mergeJobsNew,
    newJobProcess,
    timeRemainingCalc,
    unlockUserJob,
  };
}
