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
import { EvePricesContext } from "../Context/EveDataContext";
import { useJobBuild } from "./useJobBuild";
import { useEveApi } from "./useEveApi";
import { httpsCallable } from "firebase/functions";

export function useJobManagement() {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
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
  const {
    addNewJob,
    downloadCharacterJobs,
    getArchivedJobData,
    getItemPrices,
    removeJob,
    updateMainUserDoc,
    uploadJob,
    uploadJobAsSnapshot,
    uploadUserJobSnapshot,
    userJobListener,
  } = useFirebase();
  const { stationData } = useEveApi();
  const { buildJob, checkAllowBuild, recalculateItemQty } = useJobBuild();
  const t = trace(performance, "CreateJobProcessFull");
  const r = trace(performance, "MassCreateJobProcessFull");
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
      this.isSnapshot = inputJob.isSnapshot;
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
  class updateSnapshot {
    constructor(inputJob, endDate) {
      this.jobOwner = inputJob.jobOwner;
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
      this.isSnapshot = inputJob.isSnapshot || true;
      this.apiJobs = [...inputJob.apiJobs];
      this.apiOrders = [...inputJob.apiOrders];
      this.apiTransactions = [...inputJob.apiTransactions];
      this.itemQuantity = inputJob.itemQuantity;
      this.totalMaterials = inputJob.totalMaterials;
      this.totalComplete = inputJob.totalComplete;
      this.buildVer = inputJob.buildVer;
      this.parentJob = inputJob.parentJob;
      this.childJobs = inputJob.childJobs;
      this.materialIDs = inputJob.materialIDs;
      this.metaLevel = inputJob.metaLevel;
      this.groupID = inputJob.groupID || null;
      this.endDateDisplay = endDate;
    }
  }

  const analytics = getAnalytics();
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);
  const parentUserIndex = useMemo(() => {
    return users.findIndex((i) => i.ParentUser);
  }, [users]);

  const newJobProcess = async (buildRequest) => {
    t.start();
    if (checkAllowBuild()) {
      updateDataExchange(true);
      const newJob = await buildJob(buildRequest);
      if (newJob !== undefined) {
        let priceIDRequest = new Set();
        let promiseArray = [];
        priceIDRequest.add(newJob.itemID);
        newJob.build.materials.forEach((mat) => {
          priceIDRequest.add(mat.typeID);
        });
        let itemPrices = getItemPrices([...priceIDRequest], parentUser);
        promiseArray.push(itemPrices);

        let newUserJobSnapshot = newJobSnapshot(newJob, [...userJobSnapshot]);
        if (isLoggedIn) {
          await uploadUserJobSnapshot(newUserJobSnapshot);
          await addNewJob(newJob);
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

        updateUserJobSnapshot(newUserJobSnapshot);
        updateEvePrices((prev) => prev.concat(returnPromiseArray[0]));
        updateDataExchange(false);
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: `${newJob.name} Added`,
          severity: "success",
          autoHideDuration: 3000,
        }));
        if (buildRequest.parentJobs !== undefined) {
          return newJob;
        }
      }
      t.stop();
    }
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

    let itemIDs = new Set();
    itemIDs.add(openJob.itemID);
    openJob.build.materials.forEach((mat) => {
      itemIDs.add(mat.typeID);
      if (mat.childJob.length > 0) {
        mat.childJob.forEach((cJ) => {
          let job = jobArray.find((i) => i.jobID === cJ);
          if (job !== undefined) {
            itemIDs.add(job.itemID);
            if (job.isSnapshot) {
              job.materialIDs.forEach((o) => {
                itemIDs.add(o);
              });
            } else {
              job.build.materials.forEach((i) => {
                itemIDs.add(i.typeID);
              });
            }
          }
        });
      }
    });
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
      updateEvePrices((prev) => prev.concat(jobPrices));
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

    newUserJobSnapshot = updateJobSnapshotActiveJob(
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
      await updateMainUserDoc();
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
    newUserJobSnapshot = updateJobSnapshotActiveJob(
      existingJob,
      newUserJobSnapshot
    );
    if (isLoggedIn && jobModified) {
      await uploadJob(existingJob);
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
    let itemIDs = new Set();
    itemIDs.add(openJob.itemID);
    openJob.build.materials.forEach((mat) => {
      itemIDs.add(mat.typeID);
      if (mat.childJob.length > 0) {
        mat.childJob.forEach((cJ) => {
          let job = newJobArray.find((i) => i.jobID === cJ);
          if (job !== undefined) {
            itemIDs.add(job.itemID);
            if (job.isSnapshot) {
              job.materialIDs.forEach((o) => {
                itemIDs.add(o);
              });
            } else {
              job.build.materials.forEach((i) => {
                itemIDs.add(i.typeID);
              });
            }
          }
        });
      }
    });
    if (isLoggedIn) {
      let newArchivedJobsArray = await getArchivedJobData(openJob.itemID);
      updateArchivedJobs(newArchivedJobsArray);
      uploadUserJobSnapshot(newUserJobSnapshot);
    }

    let jobPrices = await getItemPrices([...itemIDs], parentUser);
    if (jobPrices.length > 0) {
      updateEvePrices((prev) => prev.concat(jobPrices));
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

  const updateJobSnapshot = (inputSnap, newSnapshotArray) => {
    let totalComplete = 0;
    let materialIDs = [];
    let childJobs = [];
    let endDate = null;
    let inputJob = null;

    if (inputSnap === undefined) {
      return null;
    }

    const index = newSnapshotArray.findIndex(
      (i) => i.jobID === inputSnap.jobID
    );
    if (!inputSnap.isSnapshot) {
      inputJob = jobArray.find((i) => i.jobID === inputSnap.jobID);
      let tempJobs = [...inputJob.build.costs.linkedJobs];
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
        new newSnapshot(
          inputJob,
          childJobs,
          totalComplete,
          materialIDs,
          endDate
        )
      );

      newSnapshotArray[index] = replacementSnap;
    } else {
      let replacementSnap = Object.assign(
        {},
        new updateSnapshot(inputSnap, endDate)
      );
      newSnapshotArray[index] = replacementSnap;
    }
    return newSnapshotArray;
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
          endDate,
          false
        )
      )
    );
    return newSnapshotArray;
  };

  const updateJobSnapshotActiveJob = (inputJob, newSnapshotArray) => {
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
    r.start();
    let finalBuildCount = [];
    let childJobs = [];
    let materialPriceIDs = new Set();
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];
    for (let inputJobID of inputJobIDs) {
      let [inputJob] = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );

      inputJob.build.materials.forEach((material) => {
        materialPriceIDs.add(material.typeID);
        if (material.childJob.length === 0) {
          if (
            material.jobType === jobTypes.manufacturing ||
            material.jobType === jobTypes.reaction
          ) {
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
          }
        }
      });
    }

    updateMassBuildDisplay((prev) => ({
      ...prev,
      open: true,
      currentJob: 0,
      totalJob: finalBuildCount.length,
    }));

    for (let item of finalBuildCount) {
      if (checkAllowBuild()) {
        const newJob = await buildJob({
          itemID: item.typeID,
          itemQty: item.quantity,
          parentJobs: [...item.parentIDs],
        });
        if (newJob === undefined) {
          continue;
        }
        materialPriceIDs.add(newJob.itemID);
        newJob.build.materials.forEach((mat) => {
          materialPriceIDs.add(mat.typeID);
        });
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
    }

    for (let inputJobID of inputJobIDs) {
      let updatedJob = newJobArray.find((i) => i.jobID === inputJobID);
      for (let material of updatedJob.build.materials) {
        if (
          material.jobType === jobTypes.manufacturing ||
          material.jobType === jobTypes.reaction
        ) {
          let match = childJobs.find((i) => i.itemID === material.typeID);
          if (match !== undefined) {
            material.childJob.push(match.jobID);
          }
        }
      }
      newUserJobSnapshot = updateJobSnapshotActiveJob(
        updatedJob,
        newUserJobSnapshot
      );
      if (activeJob.jobID === updatedJob.jobID) {
        updateActiveJob(updatedJob);
      }
      if (isLoggedIn) {
        await uploadJob(updatedJob);
      }
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
        await addNewJob(childJob);
      }
      newJobArray.push(childJob);
    }

    if (isLoggedIn) {
      await uploadUserJobSnapshot(newUserJobSnapshot);
    }
    updateMassBuildDisplay((prev) => ({
      ...prev,
      totalPrice: [...materialPriceIDs].length,
    }));
    let itemPrices = await getItemPrices([...materialPriceIDs], parentUser);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateEvePrices((prev) => prev.concat(itemPrices));
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

    let [inputJob] = await findJobData(
      inputJobSnap.jobID,
      newUserJobSnapshot,
      newJobArray
    );

    if (inputJob !== undefined) {
      logEvent(analytics, "DeleteJob", {
        UID: parentUser.accountID,
        jobID: inputJob.jobID,
        name: inputJob.name,
        itemID: inputJob.itemID,
        stage: inputJob.stage,
        loggedIn: isLoggedIn,
      });

      //Removes apiJob references from users
      inputJob.apiJobs.forEach((job) => {
        newLinkedJobIDs.delete(job);
        const y = apiJobs.findIndex((u) => u.job_id === job);
        if (y !== -1) {
          newApiJobsArary[y].linked = false;
        }
      });

      //Removes inputJob IDs from child jobs
      for (let mat of inputJob.build.materials) {
        if (mat !== null) {
          for (let job of mat.childJob) {
            let child = jobArray.find((i) => i.jobID === job);
            if (child !== undefined) {
              if (child.isSnapshot) {
                child = await downloadCharacterJobs(child);
                child.isSnapshot = false;
              }
              const ParentIDIndex = child.parentJob.findIndex(
                (i) => i === inputJob.jobID
              );
              if (ParentIDIndex !== -1) {
                child.parentJob.splice(ParentIDIndex, 1);
                await replaceSnapshot(child);
                newUserJobSnapshot = updateJobSnapshot(
                  child,
                  newUserJobSnapshot
                );
                if (isLoggedIn) {
                  await uploadJob(child);
                }
              }
            }
          }
        }
      }
      //Removes inputJob IDs from Parent jobs
      if (inputJob.parentJob !== null) {
        for (let parentJobID of inputJob.parentJob) {
          let parentJob = jobArray.find((i) => i.jobID === parentJobID);
          if (parentJob !== undefined) {
            if (parentJob.isSnapshot) {
              parentJob = await downloadCharacterJobs(parentJob);
              parentJob.isSnapshot = false;
            }
            for (let mat of parentJob.build.materials) {
              if (mat.childJob !== undefined) {
                let index = mat.childJob.findIndex((i) => i === inputJob.jobID);
                if (index !== -1) {
                  mat.childJob.splice(index, 1);
                }
              }
            }
            await replaceSnapshot(parentJob);
            newUserJobSnapshot = updateJobSnapshot(
              parentJob,
              newUserJobSnapshot
            );
            if (isLoggedIn) {
              await uploadJob(parentJob);
            }
          }
        }
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

      updateLinkedJobIDs([...newLinkedJobIDs]);
      updateLinkedOrderIDs([...newLinkedOrderIDs]);
      updateLinkedTransIDs([...newLinkedTransIDs]);
      updateApiJobs(newApiJobsArary);
      updateMultiSelectJobPlanner(newMutliSelct);

      if (isLoggedIn) {
        updateMainUserDoc();
        uploadUserJobSnapshot(newUserJobSnapshot);
        removeJob(inputJob);
      }

      newJobArray = newJobArray.filter((job) => job.jobID !== inputJob.jobID);
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
  };

  const deleteMultipleJobsProcess = async (inputJobIDs, updateState) => {
    let newApiJobsArary = [...apiJobs];
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newLinkedJobIDs = new Set(linkedJobIDs);
    let newLinkedOrderIDs = new Set(linkedOrderIDs);
    let newLinkedTransIDs = new Set(linkedTransIDs);

    for (let inputJobID of inputJobIDs) {
      let [inputJob, jobSnapshot] = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );

      if (jobSnapshot === undefined) {
        continue;
      }

      if (inputJob !== undefined) {
        inputJob.apiJobs.forEach((job) => {
          newLinkedJobIDs.delete(job);
          const y = apiJobs.findIndex((u) => u.job_id === job);
          if (y !== -1) {
            newApiJobsArary[y].linked = false;
          }
        });

        inputJob.build.sale.transactions.forEach((trans) => {
          newLinkedTransIDs.delete(trans.order_id);
        });

        inputJob.build.sale.marketOrders.forEach((order) => {
          newLinkedOrderIDs.delete(order.order_id);
        });

        const jobIndex = newJobArray.findIndex(
          (j) => j.jobID === jobSnapshot.jobID
        );
        const jobSnapshotIndex = newUserJobSnapshot.findIndex(
          (i) => i.jobID === jobSnapshot.jobID
        );

        //Removes inputJob IDs from child jobs
        for (let mat of inputJob.build.materials) {
          if (mat !== null) {
            for (let job of mat.childJob) {
              let child = jobArray.find((i) => i.jobID === job);
              if (child !== undefined) {
                if (child.isSnapshot) {
                  child = await downloadCharacterJobs(child);
                  child.isSnapshot = false;
                }
                const ParentIDIndex = child.parentJob.findIndex(
                  (i) => i === inputJob.jobID
                );
                if (ParentIDIndex !== -1) {
                  child.parentJob.splice(ParentIDIndex, 1);
                  if (isLoggedIn) {
                    await uploadJob(child);
                  }
                  await replaceSnapshot(child);
                }
              }
            }
          }
        }
        //Removes inputJob IDs from Parent jobs
        if (inputJob.parentJob !== null) {
          for (let parentJobID of inputJob.parentJob) {
            let parentJobSnap = newUserJobSnapshot.find(
              (i) => i.jobID === parentJobID
            );
            let parentJob = null;
            if (parentJobSnap !== undefined && parentJobSnap.isSnapshot) {
              parentJob = await downloadCharacterJobs(parentJobSnap);
              parentJobSnap.isSnapshot = false;
              newJobArray.push(parentJob);
            } else {
              parentJob = newJobArray.find((i) => i.jobID === parentJobID);
            }
            if (parentJob === undefined) {
              continue;
            }
            for (let mat of parentJob.build.materials) {
              if (mat.childJob !== undefined) {
                let index = mat.childJob.findIndex((i) => i === inputJob.jobID);
                if (index !== -1) {
                  mat.childJob.splice(index, 1);
                }
              }
            }
            newUserJobSnapshot = updateJobSnapshotActiveJob(
              parentJob,
              newUserJobSnapshot
            );
            if (isLoggedIn) {
              await uploadJob(parentJob);
            }
          }
        }
        if (jobIndex !== -1) {
          newJobArray.splice(jobIndex, 1);
        }
        if (jobSnapshotIndex !== -1) {
          newUserJobSnapshot.splice(jobSnapshotIndex, 1);
        }
        newUserJobSnapshot = deleteJobSnapshot(inputJob, newUserJobSnapshot);
        if (isLoggedIn) {
          await removeJob(inputJob);
        }
      }
    }
    console.log(newUserJobSnapshot);
    if (updateState) {
      if (isLoggedIn) {
        updateMainUserDoc();
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
    }
  };

  const moveMultipleJobsForward = async (inputSnapIDs) => {
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    for (let inputSnapID of inputSnapIDs) {
      let inputSnap = newUserJobSnapshot.find((i) => i.jobID === inputSnapID);
      if (inputSnap.jobStatus >= 4) {
        continue;
      }
      let job = newJobArray.find((i) => i.jobID === inputSnap.jobID);
      inputSnap.jobStatus++;
      if (job !== undefined) {
        job.jobStatus++;
      }
      if (inputSnap.isSnapshot) {
        newUserJobSnapshot = updateJobSnapshot(inputSnap, newUserJobSnapshot);
      } else {
        newUserJobSnapshot = updateJobSnapshotActiveJob(
          job,
          newUserJobSnapshot
        );
      }
      if (isLoggedIn) {
        if (inputSnap.isSnapshot) {
          await uploadJobAsSnapshot(inputSnap);
        } else {
          await uploadJob(job);
        }
      }
    }
    if (isLoggedIn) {
      uploadUserJobSnapshot(newUserJobSnapshot);
    }
    updateUserJobSnapshot(newUserJobSnapshot);
    updateJobArray(newJobArray);
  };

  const moveMultipleJobsBackward = async (inputSnapIDs) => {
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    for (let inputSnapID of inputSnapIDs) {
      let inputSnap = newUserJobSnapshot.find((i) => i.jobID === inputSnapID);
      if (inputSnap.jobStatus <= 0) {
        continue;
      }
      let job = newJobArray.find((i) => i.jobID === inputSnap.jobID);
      inputSnap.jobStatus--;
      if (job !== undefined) {
        job.jobStatus--;
      }
      if (inputSnap.isSnapshot) {
        newUserJobSnapshot = updateJobSnapshot(inputSnap, newUserJobSnapshot);
      } else {
        newUserJobSnapshot = updateJobSnapshotActiveJob(
          job,
          newUserJobSnapshot
        );
      }
      if (isLoggedIn) {
        if (inputSnap.isSnapshot) {
          await uploadJobAsSnapshot(inputSnap);
        } else {
          await uploadJob(job);
        }
      }
    }
    if (isLoggedIn) {
      uploadUserJobSnapshot(newUserJobSnapshot);
    }
    updateUserJobSnapshot(newUserJobSnapshot);
    updateJobArray(newJobArray);
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
        if (material.quantityPurchased < material.quantity) {
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
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    return finalShoppingList;
  };

  const buildItemPriceEntry = async (inputJobIDs) => {
    let finalPriceEntry = [];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];
    let inputJob = null;

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

  const mergeJobs = async (inputJobIDs) => {
    let totalItems = 0;
    let parentJobs = [];
    let childJobs = [];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];
    let inputJob = null;

    for (let inputJobID of inputJobIDs) {
      [inputJob] = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );
      console.log(inputJobID);

      totalItems += inputJob.build.products.totalQuantity;
      for (let parentJobID of inputJob.parentJob) {
        if (!parentJobs.includes(parentJobID)) {
          let [parentMatch] = await findJobData(
            parentJobID,
            newUserJobSnapshot,
            newJobArray
          );

          if (parentMatch === undefined) {
            continue;
          }
          console.log(parentMatch);
          parentJobs.push(parentMatch);
        }
      }
      inputJob.build.materials.forEach((mat) => {
        let match = childJobs.find((i) => i.typeID === mat.typeID);
        if (match === undefined) {
          childJobs.push({ typeID: mat.typeID, childJob: mat.childJob });
        } else {
          mat.childJob.forEach((childJobID) => {
            match.childJob.push(childJobID);
          });
        }
      });
    }
    console.log(inputJob);
    await deleteMultipleJobsProcess(inputJobIDs);
    console.log(inputJob);
    let newJob = await newJobProcess({
      itemID: inputJob.itemID,
      itemQty: totalItems,
      parentJobs: parentJobs,
    });
    for (let job of parentJobs) {
      let mat = job.build.materials.find((i) => i.typeID === newJob.itemID);

      mat.childJob.push(newJob.jobID);
    }
    for (let mat of newJob.build.materials) {
      if (
        mat.jobType === jobTypes.manufacturing ||
        mat.jobType === jobTypes.reaction
      ) {
        let match = childJobs.find((i) => i.typeID === mat.typeID);
        if (match !== undefined) {
          for (let childJobID of match.childJob) {
            let jobArrayMatch = jobArray.find((i) => i.jobID === childJobID);
            if (!mat.childJob.includes(childJobID)) {
              mat.childJob.push(childJobID);
            }
            if (!jobArrayMatch.parentJob.includes(newJob.jobID)) {
              jobArrayMatch.parentJob.push(newJob.jobID);
              if (isLoggedIn) {
                await uploadJob(jobArrayMatch);
              }
              newUserJobSnapshot = updateJobSnapshot(
                jobArrayMatch,
                newUserJobSnapshot
              );
            }
          }
        }
      }
    }
    if (isLoggedIn) {
      // await updateMainUserDoc();
      await uploadJob(newJob);
    }
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
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
      foundJob = await downloadCharacterJobs(jobSnapshot);
      jobSnapshot.isSnapshot = false;
      chosenJobArray.push(foundJob);
    }
    return [foundJob, jobSnapshot];
  };

  const mergeJobsNew = async (inputJobIDs) => {
    let newJobBuildData = [];
    let jobIDsToRemove = new Set();
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
      if (newJobBuildData.some((i) => i.typeID === currentJob.itemID)) {
        let index = newJobBuildData.findIndex(
          (i) => i.typeID === currentJob.itemID
        );
        currentJob.parentJob.forEach((i) => {
          newJobBuildData[index].parentJobs.add(i);
        });
        newJobBuildData[index].totalQuantity +=
          currentJob.build.products.totalQuantity;
        newJobBuildData[index].inputJobs.add(currentJob.jobID);

        currentJob.build.materials.forEach((i) => {
          if (i.childJob.length > 0) {
            let nJbDIndex = newJobBuildData[index].childJobs.findIndex(
              (o) => o.typeID === i.typeID
            );

            if (nJbDIndex !== -1) {
              i.childJob.forEach((M) => {
                newJobBuildData[index].childJobs[nJbDIndex].childJobs.add(M);
              });
            } else {
              newJobBuildData[index].childJobs.push({
                typeID: i.typeID,
                childJobs: new Set(i.childJob),
              });
            }
          }
        });
      } else {
        let childJobs = [];
        currentJob.build.materials.forEach((i) => {
          if (i.childJob.length > 0) {
            childJobs.push({
              typeID: i.typeID,
              childJobs: new Set(i.childJob),
            });
          }
        });
        newJobBuildData.push({
          typeID: currentJob.itemID,
          parentJobs: new Set(currentJob.parentJob),
          childJobs: childJobs,
          totalQuantity: currentJob.build.products.totalQuantity,
          inputJobs: new Set([currentJob.jobID]),
        });
      }

      newJobBuildData.forEach((entry) => {
        if (entry.inputJobs.size > 1) {
          entry.inputJobs.forEach((i) => {
            jobIDsToRemove.add(i);
          });
        }
      });
    }

    for (let outputJob of newJobBuildData) {
      if (outputJob.inputJobs.size > 1) {
        let newJob = await buildJob({
          itemID: outputJob.typeID,
          itemQty: outputJob.totalQuantity,
          parentJobs: [...outputJob.parentJobs],
          childJobs: [...outputJob.childJobs],
        });
        if (newJob === undefined) {
          continue;
        }
        newJobArray.push(newJob);
        newUserJobSnapshot = newJobSnapshot(newJob, newUserJobSnapshot);
        // Updates the buildData with the new merged jobIDs
        for (let updatedOutputJob of newJobBuildData) {
          outputJob.inputJobs.forEach((inputJobID) => {
            if (updatedOutputJob.parentJobs.has(inputJobID)) {
              updatedOutputJob.parentJobs.delete(inputJobID);
              updatedOutputJob.parentJobs.add(newJob.jobID);
            }

            updatedOutputJob.childJobs.forEach((childJobType) => {
              if (childJobType.childJobs.has(inputJobID)) {
                childJobType.childJobs.delete(inputJobID);
                childJobType.childJobs.add(newJob.jobID);
              }
            });
          });
        }

        // Finds Any child jobs of the merged jobs and recalcuates the total.
        for (let cJob of outputJob.childJobs) {
          for (let cJobItem of cJob.childJobs) {
            let pJob = newJobArray.find((i) => i.jobID === cJobItem);
            let newQuantity = newJob.build.materials.find(
              (i) => i.typeID === cJob.typeID
            );

            if (pJob === undefined || newQuantity === undefined) {
              continue;
            }
            pJob.parentJob.push(newJob.jobID);
            recalculateItemQty(pJob, newQuantity.quantity);
            newUserJobSnapshot = updateJobSnapshotActiveJob(
              pJob,
              newUserJobSnapshot
            );
            if (isLoggedIn) {
              await uploadJob(pJob);
            }
          }
        }
        //Adds the new jobID into the parent job.
        for (let pJobID of outputJob.parentJobs) {
          let pJob = newJobArray.find((i) => i.jobID === pJobID);
          if (pJob === undefined) {
            continue;
          }
          let pJobMat = pJob.build.materials.find(
            (i) => i.typeID === newJob.itemID
          );
          if (pJobMat === undefined) {
            continue;
          }
          pJobMat.childJob.push(newJob.jobID);
          newUserJobSnapshot = updateJobSnapshotActiveJob(
            pJob,
            newUserJobSnapshot
          );
          if (isLoggedIn) {
            uploadJob(pJob);
          }
        }

        if (isLoggedIn) {
          await addNewJob(newJob);
        }
      }
    }
    // Delete old Jobs

    for (let IDtoRemove of jobIDsToRemove) {
      let jobToRemove = newJobArray.find((i) => i.jobID === IDtoRemove);
      if (jobToRemove === undefined) {
        newUserJobSnapshot = newUserJobSnapshot.filter(
          (i) => i.jobID !== IDtoRemove
        );
        continue;
      }

      jobToRemove.apiJobs.forEach((jobID) => {
        newLinkedJobIDs.delete(jobID);
        const y = apiJobs.findIndex((u) => u.job_id === jobID);
        if (y !== -1) {
          newApiJobsArary[y].linked = false;
        }
      });

      jobToRemove.build.sale.transactions.forEach((trans) => {
        newLinkedTransIDs.delete(trans.order_id);
      });

      jobToRemove.build.sale.marketOrders.forEach((order) => {
        newLinkedOrderIDs.delete(order.order_id);
      });

      for (let mat of jobToRemove.build.materials) {
        if (mat !== null) {
          for (let job of mat.childJob) {
            let child = newJobArray.find((i) => i.jobID === job);
            if (child === undefined) {
              continue;
            }
            const ParentIDIndex = child.parentJob.findIndex(
              (i) => i === jobToRemove.jobID
            );
            if (ParentIDIndex !== -1) {
              child.parentJob.splice(ParentIDIndex, 1);
            }
          }
        }
      }
      if (jobToRemove.parentJob !== null) {
        for (let parentJobID of jobToRemove.parentJob) {
          let parentJob = newJobArray.find((i) => i.jobID === parentJobID);
          if (parentJob === undefined) {
            continue;
          }
          for (let mat of parentJob.build.materials) {
            if (mat.childJob !== undefined) {
              let index = mat.childJob.findIndex(
                (i) => i === jobToRemove.jobID
              );
              if (index !== -1) {
                mat.childJob.splice(index, 1);
              }
            }
          }
          newUserJobSnapshot = updateJobSnapshotActiveJob(
            parentJob,
            newUserJobSnapshot
          );
        }
      }
      if (isLoggedIn) {
        await removeJob(jobToRemove);
      }
    }

    newUserJobSnapshot = newUserJobSnapshot.filter(
      (i) => !jobIDsToRemove.has(i.jobID)
    );
    newJobArray = newJobArray.filter((i) => !jobIDsToRemove.has(i.jobID));

    if (isLoggedIn) {
      uploadUserJobSnapshot(newUserJobSnapshot);
    }
    updateLinkedJobIDs([...newLinkedJobIDs]);
    updateLinkedOrderIDs([...newLinkedOrderIDs]);
    updateLinkedTransIDs([...newLinkedTransIDs]);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateJobArray(newJobArray);
    updateApiJobs(newApiJobsArary);

    if (jobIDsToRemove.size > 0) {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `${jobIDsToRemove.size} Jobs Merged Successfully`,
        severity: "success",
        autoHideDuration: 3000,
      }));
    } else {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `0 Jobs Merged`,
        severity: "error",
        autoHideDuration: 3000,
      }));
    }

    // await deleteMultipleJobsProcess([...jobIDsToRemove], false);
  };

  const mergeJobsNew2 = async (inputJobIDs) => {
    let buildData = [];
    let newJobHold = [];
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
    buildData = buildData.filter((i) => i.inputJobCount > 1);

    console.log(buildData);
    for (let buildItem of buildData) {
      for (let material of buildItem.childJobs) {
        let replacementJob = newJobHold.find(
          (i) => i.itemID === material.typeID
        );
        if (replacementJob === undefined) {
          continue;
        }
        console.log(material.childJobs)
        material.childJobs.add(replacementJob.jobID);
      }
      
      console.log(buildItem);
      let newJob = await buildJob({
        itemID: buildItem.typeID,
        itemQty: buildItem.totalItemQuantity,
        parentJobs: [...buildItem.parentJobs],
        childJobs: [...buildItem.childJobs],
      });
      buildItem.newJobIDs.add(newJob.jobID);
      newJobHold.push(newJob);
    }

    console.log(newJobHold);

    // for (let buildItem of buildData) {
    //   if (buildItem.inputJobCount < 2) {
    //     continue;
    //   }
    //   buildItem.parentJobs.forEach((parentJobID) => {
    //     let parentJob = newJobArray.find((i) => i.jobID === parentJobID);
    //     if (parentJob === undefined) {
    //       return;
    //     }

    //     let parentMaterial = parentJob.build.materials.find(
    //       (mat) => mat.typeID === buildItem.typeID
    //     );
    //     if (parentMaterial === undefined) {
    //       return;
    //     }
    //     parentMaterial.childJob = parentMaterial.childJob.filter(
    //       (i) => !buildData.oldJobIDs.has(i)
    //     );
    //     parentMaterial.childJob = parentMaterial.childJob.concat([
    //       ...buildItem.newJobIDs,
    //     ]);
    //   });
    //   for (let replacementJob of newJobHold) {
    //     let matchingMaterial = replacementJob.build.materials.find(
    //       (i) => i.typeID === buildItem.typeID
    //     );
    //     if (matchingMaterial === undefined) {
    //       continue;
    //     }
    //     matchingMaterial.childJob = matchingJob.childJob.concat([
    //       ...buildItem.newJobIDs,
    //     ]);
    //   }
    // }
  };

  const calcBrokersFee = async (user, marketOrder) => {
    let brokerFeePercentage = parentUser.settings.editJob.citadelBrokersFee;
    let factionStanding = { standing: 0 };
    let corpStanding = { standing: 0 };

    if (marketOrder.location_id.toString().length < 10) {
      const brokerSkill = JSON.parse(
        sessionStorage.getItem(`esiSkills_${user.CharacterHash}`)
      ).find((i) => i.id === 3446);
      const stationInfo = await stationData(marketOrder.location_id);
      factionStanding = JSON.parse(
        sessionStorage.getItem(`esiStandings_${user.CharacterHash}`)
      ).find((i) => i.from_id === stationInfo.race_id);
      corpStanding = JSON.parse(
        sessionStorage.getItem(`esiStandings_${user.CharacterHash}`)
      ).find((i) => i.from_id === stationInfo.owner);
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
    let now = Date.now();
    let timeLeft = inputTime - now;
    let day = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    let hour = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    let min = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (day < 0) {
      day = 0;
    }
    if (hour < 0) {
      hour = 0;
    }
    if (min < 0) {
      min = 0;
    }

    return { days: day, hours: hour, mins: min };
  };

  return {
    buildItemPriceEntry,
    buildShoppingList,
    calcBrokersFee,
    closeEditJob,
    deleteJobProcess,
    deleteJobSnapshot,
    deleteMultipleJobsProcess,
    findJobData,
    lockUserJob,
    massBuildMaterials,
    mergeJobs,
    mergeJobsNew,
    mergeJobsNew2,
    moveMultipleJobsForward,
    moveMultipleJobsBackward,
    newJobProcess,
    newJobSnapshot,
    openEditJob,
    switchActiveJob,
    timeRemainingCalc,
    replaceSnapshot,
    unlockUserJob,
    updateJobSnapshot,
    updateJobSnapshotActiveJob,
  };
}
