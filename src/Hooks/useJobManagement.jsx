import { useContext, useMemo } from "react";
import {
  SnackBarDataContext,
  DataExchangeContext,
  MassBuildDisplayContext,
} from "../Context/LayoutContext";
import { UserJobSnapshotContext, UsersContext } from "../Context/AuthContext";
import {
  ActiveJobContext,
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

export function useJobManagement() {
  const { jobArray, groupArray, updateJobArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { activeJob, activeGroup, updateActiveJob, updateActiveGroup } =
    useContext(ActiveJobContext);
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

  class newSnapshot {
    constructor(inputJob, childJobs, totalComplete, materialIDs, endDate) {
      this.jobOwner = inputJob.build.buildChar;
      this.isLocked = false;
      this.lockedTimestamp = null;
      this.lockedUser = null;
      this.jobID = inputJob.jobID;
      this.name = inputJob.name;
      this.runCount = inputJob.runCount;
      this.jobCount = inputJob.jobCount;
      this.jobStatus = inputJob.jobStatus;
      this.jobType = inputJob.jobType;
      this.itemID = inputJob.itemID;
      this.apiJobs = [...inputJob.apiJobs];
      this.apiOrders = [...inputJob.apiOrders];
      this.apiTransactions = [...inputJob.apiTransactions];
      this.itemQuantity = inputJob.build.products.totalQuantity;
      this.totalMaterials = inputJob.build.materials.length;
      this.totalComplete = totalComplete;
      this.buildVer = inputJob.buildVer;
      this.parentJob = inputJob.parentJob;
      this.childJobs = childJobs;
      this.materialIDs = materialIDs;
      this.metaLevel = inputJob.metaLevel;
      this.groupID = inputJob.groupID || null;
      this.endDateDisplay = endDate;
    }
  }

  const analytics = getAnalytics();

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const newJobProcess = async (buildRequest) => {
    const t = trace(performance, "CreateJobProcessFull");
    let newUserJobSnapshot = [...userJobSnapshot];
    let newGroupArray = [...groupArray];
    let isActiveGroup = false;
    let selectedGroup = null;
    t.start();
    if (!checkAllowBuild()) {
      return;
    }
    updateDataExchange(true);
    const newJob = await buildJob(buildRequest);
    if (newJob === undefined) {
      return;
    }
    let promiseArray = [
      getItemPrices(generatePriceRequestFromJob(newJob), parentUser),
    ];
    if (newJob.groupID === null) {
      newUserJobSnapshot = newJobSnapshot(newJob, newUserJobSnapshot);
    }

    addJobToGroup: if (newJob.groupID !== null) {
      selectedGroup = newGroupArray.find((i) => i.groupID === newJob.groupID);

      if (activeGroup.groupID === newJob.groupID) {
        selectedGroup = activeGroup;
        isActiveGroup = true;
      }

      if (selectedGroup === undefined) break addJobToGroup;

      let newIncludedJobIDs = new Set(selectedGroup.includedJobIDs);
      let newIncludedTypeIDs = new Set(selectedGroup.includedTypeIDs);
      let newMaterialIDs = new Set(selectedGroup.materialIDs);
      let newOutputJobCount = selectedGroup.outputJobCount;

      if (newJob.parentJob.length === 0) {
        newOutputJobCount++;
      }

      newMaterialIDs.add(newJob.itemID);
      newJob.build.materials.forEach((mat) => {
        newMaterialIDs.add(mat.typeID);
      });
      newIncludedJobIDs.add(newJob.jobID);
      newIncludedTypeIDs.add(newJob.itemID);

      selectedGroup.includedJobIDs = [...newIncludedJobIDs];
      selectedGroup.includedTypeIDs = [...newIncludedTypeIDs];
      selectedGroup.materialIDs = [...newMaterialIDs];
      selectedGroup.outputJobCount = newOutputJobCount;
    }

    if (isLoggedIn) {
      if (!buildRequest.hasOwnProperty("groupID")) {
        uploadUserJobSnapshot(newUserJobSnapshot);
      }
      addNewJob(newJob);
      userJobListener(parentUser, newJob.jobID);
    } else {
      updateJobArray((prev) => [...prev, newJob]);
    }

    logEvent(analytics, "New Job", {
      loggedIn: isLoggedIn,
      UID: parentUser.accountID,
      name: newJob.name,
      itemID: newJob.itemID,
    });

    let returnPromiseArray = await Promise.all(promiseArray);

    if (buildRequest.hasOwnProperty("groupID")) {
      updateJobArray((prev) => [...prev, newJob]);
      updateGroupArray(newGroupArray);
      if (
        isActiveGroup &&
        selectedGroup !== null &&
        selectedGroup !== undefined
      ) {
        updateActiveGroup({ ...selectedGroup });
      }
      if (isLoggedIn) {
        uploadGroups(newGroupArray);
      }
    } else {
      updateUserJobSnapshot(newUserJobSnapshot);
    }
    updateEvePrices((prev) => {
      let newEvePrices = returnPromiseArray[0].filter(
        (n) => !prev.some((p) => p.typeID === n.typeID)
      );
      return prev.concat(newEvePrices);
    });
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

  const replaceSnapshot = async (inputJob) => {
    const index = jobArray.findIndex((x) => inputJob.jobID === x.jobID);
    jobArray[index] = inputJob;
  };

  const deleteJobSnapshot = (inputJob, newSnapshotArray) => {
    return newSnapshotArray.filter((i) => i.jobID !== inputJob.jobID);
  };

  const newJobSnapshot = (inputJob, newSnapshotArray) => {
    const materialIDs = inputJob.build.materials.map(
      (material) => material.typeID
    );
    const childJobs = inputJob.build.materials.flatMap(
      (material) => material.childJob
    );
    const totalComplete = inputJob.build.materials.filter(
      (material) => material.quantityPurchased >= material.quantity
    ).length;

    newSnapshotArray.push({
      ...new newSnapshot(inputJob, childJobs, totalComplete, materialIDs, null),
    });

    return newSnapshotArray;
  };

  const updateJobSnapshotFromFullJob = (inputJob, newSnapshotArray) => {
    const materialIDs = inputJob.build.materials.map(
      (material) => material.typeID
    );
    const childJobs = inputJob.build.materials.flatMap(
      (material) => material.childJob
    );
    const totalComplete = inputJob.build.materials.filter(
      (material) => material.quantityPurchased >= material.quantity
    ).length;
    const tempJobs = [...inputJob.build.costs.linkedJobs];
    const endDate =
      tempJobs.length > 0
        ? Date.parse(
            tempJobs.sort(
              (a, b) => Date.parse(b.end_date) - Date.parse(a.end_date)
            )[0].end_date
          )
        : null;
    const snapshotIndex = newSnapshotArray.findIndex(
      (i) => i.jobID === inputJob.jobID
    );

    newSnapshotArray[snapshotIndex] = {
      ...new newSnapshot(
        inputJob,
        childJobs,
        totalComplete,
        materialIDs,
        endDate
      ),
    };
    return newSnapshotArray;
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
        if (material.childJob.length > 0) {
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
        if (match === undefined) {
          continue;
        }
        material.childJob.push(match.jobID);
      }
      newUserJobSnapshot = updateJobSnapshotFromFullJob(
        updatedJob,
        newUserJobSnapshot
      );
      if (activeJob.jobID === updatedJob.jobID) {
        updateActiveJob(updatedJob);
      }
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
        if (job === undefined) {
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
    let itemPrices = await getItemPrices([...materialPriceIDs], parentUser);
    updateEvePrices((prev) => {
      itemPrices = itemPrices.filter(
        (n) => !prev.some((p) => p.typeID === n.typeID)
      );
      return prev.concat(itemPrices);
    });
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

  const buildShoppingList = async (inputJobIDs) => {
    let finalInputList = [];
    let finalShoppingList = [];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];

    for (let inputID of inputJobIDs) {
      if (typeof inputID === "string") {
        let inputGroup = groupArray.find((i) => i.groupID === inputID);
        if (inputGroup === undefined) {
          return;
        }
        if (
          activeGroup !== null &&
          inputGroup.groupID === activeGroup.groupID
        ) {
          inputGroup = activeGroup;
        }
        finalInputList = finalInputList.concat([...inputGroup.includedJobIDs]);
      } else {
        finalInputList.push(inputID);
      }
    }

    for (let inputJobID of finalInputList) {
      let inputJob = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );

      if (inputJob === undefined) {
        continue;
      }

      inputJob.build.materials.forEach((material) => {
        if (material.quantityPurchased >= material.quantity) {
          return;
        }
        let childState = material.childJob.length > 0 ? true : false;
        let shoppingListEntries = finalShoppingList.filter(
          (i) => i.typeID === material.typeID
        );
        if (shoppingListEntries.length === 0) {
          finalShoppingList.push({
            name: material.name,
            typeID: material.typeID,
            quantity: material.quantity - material.quantityPurchased,
            quantityLessAsset: 0,
            volume: material.volume,
            hasChild: childState,
            isVisible: false,
          });
          return;
        }
        let foundChild = shoppingListEntries.find(
          (i) => i.hasChild === childState
        );
        if (foundChild === undefined) {
          finalShoppingList.push({
            name: material.name,
            typeID: material.typeID,
            quantity: material.quantity - material.quantityPurchased,
            quantityLessAsset: 0,
            volume: material.volume,
            hasChild: childState,
            isVisible: false,
          });
        } else {
          foundChild.quantity += material.quantity - material.quantityPurchased;
        }
      });
    }
    finalShoppingList.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name < b.name) {
        return 1;
      }
      return 0;
    });
    logEvent(analytics, "Build Shopping List", {
      UID: parentUser.accountID,
      buildCount: finalShoppingList.length,
      loggedIn: isLoggedIn,
    });
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    return finalShoppingList;
  };

  const buildItemPriceEntry = async (inputJobIDs) => {
    const finalInputList = [];
    const finalPriceEntry = [];
    const newUserJobSnapshot = [...userJobSnapshot];
    const newJobArray = [...jobArray];

    for (const inputID of inputJobIDs) {
      const inputGroup = groupArray.find((i) => i.groupID === inputID);
      if (!inputGroup) continue;

      const groupInputJobIDs = inputGroup.includedJobIDs || [];
      finalInputList.push(...groupInputJobIDs);
    }

    for (const inputJobID of finalInputList) {
      const inputJob = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );

      inputJob.build.materials.forEach((material) => {
        if (
          material.quantityPurchased >= material.quantity ||
          material.childJob.length > 0
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
      if (currentJob === undefined) {
        continue;
      }
      let buildEntry = buildData.find((i) => i.typeID === currentJob.itemID);

      if (buildEntry === undefined) {
        let childJobArray = [];
        currentJob.build.materials.forEach((mat) => {
          if (mat.childJob.length > 0) {
            childJobArray.push({
              typeID: mat.typeID,
              childJobs: new Set(mat.childJob),
            });
          }
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
          if (childJobEntry === undefined) {
            buildEntry.childJobs.push({
              typeID: mat.typeID,
              childJobs: new Set(mat.childJob),
            });
          } else {
            childJobEntry.childJobs = new Set([
              ...childJobEntry.childJobs,
              ...mat.childJob,
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
        if (replacementJob === undefined) {
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
        if (parentJob === undefined) {
          return;
        }

        let parentMaterial = parentJob.build.materials.find(
          (mat) => mat.typeID === buildItem.typeID
        );
        if (parentMaterial === undefined) {
          return;
        }

        parentMaterial.childJob = parentMaterial.childJob.filter(
          (i) => !buildItem.oldJobIDs.has(i)
        );
        parentMaterial.childJob = parentMaterial.childJob.concat([
          ...buildItem.newJobIDs,
        ]);
        jobsToSave.add(parentJob.jobID);
      });
      for (let itemType of buildItem.childJobs) {
        itemType.childJobs.forEach((id) => {
          let matchingJob = newJobArray.find((i) => i.jobID === id);
          if (matchingJob === undefined) {
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
        let matchingMaterial = replacementJob.build.materials.find(
          (i) => i.typeID === buildItem.typeID
        );
        if (matchingMaterial === undefined) {
          continue;
        }
        matchingMaterial.childJob = matchingMaterial.childJob.concat([
          ...buildItem.newJobIDs,
        ]);
        matchingMaterial.childJob = matchingMaterial.childJob.filter(
          (i) => !buildItem.oldJobIDs.has(i)
        );
      }
    }

    for (let buildItem of buildData) {
      buildItem.oldJobIDs.forEach((oldJobID) => {
        let oldJob = newJobArray.find((i) => i.jobID === oldJobID);
        if (oldJob === undefined) {
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
      if (job === undefined) {
        return;
      }
      newUserJobSnapshot = updateJobSnapshotFromFullJob(
        job,
        newUserJobSnapshot
      );
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

  const calcBrokersFee = async (marketOrder) => {
    let brokerFeePercentage = parentUser.settings.editJob.citadelBrokersFee;

    if (marketOrder.location_id.toString().length < 10) {
      const userSkills = esiSkills.find(
        (i) => i.user === marketOrder.CharacterHash
      )?.data;
      const userStandings = esiStandings.find(
        (i) => i.user === marketOrder.CharacterHash
      )?.data;

      const brokerSkill = userSkills?.find((i) => i.id === 3446);
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

    let brokersFee =
      (brokerFeePercentage / 100) *
      (marketOrder.price * marketOrder.volume_total);
    brokersFee = Math.max(brokersFee, 100);

    return brokersFee;
  };

  const lockUserJob = (CharacterHash, jobID, newUserJobSnapshot) => {
    let snapshot = newUserJobSnapshot.find((i) => i.jobID === jobID);

    snapshot.isLocked = true;
    snapshot.lockedTimestamp = Date.now();
    snapshot.lockedUser = CharacterHash;

    return newUserJobSnapshot;
  };

  const unlockUserJob = (newUserJobSnapshot, jobID) => {
    let snapshot = newUserJobSnapshot.find((i) => i.jobID === jobID);

    snapshot.isLocked = false;
    snapshot.lockedTimestamp = null;
    snapshot.lockedUser = null;

    return newUserJobSnapshot;
  };

  const timeRemainingCalc = (inputTime) => {
    let returnArray = [];
    let now = Date.now();
    let timeLeft = inputTime - now;
    let day = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    let hour = Math.floor(
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
  };

  const generatePriceRequestFromJob = (inputJob) => {
    const { itemID, build } = inputJob;
    const materialTypeIDs = build.materials.map((mat) => mat.typeID);
    return [...new Set([itemID, ...materialTypeIDs])];
  };

  const generatePriceRequestFromSnapshot = (snapshot) => {
    let priceIDRequest = new Set();

    priceIDRequest.add(snapshot.itemID);
    priceIDRequest = new Set([...priceIDRequest, ...snapshot.materialIDs]);
    return [...priceIDRequest];
  };

  const findBlueprintType = (blueprintID) => {
    if (blueprintID === undefined) {
      return "bpc";
    }

    let blueprintData = [
      ...esiBlueprints.flatMap((entry) => entry.data),
      ...corpEsiBlueprints.flatMap((entry) => entry.data),
    ].find((i) => i.item_id === blueprintID);

    if (blueprintData === undefined) {
      return "bpc";
    }

    if (blueprintData.quantity === -2) {
      return "bpc";
    }

    return "bp";
  };

  return {
    buildItemPriceEntry,
    buildShoppingList,
    calcBrokersFee,
    deleteJobSnapshot,
    findBlueprintType,
    generatePriceRequestFromJob,
    generatePriceRequestFromSnapshot,
    lockUserJob,
    massBuildMaterials,
    mergeJobsNew,
    newJobProcess,
    newJobSnapshot,
    timeRemainingCalc,
    replaceSnapshot,
    unlockUserJob,
    updateJobSnapshotFromFullJob,
  };
}
