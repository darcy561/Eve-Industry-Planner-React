import { useContext } from "react";
import {
  ApplicationSettingsContext,
  MassBuildDisplayContext,
} from "../Context/LayoutContext";
import {
  FirebaseListenersContext,
  UserJobSnapshotContext,
} from "../Context/AuthContext";
import {
  ApiJobsContext,
  JobArrayContext,
  LinkedIDsContext,
} from "../Context/JobContext";
import { IsLoggedInContext } from "../Context/AuthContext";
import { useFirebase } from "./useFirebase";
import { trace } from "@firebase/performance";
import { performance } from "../firebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import {
  CorpEsiDataContext,
  EvePricesContext,
  PersonalESIDataContext,
} from "../Context/EveDataContext";
import { useJobBuild } from "./useJobBuild";
import { STATIONID_RANGE } from "../Context/defaultValues";
import { useHelperFunction } from "./GeneralHooks/useHelperFunctions";
import JobSnapshot from "../Classes/jobSnapshotConstructor";
import getStationData from "../Functions/EveESI/World/getStationData";
import addNewJobToFirebase from "../Functions/Firebase/addNewJob";
import updateJobInFirebase from "../Functions/Firebase/updateJob";
import deleteJobFromFirebase from "../Functions/Firebase/deleteJob";
import uploadJobSnapshotsToFirebase from "../Functions/Firebase/uploadJobSnapshots";
import findOrGetJobObject from "../Functions/Helper/findJobObject";
import manageListenerRequests from "../Functions/Firebase/manageListenerRequests";
import seperateGroupAndJobIDs from "../Functions/Helper/seperateGroupAndJobIDs";
import retrieveJobIDsFromGroupObjects from "../Functions/Helper/getJobIDsFromGroupObjects";

