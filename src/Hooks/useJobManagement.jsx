import { useContext, useMemo } from "react";
import { functions } from "../firebase";
import {
  SnackBarDataContext,
  DataExchangeContext,
  PageLoadContext,
  LoadingTextContext,
  MultiSelectJobPlannerContext,
  MassBuildDisplayContext,
  DialogDataContext,
} from "../Context/LayoutContext";
import { UserJobSnapshotContext, UsersContext } from "../Context/AuthContext";
import {
  ActiveJobContext,
  ApiJobsContext,
  ArchivedJobsContext,
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
  EvePricesContext,
  PersonalESIDataContext,
} from "../Context/EveDataContext";
import { useJobBuild } from "./useJobBuild";
import { useEveApi } from "./useEveApi";
import { httpsCallable } from "firebase/functions";

export function useJobManagement() {
  const { jobArray, groupArray, updateJobArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { activeJob, activeGroup, updateActiveJob } =
    useContext(ActiveJobContext);
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

  const { updateDataExchange } = useContext(DataExchangeContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updateArchivedJobs } = useContext(ArchivedJobsContext);
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
  const {
    addNewJob,
    downloadCharacterJobs,
    getArchivedJobData,
    getItemPrices,
    removeJob,
    uploadGroups,
    uploadJob,
    uploadUserJobSnapshot,
    userJobListener,
  } = useFirebase();
  const { stationData } = useEveApi();
  const { buildJob, checkAllowBuild } = useJobBuild();
  const checkAppVersion = httpsCallable(
    functions,
    "appVersion-checkAppVersion"
  );

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

  const openEditJob = async (inputJobID) => {
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
    }));
    updatePageLoad(true);
    let verify = [checkAppVersion({ appVersion: __APP_VERSION__ })];

    let [openJob] = await findJobData(
      inputJobID,
      newUserJobSnapshot,
      newJobArray
    );
    // newUserJobSnapshot = lockUserJob(
    //   parentUser.CharacterHash,
    //   inputJobID,
    //   newUserJobSnapshot
    // );

    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
      jobDataComp: true,
      priceData: true,
    }));

    let itemIDs = new Set(generatePriceRequestFromJob(openJob));
    for (let mat of openJob.build.materials) {
      if (mat.childJob.length === 0) {
        continue;
      }
      for (let cJ of mat.childJob) {
        let [, snapshot] = await findJobData(
          cJ,
          newUserJobSnapshot,
          newJobArray
        );
        if (snapshot === undefined) {
          continue;
        }

        itemIDs = new Set(itemIDs, generatePriceRequestFromSnapshot(snapshot));
      }
    }
    if (isLoggedIn) {
      let newArchivedJobsArray = await getArchivedJobData(openJob.itemID);
      updateArchivedJobs(newArchivedJobsArray);
      uploadUserJobSnapshot(newUserJobSnapshot);
    }
    let [appVersionPass] = await Promise.all(verify);
    if (!appVersionPass.data) {
      updateLoadingText((prevObj) => ({
        ...prevObj,
        jobData: false,
        jobDataComp: false,
        priceData: false,
        priceDataComp: false,
      }));
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "OutdatedAppVersion",
        open: true,
        title: "Outdated App Version",
        body: "A newer version of the application is available, refresh the page to begin using this.",
      }));
      return;
    }
    let jobPrices = await getItemPrices([...itemIDs], parentUser);
    if (jobPrices.length > 0) {
      updateEvePrices((prev) => {
        jobPrices = jobPrices.filter(
          (n) => !prev.some((p) => p.typeID === n.typeID)
        );
        return prev.concat(jobPrices);
      });
    }
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateActiveJob(openJob);
    updatePageLoad(false);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      priceDataComp: true,
    }));
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: false,
      jobDataComp: false,
      priceData: false,
      priceDataComp: false,
    }));
    if (isLoggedIn) {
      userJobListener(parentUser, inputJobID);
    }
  };

  const closeEditJob = async (inputJob, jobModified) => {
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    const index = newJobArray.findIndex((x) => inputJob.jobID === x.jobID);
    newJobArray[index] = inputJob;
    // newUserJobSnapshot = unlockUserJob(newUserJobSnapshot, inputJob.jobID);

    newUserJobSnapshot = updateJobSnapshotFromFullJob(
      inputJob,
      newUserJobSnapshot
    );

    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateActiveJob({});

    if (isLoggedIn) {
      await uploadUserJobSnapshot(newUserJobSnapshot);
    }
    if (isLoggedIn && jobModified) {
      await uploadJob(inputJob);
    }
    if (jobModified) {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `${inputJob.name} Updated`,
        severity: "info",
        autoHideDuration: 1000,
      }));
    }
  };

  const switchActiveJob = async (existingJob, requestedJobID, jobModified) => {
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    const index = newJobArray.findIndex((x) => existingJob.jobID === x.jobID);
    newJobArray[index] = existingJob;
    // newUserJobSnapshot = unlockUserJob(newUserJobSnapshot, existingJob.jobID);
    newUserJobSnapshot = updateJobSnapshotFromFullJob(
      existingJob,
      newUserJobSnapshot
    );
    if (isLoggedIn && jobModified) {
      uploadJob(existingJob);
    }
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
    }));
    updatePageLoad(true);
    let [openJob] = await findJobData(
      requestedJobID,
      newUserJobSnapshot,
      newJobArray
    );
    // newUserJobSnapshot = lockUserJob(
    //   parentUser.CharacterHash,
    //   requestedJobID,
    //   newUserJobSnapshot
    // );

    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
      jobDataComp: true,
      priceData: true,
    }));
    let itemIDs = new Set(generatePriceRequestFromJob(openJob));
    for (let mat of openJob.build.materials) {
      if (mat.childJob.length === 0) {
        continue;
      }
      for (let cJ of mat.childJob) {
        let [, snapshot] = await findJobData(
          cJ,
          newUserJobSnapshot,
          newJobArray
        );

        if (snapshot === undefined) {
          continue;
        }
        itemIDs = new Set(itemIDs, generatePriceRequestFromSnapshot(snapshot));
      }
    }
    if (isLoggedIn) {
      let newArchivedJobsArray = await getArchivedJobData(openJob.itemID);
      updateArchivedJobs(newArchivedJobsArray);
      uploadUserJobSnapshot(newUserJobSnapshot);
    }

    let jobPrices = await getItemPrices([...itemIDs], parentUser);
    if (jobPrices.length > 0) {
      updateEvePrices((prev) => {
        jobPrices = jobPrices.filter(
          (n) => !prev.some((p) => p.typeID === n.typeID)
        );
        return prev.concat(jobPrices);
      });
    }
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateActiveJob(openJob);
    updatePageLoad(false);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      priceDataComp: true,
    }));
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: false,
      jobDataComp: false,
      priceData: false,
      priceDataComp: false,
    }));
    if (isLoggedIn) {
      userJobListener(parentUser, requestedJobID);
    }
  };

  const replaceSnapshot = async (inputJob) => {
    const index = jobArray.findIndex((x) => inputJob.jobID === x.jobID);
    jobArray[index] = inputJob;
  };

  const deleteJobSnapshot = (inputJob, newSnapshotArray) => {
    return newSnapshotArray.filter((i) => i.jobID !== inputJob.jobID);
  };

  const newJobSnapshot = (inputJob, newSnapshotArray) => {
    let totalComplete = 0;
    let materialIDs = [];
    let childJobs = [];
    let endDate = null;

    inputJob.build.materials.forEach((material) => {
      materialIDs.push(material.typeID);
      childJobs = childJobs.concat(material.childJob);
      if (material.quantityPurchased >= material.quantity) {
        totalComplete++;
      }
    });

    newSnapshotArray.push(
      Object.assign(
        {},
        new newSnapshot(
          inputJob,
          childJobs,
          totalComplete,
          materialIDs,
          endDate
        )
      )
    );
    return newSnapshotArray;
  };

  const updateJobSnapshotFromFullJob = (inputJob, newSnapshotArray) => {
    let totalComplete = 0;
    let materialIDs = [];
    let childJobs = [];
    let endDate = null;
    let tempJobs = [...inputJob.build.costs.linkedJobs];
    const snapshotIndex = newSnapshotArray.findIndex(
      (i) => i.jobID === inputJob.jobID
    );

    inputJob.build.materials.forEach((material) => {
      materialIDs.push(material.typeID);
      childJobs.push(...material.childJob);
      if (material.quantityPurchased >= material.quantity) {
        totalComplete++;
      }
    });

    if (tempJobs.length > 0) {
      tempJobs.sort((a, b) => {
        if (Date.parse(a.end_date) > Date.parse(b.end_date)) {
          return 1;
        }
        if (Date.parse(a.end_date) < Date.parse(b.end_date)) {
          return -1;
        }
        return 0;
      });
      endDate = Date.parse(tempJobs[0].end_date);
    }

    let replacementSnap = Object.assign(
      {},
      new newSnapshot(inputJob, childJobs, totalComplete, materialIDs, endDate)
    );

    newSnapshotArray[snapshotIndex] = replacementSnap;

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
      let [inputJob] = await findJobData(
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

        if (!finalBuildCount.some((i) => i.typeID === material.typeID)) {
          finalBuildCount.push({
            typeID: material.typeID,
            quantity: material.quantity,
            parentIDs: new Set([inputJob.jobID]),
          });
        } else {
          const index = finalBuildCount.findIndex(
            (i) => i.typeID === material.typeID
          );
          if (index !== -1) {
            finalBuildCount[index].quantity += material.quantity;
            finalBuildCount[index].parentIDs.add(inputJob.jobID);
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

    for (let item of finalBuildCount) {
      if (!checkAllowBuild()) {
        continue;
      }
      const newJob = await buildJob({
        itemID: item.typeID,
        itemQty: item.quantity,
        parentJobs: [...item.parentIDs],
      });
      if (newJob === undefined) {
        continue;
      }
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
    updateUserJobSnapshot(newUserJobSnapshot);
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

  const deleteJobProcess = async (inputJobSnap) => {
    let newApiJobsArary = [...apiJobs];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];
    let newLinkedJobIDs = new Set(linkedJobIDs);
    let newLinkedOrderIDs = new Set(linkedOrderIDs);
    let newLinkedTransIDs = new Set(linkedTransIDs);
    let jobsToSave = new Set();

    let [inputJob] = await findJobData(
      inputJobSnap.jobID,
      newUserJobSnapshot,
      newJobArray
    );

    if (inputJob !== undefined) {
      logEvent(analytics, "DeleteJob", {
        UID: parentUser.accountID,
        itemID: inputJob.itemID,
        loggedIn: isLoggedIn,
      });

      //Removes apiJob references from users
      inputJob.apiJobs.forEach((job) => {
        newLinkedJobIDs.delete(job);
      });

      //Removes inputJob IDs from child jobs
      for (let mat of inputJob.build.materials) {
        if (mat !== null) {
          for (let job of mat.childJob) {
            let [child] = await findJobData(
              job,
              newUserJobSnapshot,
              newJobArray
            );
            if (child === undefined) {
              continue;
            }

            child.parentJob = child.parentJob.filter(
              (i) => i !== inputJob.jobID
            );

            newUserJobSnapshot = updateJobSnapshotFromFullJob(
              child,
              newUserJobSnapshot
            );

            jobsToSave.add(child.jobID);
          }
        }
      }
      //Removes inputJob IDs from Parent jobs
      for (let parentJobID of inputJob.parentJob) {
        let [parentJob] = await findJobData(
          parentJobID,
          newUserJobSnapshot,
          newJobArray
        );
        if (parentJob === undefined) {
          continue;
        }
        for (let mat of parentJob.build.materials) {
          if (mat.childJob === undefined) {
            continue;
          }
          mat.childJob = mat.childJob.filter((i) => i !== inputJob.jobID);
        }
        newUserJobSnapshot = updateJobSnapshotFromFullJob(
          parentJob,
          newUserJobSnapshot
        );
        jobsToSave.add(parentJob.jobID);
      }

      inputJob.build.sale.transactions.forEach((trans) => {
        newLinkedTransIDs.delete(trans.transaction_id);
      });

      inputJob.build.sale.marketOrders.forEach((order) => {
        newLinkedOrderIDs.delete(order.order_id);
      });

      let newMutliSelct = multiSelectJobPlanner.filter(
        (i) => i.jobID !== inputJob.jobID
      );

      newUserJobSnapshot = deleteJobSnapshot(inputJob, newUserJobSnapshot);

      newJobArray = newJobArray.filter((job) => job.jobID !== inputJob.jobID);

      if (isLoggedIn) {
        jobsToSave.forEach((jobID) => {
          let job = newJobArray.find((i) => i.jobID === jobID);
          if (job === undefined) {
            return;
          }
          uploadJob(job);
        });
        uploadUserJobSnapshot(newUserJobSnapshot);
        removeJob(inputJob);
      }

      updateLinkedJobIDs([...newLinkedJobIDs]);
      updateLinkedOrderIDs([...newLinkedOrderIDs]);
      updateLinkedTransIDs([...newLinkedTransIDs]);
      updateApiJobs(newApiJobsArary);
      updateMultiSelectJobPlanner(newMutliSelct);
      updateJobArray(newJobArray);
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `${inputJob.name} Deleted`,
        severity: "error",
        autoHideDuration: 3000,
      }));
    } else {
      newUserJobSnapshot = newUserJobSnapshot.filter(
        (i) => i.jobID !== inputJobSnap.jobID
      );
    }
    updateUserJobSnapshot(newUserJobSnapshot);
    if (isLoggedIn) {
      uploadUserJobSnapshot(newUserJobSnapshot);
    }
  };

  const deleteMultipleJobsProcess = async (inputJobIDs) => {
    const r = trace(performance, "massDeleteProcess");
    r.start();
    let newApiJobsArary = [...apiJobs];
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newLinkedJobIDs = new Set(linkedJobIDs);
    let newLinkedOrderIDs = new Set(linkedOrderIDs);
    let newLinkedTransIDs = new Set(linkedTransIDs);
    let jobsToSave = new Set();

    logEvent(analytics, "Mass Delete", {
      UID: parentUser.accountID,
      buildCount: inputJobIDs.length,
      loggedIn: isLoggedIn,
    });

    for (let inputJobID of inputJobIDs) {
      let [inputJob] = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );

      if (inputJob === undefined) {
        continue;
      }
      inputJob.apiJobs.forEach((job) => {
        newLinkedJobIDs.delete(job);
      });

      inputJob.build.sale.transactions.forEach((trans) => {
        newLinkedTransIDs.delete(trans.order_id);
      });

      inputJob.build.sale.marketOrders.forEach((order) => {
        newLinkedOrderIDs.delete(order.order_id);
      });

      //Removes inputJob IDs from child jobs
      for (let mat of inputJob.build.materials) {
        if (mat === null) {
          continue;
        }
        for (let jobID of mat.childJob) {
          let [child] = await findJobData(
            jobID,
            newUserJobSnapshot,
            newJobArray
          );

          if (child === undefined) {
            continue;
          }
          child.parentJob = child.parentJob.filter((i) => inputJob.jobID !== i);

          jobsToSave.add(child.jobID);
        }
      }
      //Removes inputJob IDs from Parent jobs
      if (inputJob.parentJob !== null) {
        for (let parentJobID of inputJob.parentJob) {
          let [parentJob] = await findJobData(
            parentJobID,
            newUserJobSnapshot,
            newJobArray
          );

          if (parentJob === undefined) {
            continue;
          }
          for (let mat of parentJob.build.materials) {
            if (mat.childJob === undefined) {
              continue;
            }
            mat.childJob = mat.childJob.filter((i) => inputJob.jobID !== i);
          }
          newUserJobSnapshot = updateJobSnapshotFromFullJob(
            parentJob,
            newUserJobSnapshot
          );
          jobsToSave.add(parentJob.jobID);
        }
      }

      newUserJobSnapshot = deleteJobSnapshot(inputJob, newUserJobSnapshot);

      if (isLoggedIn) {
        removeJob(inputJob);
      }
    }
    newJobArray = newJobArray.filter((i) => !inputJobIDs.includes(i.jobID));

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
    updateLinkedJobIDs([...newLinkedJobIDs]);
    updateLinkedOrderIDs([...newLinkedOrderIDs]);
    updateLinkedTransIDs([...newLinkedTransIDs]);
    updateApiJobs(newApiJobsArary);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateJobArray(newJobArray);

    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${inputJobIDs.length} Job/Jobs Deleted`,
      severity: "error",
      autoHideDuration: 3000,
    }));
    r.stop();
  };

  const moveItemsForward = async (inputSnapIDs) => {
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newGroupArray = [...groupArray];
    let groupsModified = false;
    let jobsModified = false;

    const moveJobs = async (inputSnapID) => {
      let [inputJob] = await findJobData(
        inputSnapID,
        newUserJobSnapshot,
        newJobArray
      );
      if (inputJob === undefined) {
        return;
      }

      if (inputJob.jobStatus >= 4) {
        return;
      }

      inputJob.jobStatus++;

      newUserJobSnapshot = updateJobSnapshotFromFullJob(
        inputJob,
        newUserJobSnapshot
      );
      jobsModified = true;
      if (isLoggedIn) {
        uploadJob(inputJob);
      }

      return;
    };
    const moveGroups = async (inputID) => {
      let inputGroup = newGroupArray.find((i) => i.groupID === inputID);
      if (inputGroup === undefined) {
        return;
      }
      if (activeGroup !== null && activeGroup.groupID === inputGroup.groupID) {
        inputGroup = activeGroup;
      }
      if (inputGroup.groupStatus >= 3) {
        return;
      }
      inputGroup.groupStatus++;
      newGroupArray = newGroupArray.filter((i) => i.groupID !== inputID);
      newGroupArray.push(inputGroup);
      groupsModified = true;
      return;
    };

    for (let inputSnapID of inputSnapIDs) {
      if (typeof inputSnapID === "string") {
        await moveGroups(inputSnapID);
      } else {
        await moveJobs(inputSnapID);
      }
    }

    if (isLoggedIn) {
      if (jobsModified) {
        uploadUserJobSnapshot(newUserJobSnapshot);
      }
      if (groupsModified) {
        uploadGroups(newGroupArray);
      }
    }
    if (jobsModified) {
      updateUserJobSnapshot(newUserJobSnapshot);
      updateJobArray(newJobArray);
    }
    if (groupsModified) {
      updateGroupArray(newGroupArray);
    }
  };

  const moveItemsBackward = async (inputSnapIDs) => {
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newGroupArray = [...groupArray];
    let groupsModified = false;
    let jobsModified = false;

    const moveJobs = async (inputSnapID) => {
      let [inputJob] = await findJobData(
        inputSnapID,
        newUserJobSnapshot,
        newJobArray
      );
      if (inputJob === undefined) {
        return;
      }

      if (inputJob.jobStatus === 0) {
        return;
      }

      inputJob.jobStatus--;

      newUserJobSnapshot = updateJobSnapshotFromFullJob(
        inputJob,
        newUserJobSnapshot
      );
      jobsModified = true;
      if (isLoggedIn) {
        uploadJob(inputJob);
      }

      return;
    };
    const moveGroups = async (inputID) => {
      let inputGroup = newGroupArray.find((i) => i.groupID === inputID);
      if (inputGroup === undefined) {
        return;
      }
      if (activeGroup !== null && activeGroup.groupID === inputGroup.groupID) {
        inputGroup = activeGroup;
      }
      if (inputGroup.groupStatus === 0) {
        return;
      }
      inputGroup.groupStatus--;
      newGroupArray = newGroupArray.filter((i) => i.groupID !== inputID);
      newGroupArray.push(inputGroup);
      groupsModified = true;
      return;
    };

    for (let inputSnapID of inputSnapIDs) {
      if (typeof inputSnapID === "string") {
        await moveGroups(inputSnapID);
      } else {
        await moveJobs(inputSnapID);
      }
    }

    if (isLoggedIn) {
      if (jobsModified) {
        uploadUserJobSnapshot(newUserJobSnapshot);
      }
      if (groupsModified) {
        uploadGroups(newGroupArray);
      }
    }
    if (jobsModified) {
      updateUserJobSnapshot(newUserJobSnapshot);
      updateJobArray(newJobArray);
    }
    if (groupsModified) {
      updateGroupArray(newGroupArray);
    }
  };

  const buildShoppingList = async (inputJobIDs) => {
    let finalShoppingList = [];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];

    for (let inputJobID of inputJobIDs) {
      let [inputJob] = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );
      inputJob.build.materials.forEach((material) => {
        if (material.quantityPurchased >= material.quantity) {
          return;
        }
        if (!finalShoppingList.find((i) => i.typeID === material.typeID)) {
          finalShoppingList.push({
            name: material.name,
            typeID: material.typeID,
            quantity: material.quantity - material.quantityPurchased,
            quantityLessAsset: 0,
            volume: material.volume,
            hasChild: material.childJob.length > 0 ? true : false,
            isVisible: false,
          });
        } else {
          const index = finalShoppingList.findIndex(
            (i) => i.typeID === material.typeID
          );
          if (index !== -1) {
            finalShoppingList[index].quantity +=
              material.quantity - material.quantityPurchased;
          }
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
    let finalPriceEntry = [];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];

    for (let inputJobID of inputJobIDs) {
      let [inputJob] = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );

      inputJob.build.materials.forEach((material) => {
        if (
          material.quantityPurchased < material.quantity &&
          material.childJob.length === 0
        ) {
          if (!finalPriceEntry.some((i) => i.typeID === material.typeID)) {
            finalPriceEntry.push({
              name: material.name,
              typeID: material.typeID,
              quantity: material.quantity,
              itemPrice: 0,
              confirmed: false,
              jobRef: [inputJob.jobID],
            });
          } else {
            let index = finalPriceEntry.findIndex(
              (i) => i.typeID === material.typeID
            );
            finalPriceEntry[index].quantity += material.quantity;
            finalPriceEntry[index].jobRef.push(inputJob.jobID);
          }
        }
      });
    }
    finalPriceEntry.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name < b.name) {
        return 1;
      }
      return 0;
    });
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    return finalPriceEntry;
  };

  const findJobData = async (
    inputJobID,
    chosenSnapshotArray,
    chosenJobArray
  ) => {
    let jobSnapshot = chosenSnapshotArray.find((i) => i.jobID === inputJobID);

    let foundJob = chosenJobArray.find((i) => i.jobID === inputJobID);
    if (activeJob.jobID === inputJobID) {
      foundJob = activeJob;
    }
    if (foundJob === undefined && jobSnapshot !== undefined) {
      foundJob = await downloadCharacterJobs(jobSnapshot.jobID);
      chosenJobArray.push(foundJob);
    }
    return [foundJob, jobSnapshot];
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
      let [currentJob] = await findJobData(
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

  const calcBrokersFee = async (user, marketOrder) => {
    let brokerFeePercentage = parentUser.settings.editJob.citadelBrokersFee;
    let factionStanding = { standing: 0 };
    let corpStanding = { standing: 0 };

    if (marketOrder.location_id.toString().length < 10) {
      const userSkills = esiSkills.find(
        (i) => i.user === user.CharacterHash
      ).skills;
      const userStandings = esiStandings.find(
        (i) => i.user === user.CharacterHash
      ).standings;
      const brokerSkill = userSkills.find((i) => i.id === 3446);
      const stationInfo = await stationData(marketOrder.location_id);
      factionStanding = userStandings.find(
        (i) => i.from_id === stationInfo.race_id
      );
      corpStanding = userStandings.find((i) => i.from_id === stationInfo.owner);
      if (factionStanding === undefined) {
        factionStanding = { standing: 0 };
      }
      if (corpStanding === undefined) {
        corpStanding = { standing: 0 };
      }

      brokerFeePercentage =
        3 -
        0.3 * brokerSkill.activeLevel -
        0.03 * factionStanding.standing -
        0.02 * corpStanding.standing;
    }

    let brokersFee =
      (brokerFeePercentage / 100) *
      (marketOrder.price * marketOrder.volume_total);

    if (brokersFee < 100) {
      brokersFee = 100;
    }

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
    let priceIDRequest = new Set();
    priceIDRequest.add(inputJob.itemID);
    inputJob.build.materials.forEach((mat) => {
      priceIDRequest.add(mat.typeID);
    });
    return [...priceIDRequest];
  };

  const generatePriceRequestFromSnapshot = (snapshot) => {
    let priceIDRequest = new Set();

    priceIDRequest.add(snapshot.itemID);
    priceIDRequest = new Set(priceIDRequest, snapshot.materialIDs);
    return [...priceIDRequest];
  };

  const findBlueprintType = (blueprintID) => {
    if (blueprintID === undefined) {
      return "bpc";
    }
    for (let entry of esiBlueprints) {
      let blueprintData = entry.blueprints.find(
        (i) => i.item_id === blueprintID
      );
      if (blueprintData === undefined) {
        return "bpc";
      }
      if (blueprintData.quantity === -2) {
        return "bpc";
      }
      return "bp";
    }
  };

  return {
    buildItemPriceEntry,
    buildShoppingList,
    calcBrokersFee,
    closeEditJob,
    deleteJobProcess,
    deleteJobSnapshot,
    deleteMultipleJobsProcess,
    findBlueprintType,
    findJobData,
    generatePriceRequestFromJob,
    generatePriceRequestFromSnapshot,
    lockUserJob,
    massBuildMaterials,
    mergeJobsNew,
    moveItemsForward,
    moveItemsBackward,
    newJobProcess,
    newJobSnapshot,
    openEditJob,
    switchActiveJob,
    timeRemainingCalc,
    replaceSnapshot,
    unlockUserJob,
    updateJobSnapshotFromFullJob,
  };
}