export function useJobManagement() {
  const { jobArray, groupArray, updateJobArray } = useContext(JobArrayContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
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
  const { applicationSettings } = useContext(ApplicationSettingsContext);
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );
  const { getItemPrices } = useFirebase();
  const { buildJob } = useJobBuild();
  const { findParentUser, isItemBuildable, sendSnackbarNotificationSuccess } =
    useHelperFunction();

  const analytics = getAnalytics();
  const parentUser = findParentUser();

  const massBuildMaterials = async (inputJobIDs) => {
    const r = trace(performance, "MassCreateJobProcessFull");
    r.start();
    let finalBuildCount = [];
    let childJobs = [];
    let materialPriceIDs = new Set();
    let newUserJobSnapshot = [...userJobSnapshot];
    const retrievedJobs = [];
    let jobsToSave = new Set();
    let materialsIgnored = new Set();

    for (let inputJobID of inputJobIDs) {
      if (inputJobID.includes("group")) continue;

      let inputJob = await findOrGetJobObject(
        inputJobID,
        jobArray,
        retrievedJobs
      );

      inputJob.build.materials.forEach((material) => {
        materialPriceIDs = new Set(
          materialPriceIDs,
          generatePriceRequestFromJob(inputJob)
        );
        if (inputJob.build.childJobs[material.typeID].length > 0) {
          return;
        }
        if (!isItemBuildable(material.jobType)) {
          return;
        }
        if (applicationSettings.checkTypeIDisExempt(material.typeID)) {
          materialsIgnored.add(material.typeID);
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

    finalBuildCount.forEach((item) => (item.parentJobs = [...item.parentJobs]));

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
      let updatedJob = [...jobArray, ...retrievedJobs].find(
        (i) => i.jobID === inputJobID
      );
      for (let material of updatedJob.build.materials) {
        if (!isItemBuildable(material.jobType)) {
          continue;
        }
        let match = childJobs.find((i) => i.itemID === material.typeID);
        if (!match) {
          continue;
        }
        updatedJob.build.childJobs[material.typeID].push(match.jobID);
      }

      const matchedSnapshot = newUserJobSnapshot.find(
        (i) => i.jobID === updatedJob.jobID
      );
      matchedSnapshot.setSnapshot(updatedJob);

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
      newUserJobSnapshot.push(new JobSnapshot(childJob));

      if (isLoggedIn) {
        await addNewJobToFirebase(childJob);
      }
      retrievedJobs.push(childJob);
    }

    if (isLoggedIn) {
      for (let jobID of [...jobsToSave]) {
        let job = [...jobArray, ...retrievedJobs].find(
          (i) => i.jobID === jobID
        );

        if (!job) {
          return;
        }
        await updateJobInFirebase(job);
      }
      await uploadJobSnapshotsToFirebase(newUserJobSnapshot);
    }
    manageListenerRequests(
      retrievedJobs,
      updateJobArray,
      updateFirebaseListeners,
      firebaseListeners,
      isLoggedIn
    );
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
    updateJobArray((prev) => {
      const existingIDs = new Set(prev.map(({ jobID }) => jobID));
      return [
        ...prev,
        ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
      ];
    });
    updateUserJobSnapshot(newUserJobSnapshot);
    updateMassBuildDisplay((prev) => ({
      ...prev,
      open: false,
    }));

    const jobWord = childJobs.length === 1 ? "Job" : "Jobs";
    const materialWord = materialsIgnored.size === 1 ? "Material" : "Materials";

    sendSnackbarNotificationSuccess(
      `${childJobs.length} ${jobWord} Added, ${materialsIgnored.size} ${materialWord} Ignored.`,
      3
    );
    r.stop();
  };

  const buildItemPriceEntry = async (inputJobIDs) => {
    const finalPriceEntry = [];
    const retrievedJobs = [];

    const { groupIDs, jobIDs } = seperateGroupAndJobIDs(inputJobIDs);

    const groupJobIDs = retrieveJobIDsFromGroupObjects(groupIDs, groupArray);

    const requestedJobObjects = await convertJobIDsToObjects(
      [...jobIDs, ...groupJobIDs],
      jobArray,
      retrievedJobs
    );

    for (let inputJob of requestedJobObjects) {
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
    manageListenerRequests(
      retrievedJobs,
      updateJobArray,
      updateFirebaseListeners,
      firebaseListeners,
      isLoggedIn
    );
    updateJobArray((prev) => {
      const existingIDs = new Set(prev.map(({ jobID }) => jobID));
      return [
        ...prev,
        ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
      ];
    });
    return finalPriceEntry;
  };

  const mergeJobsNew = async (inputJobIDs) => {
    const r = trace(performance, "mergeJobsProcessFull");
    r.start();
    let buildData = [];
    let newJobHold = [];
    let jobsToSave = new Set();
    let newJobArray = [...jobArray];
    const retrievedJobs = [];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newApiJobsArary = [...apiJobs];
    let newLinkedJobIDs = new Set(linkedJobIDs);
    let newLinkedOrderIDs = new Set(linkedOrderIDs);
    let newLinkedTransIDs = new Set(linkedTransIDs);

    for (let inputJobID of inputJobIDs) {
      let currentJob = await findOrGetJobObject(
        inputJobID,
        newJobArray,
        retrievedJobs
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
        let parentJob = [...newJobArray, ...retrievedJobs].find(
          (i) => i.jobID === parentJobID
        );
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
          let matchingJob = [...newJobArray, ...retrievedJobs].find(
            (i) => i.jobID === id
          );
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
        let oldJob = [...newJobArray, ...retrievedJobs].find(
          (i) => i.jobID === oldJobID
        );
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
          deleteJobFromFirebase(oldJob);
          const listener = firebaseListeners.find(({ id }) => oldJob.jobID);
          if (listener) {
            listener.unsubscribe();
          }
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
      newUserJobSnapshot.push(new JobSnapshot(job));
      if (isLoggedIn) {
        await addNewJobToFirebase(job);
      }
    }

    for (let id of [...jobsToSave]) {
      let job = [...newJobArray, ...retrievedJobs].find((i) => i.jobID === id);
      if (!job) {
        return;
      }
      const matchedSnapshot = newUserJobSnapshot.find(
        (i) => i.jobID === job.jobID
      );
      matchedSnapshot.setSnapshot(job);

      if (isLoggedIn) {
        await updateJobInFirebase(job);
      }
    }

    logEvent(analytics, "Merge Jobs", {
      UID: parentUser.accountID,
      MergeCount: buildData.length,
      SaveCount: jobsToSave.size,
      loggedIn: isLoggedIn,
    });

    if (isLoggedIn) {
      await uploadJobSnapshotsToFirebase(newUserJobSnapshot);
    }
    manageListenerRequests(
      [...newJobHold, ...retrievedJobs],
      updateJobArray,
      updateFirebaseListeners,
      firebaseListeners,
      isLoggedIn
    );
    updateLinkedJobIDs([...newLinkedJobIDs]);
    updateLinkedOrderIDs([...newLinkedOrderIDs]);
    updateLinkedTransIDs([...newLinkedTransIDs]);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateJobArray(() => {
      const existingIDs = new Set(newJobArray.map(({ jobID }) => jobID));
      return [
        ...newJobArray,
        ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
        ...newJobHold,
      ];
    });
    updateApiJobs(newApiJobsArary);

    sendSnackbarNotificationSuccess(
      newJobHold.length > 0
        ? `${newJobHold.length} Jobs Merged Successfully`
        : `0 Jobs Merged`,
      3
    );
    r.stop();
  };

  async function calcBrokersFee(marketOrder) {
    let brokerFeePercentage = applicationSettings.citadelBrokersFee;

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
      const stationInfo = await getStationData(marketOrder.location_id);

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

  function timeRemainingCalc(inputTime) {
    if (isNaN(inputTime)) {
      return "Invalid input time";
    }

    const returnArray = [];
    const now = Date.now();
    const timeLeft = inputTime - now;

    if (timeLeft <= 0) {
      return "complete";
    }
    try {
      const day = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hour = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const min = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

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
    } catch (err) {
      return "Time Not Available";
    }
  }

  function generatePriceRequestFromJob({ itemID, build }) {
    const materialTypeIDs = build.materials.map((mat) => mat.typeID);
    return [...new Set([itemID, ...materialTypeIDs])];
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
    massBuildMaterials,
    mergeJobsNew,
    timeRemainingCalc,
  };
}
