import { useContext, useMemo } from "react";
import {
  SnackBarDataContext,
  DataExchangeContext,
  PageLoadContext,
  LoadingTextContext,
  MultiSelectJobPlannerContext,
  MassBuildDisplayContext,
} from "../Context/LayoutContext";
import { UserJobSnapshotContext, UsersContext } from "../Context/AuthContext";
import {
  ActiveJobContext,
  ApiJobsContext,
  ArchivedJobsContext,
  JobArrayContext,
  JobStatusContext,
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

export function useJobManagement() {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { jobStatus } = useContext(JobStatusContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { evePrices, updateEvePrices } = useContext(EvePricesContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updateArchivedJobs } = useContext(ArchivedJobsContext);
  const { updateMassBuildDisplay } = useContext(MassBuildDisplayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
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
  } = useFirebase();
  const { stationData } = useEveApi();
  const { buildJob, checkAllowBuild } = useJobBuild();
  const t = trace(performance, "CreateJobProcessFull");
  const r = trace(performance, "MassCreateJobProcessFull");

  class newSnapshot {
    constructor(inputJob, childJobs, totalComplete, materialIDs, endDate) {
      this.jobID = inputJob.jobID;
      this.name = inputJob.name;
      this.runCount = inputJob.runCount;
      this.jobCount = inputJob.jobCount;
      this.jobStatus = inputJob.jobStatus;
      this.jobType = inputJob.jobType;
      this.itemID = inputJob.itemID;
      this.isSnapshot = inputJob.isSnapshot;
      this.apiJobs = inputJob.apiJobs;
      this.itemQuantity = inputJob.build.products.totalQuantity;
      this.totalMaterials = inputJob.build.materials.length;
      this.totalComplete = totalComplete;
      this.linkedJobsCount = inputJob.build.costs.linkedJobs.length;
      this.linkedOrdersCount = inputJob.build.sale.marketOrders.length;
      this.linkedTransCount = inputJob.build.sale.transactions.length;
      this.buildVer = inputJob.buildVer;
      this.parentJob = inputJob.parentJob;
      this.childJobs = childJobs;
      this.materialIDs = materialIDs;
      this.metaLevel = inputJob.metaLevel;
      this.projectID = inputJob.projectID || null;
      this.endDateDisplay = endDate;
    }
  }
  class updateSnapshot {
    constructor(inputJob, endDate) {
      this.jobID = inputJob.jobID;
      this.name = inputJob.name;
      this.runCount = inputJob.runCount;
      this.jobCount = inputJob.jobCount;
      this.jobStatus = inputJob.jobStatus;
      this.jobType = inputJob.jobType;
      this.itemID = inputJob.itemID;
      this.isSnapshot = inputJob.isSnapshot || true;
      this.apiJobs = inputJob.apiJobs;
      this.itemQuantity = inputJob.itemQuantity;
      this.totalMaterials = inputJob.totalMaterials;
      this.totalComplete = inputJob.totalComplete;
      this.linkedJobsCount = inputJob.linkedJobsCount;
      this.linkedOrdersCount = inputJob.linkedOrdersCount;
      this.linkedTransCount = inputJob.linkedTransCount;
      this.buildVer = inputJob.buildVer;
      this.parentJob = inputJob.parentJob;
      this.childJobs = inputJob.childJobs;
      this.materialIDs = inputJob.materialIDs;
      this.metaLevel = inputJob.metaLevel;
      this.projectID = inputJob.projectID || null;
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
        updateJobArray((prev) => [...prev, newJob]);
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
    let openJob = null;
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
    }));
    updatePageLoad(true);
    let inputJob = newUserJobSnapshot.find((i) => i.jobID === inputJobID);
    if (inputJob.isSnapshot) {
      openJob = await downloadCharacterJobs(inputJob);
      inputJob.isSnapshot = false;
      newJobArray.push(openJob);

      newUserJobSnapshot = updateJobSnapshotActiveJob(
        openJob,
        newUserJobSnapshot
      );
    } else {
      openJob = jobArray.find((i) => i.jobID === inputJob.jobID);
      if (openJob === undefined) {
        openJob = await downloadCharacterJobs(inputJob);
      }
    }
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
  };

  const closeEditJob = async (inputJob, jobModified) => {
    let newJobArray = [...jobArray];
    const index = newJobArray.findIndex((x) => inputJob.jobID === x.jobID);
    newJobArray[index] = inputJob;
    let newUserJobSnapshot = updateJobSnapshotActiveJob(inputJob, [
      ...userJobSnapshot,
    ]);
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    if (isLoggedIn && jobModified) {
      await updateMainUserDoc();
      await uploadUserJobSnapshot(newUserJobSnapshot);
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
          endDate
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
    let parentIDs = [];
    let childJobs = [];
    let materialPriceIDs = new Set();
    let inputJob = null;
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];
    for (let inputJobID of inputJobIDs) {
      let jobSnapshot = newUserJobSnapshot.find((i) => i.jobID === inputJobID);
      if (jobSnapshot.isSnapshot) {
        inputJob = await downloadCharacterJobs(jobSnapshot);
        console.log(inputJob);
        jobSnapshot.isSnapshot = false;
        if (!newJobArray.some((i) => i.jobID === inputJob.jobID)) {
          newJobArray.push(inputJob);
        }
      } else {
        inputJob = jobArray.find((i) => i.jobID === inputJobID);
      }
      parentIDs.push(inputJob);
      inputJob.build.materials.forEach((material) => {
        materialPriceIDs.add(material.typeID);
        if (
          material.jobType === jobTypes.manufacturing ||
          material.jobType === jobTypes.reaction
        ) {
          if (!finalBuildCount.some((i) => i.typeID === material.typeID)) {
            finalBuildCount.push({
              typeID: material.typeID,
              quantity: material.quantity,
            });
          } else {
            const index = finalBuildCount.findIndex(
              (i) => i.typeID === material.typeID
            );
            if (index !== -1) {
              finalBuildCount[index].quantity += material.quantity;
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
          parentJobs: parentIDs,
        });
        if (newJob !== undefined) {
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
    let newUserArray = [...users];
    let newApiJobsArary = [...apiJobs];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];
    let inputJob = null;

    if (inputJobSnap.isSnapshot) {
      inputJob = await downloadCharacterJobs(inputJobSnap);
      newJobArray.push(inputJob);
    } else {
      inputJob = jobArray.find((i) => i.jobID === inputJobSnap.jobID);
    }

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
      const x = newUserArray[parentUserIndex].linkedJobs.findIndex(
        (i) => i === job
      );
      const y = apiJobs.findIndex((u) => u.job_id === job);
      if (x !== -1 && y !== -1) {
        newUserArray[parentUserIndex].linkedJobs.splice(x, 1);
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
              newUserJobSnapshot = updateJobSnapshot(child, newUserJobSnapshot);
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
          newUserJobSnapshot = updateJobSnapshot(parentJob, newUserJobSnapshot);
          if (isLoggedIn) {
            await uploadJob(parentJob);
          }
        }
      }
    }

    inputJob.build.sale.transactions.forEach((trans) => {
      const tIndex = newUserArray[parentUserIndex].linkedTrans.findIndex(
        (i) => i === trans.order_id
      );
      if (tIndex !== -1) {
        newUserArray[parentUserIndex].linkedTrans.splice(tIndex, 1);
      }
    });

    inputJob.build.sale.marketOrders.forEach((order) => {
      const oIndex = newUserArray[parentUserIndex].linkedOrders.findIndex(
        (i) => i === order.order_id
      );
      if (oIndex !== -1) {
        newUserArray[parentUserIndex].linkedOrders.splice(oIndex, 1);
      }
    });

    let newMutliSelct = multiSelectJobPlanner.filter(
      (i) => i.jobID !== inputJob.jobID
    );

    newUserJobSnapshot = deleteJobSnapshot(inputJob, newUserJobSnapshot);

    updateUsers(newUserArray);
    updateApiJobs(newApiJobsArary);
    updateMultiSelectJobPlanner(newMutliSelct);

    if (isLoggedIn) {
      updateMainUserDoc();
      uploadUserJobSnapshot(newUserJobSnapshot);
      removeJob(inputJob);
    }

    newJobArray = newJobArray.filter((job) => job.jobID !== inputJob.jobID);
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${inputJob.name} Deleted`,
      severity: "error",
      autoHideDuration: 3000,
    }));
  };

  const deleteMultipleJobsProcess = async (inputJobIDs, updateState) => {
    let newUserArray = [...users];
    let newApiJobsArary = [...apiJobs];
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    let inputJob = null;

    for (let inputJobID of inputJobIDs) {
      let jobSnapshot = newUserJobSnapshot.find((i) => i.jobID === inputJobID);
      if (jobSnapshot.isSnapshot) {
        inputJob = await downloadCharacterJobs(jobSnapshot);
      } else {
        inputJob = jobArray.find((i) => i.jobID === inputJobID);
      }

      inputJob.apiJobs.forEach((job) => {
        const x = newUserArray[parentUserIndex].linkedJobs.findIndex(
          (i) => i === job
        );
        const y = apiJobs.findIndex((u) => u.job_id === job);
        if (x !== -1 && y !== -1) {
          newUserArray[parentUserIndex].linkedJobs.splice(x, 1);
          newApiJobsArary[y].linked = false;
        }
      });

      inputJob.build.sale.transactions.forEach((trans) => {
        const tIndex = newUserArray[parentUserIndex].linkedTrans.findIndex(
          (i) => i === trans.order_id
        );
        if (tIndex !== -1) {
          newUserArray[parentUserIndex].linkedTrans.splice(tIndex, 1);
        }
      });

      inputJob.build.sale.marketOrders.forEach((order) => {
        const oIndex = newUserArray[parentUserIndex].linkedOrders.findIndex(
          (i) => i === order.order_id
        );
        if (oIndex !== -1) {
          newUserArray[parentUserIndex].linkedOrders.splice(oIndex, 1);
        }
      });

      const jobIndex = newJobArray.findIndex((j) => j.jobID === inputJob.jobID);
      const jobSnapshotIndex = newUserJobSnapshot.findIndex(
        (i) => i.jobID === inputJob.jobID
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
          if (parentJobSnap.isSnapshot) {
            parentJob = await downloadCharacterJobs(parentJob);
            parentJobSnap.isSnapshot = false;
            newJobArray.push(parentJob);
          } else {
            parentJob = newJobArray.find((i) => i.jobID === parentJobID);
          }

          for (let mat of parentJob.build.materials) {
            if (mat.childJob !== undefined) {
              let index = mat.childJob.findIndex((i) => i === inputJob.jobID);
              if (index !== -1) {
                mat.childJob.splice(index, 1);
              }
            }
          }
          newUserJobSnapshot = updateJobSnapshot(
            parentJobSnap,
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
    if (updateState) {
      if (isLoggedIn) {
        updateMainUserDoc();
        uploadUserJobSnapshot(newUserJobSnapshot);
      }
      updateUsers(newUserArray);
      updateApiJobs(newApiJobsArary);

      updateJobArray(newJobArray);
      updateUserJobSnapshot(newUserJobSnapshot);

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
      if (inputSnap.jobStatus < 4) {
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
      if (inputSnap.jobStatus < 4) {
        let job = newJobArray.find((i) => i.jobID === inputSnap.jobID);
        inputSnap.jobStatus--;
        if (job !== undefined) {
          job.jobStatus--;
        }
        console.log(inputSnap);
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
    }
    if (isLoggedIn) {
      uploadUserJobSnapshot(newUserJobSnapshot);
    }
    updateUserJobSnapshot(newUserJobSnapshot);
    updateJobArray(newJobArray);
  };

  const buildShoppingList = async (inputJobIDs) => {
    let finalShoppingList = [];
    let inputJob = null;
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];

    for (let inputJobID of inputJobIDs) {
      let jobSnapshot = newUserJobSnapshot.find((i) => i.jobID === inputJobID);
      if (jobSnapshot.isSnapshot) {
        inputJob = await downloadCharacterJobs(jobSnapshot);
        jobSnapshot.isSnapshot = false;
        newJobArray.push(inputJob);
      } else {
        inputJob = jobArray.find((i) => i.jobID === inputJobID);
      }
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
      let jobSnapshot = newUserJobSnapshot.find((i) => i.jobID === inputJobID);
      if (jobSnapshot.isSnapshot) {
        inputJob = await downloadCharacterJobs(jobSnapshot);
        jobSnapshot.isSnapshot = false;
        newJobArray.push(inputJob);
      } else {
        inputJob = jobArray.find((i) => i.jobID === inputJobID);
      }
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
    let inputJob = null;

    for (let inputJobID of inputJobIDs) {
      let jobSnapshot = newUserJobSnapshot.find((i) => i.jobID === inputJobID);
      if (jobSnapshot.isSnapshot) {
        inputJob = await downloadCharacterJobs(jobSnapshot);
        jobSnapshot.isSnapshot = false;
      } else {
        inputJob = jobArray.find((i) => i.jobID === inputJobID);
      }

      totalItems += inputJob.build.products.totalQuantity;
      for (let parentJobID of inputJob.parentJob) {
        if (!parentJobs.includes(parentJobID)) {
          let parentMatch = jobArray.find((i) => i.jobID === parentJobID);
          if (parentMatch.isSnapshot) {
            parentMatch = await downloadCharacterJobs(parentMatch);
            parentMatch.isSnapshot = false;
          }

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

    await deleteMultipleJobsProcess(inputJobIDs);

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
      await updateMainUserDoc();
      await uploadJob(newJob);
    }
    updateUserJobSnapshot(newUserJobSnapshot);
  };

  const mergeJobsNew = async (inputJobIDs) => {
    let newJobBuildData = [];
    let jobIDsToRemove = new Set();
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];

    for (let inputJobID of inputJobIDs) {
      let currentJob = null;

      if (!newJobArray.some((i) => i.jobID === inputJobID)) {
        let jobSnapshot = newUserJobSnapshot.find(
          (i) => i.jobID === inputJobID
        );
        currentJob = await downloadCharacterJobs(jobSnapshot);
        jobSnapshot.isSnapshot = false;
      } else {
        currentJob = newJobArray.find((i) => i.jobID === inputJobID);
      }

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
          console.log("next");
          console.log(i);
          console.log(newJobBuildData[index]);
          if (i.childJob.length > 0) {
            let nJbDIndex = newJobBuildData[index].childJobs.findIndex(
              (o) => o.typeID === i.typeID
            );
            console.log(nJbDIndex);
            
            if (nJbDIndex !== -1) {
              console.log(newJobBuildData[index].childJobs[nJbDIndex])
              newJobBuildData[index].childJobs[nJbDIndex].push(i.childJob);
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
    console.log(newJobBuildData);
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
        console.log(outputJob);
        for (let cJob of outputJob.childJobs) {
          let pJob = newJobArray.find((i) => i.jobID === cJob);
          console.log(pJob);
          if (pJob !== undefined) {
            pJob.parentJob.push(newJob.jobID);
          }
          newUserJobSnapshot = updateJobSnapshotActiveJob(
            pJob,
            newUserJobSnapshot
          );
          await uploadJob(pJob);
        }
        if (isLoggedIn) {
          await addNewJob(newJob);
        }
      }
    }

    newUserJobSnapshot = newUserJobSnapshot.filter(
      (i) => !jobIDsToRemove.has(i.jobID)
    );
    newJobArray = newJobArray.filter((i) => !jobIDsToRemove.has(i.jobID));

    updateUserJobSnapshot(newUserJobSnapshot);
    updateJobArray(newJobArray);

    await deleteMultipleJobsProcess([...jobIDsToRemove], false);
  };

  const calcBrokersFee = async (user, marketOrder) => {
    let brokerFeePercentage = parentUser.settings.editJob.citadelBrokersFee;
    let factionStanding = { standing: 0 };
    let corpStanding = { standing: 0 };

    if (marketOrder.location_id.toString().length < 10) {
      const brokerSkill = user.apiSkills.find((i) => i.id === 3446);
      const stationInfo = await stationData(marketOrder.location_id);
      factionStanding = user.standings.find(
        (i) => i.from_id === stationInfo.race_id
      );
      corpStanding = user.standings.find(
        (i) => i.from_id === stationInfo.owner
      );
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

  return {
    buildItemPriceEntry,
    buildShoppingList,
    calcBrokersFee,
    closeEditJob,
    deleteJobProcess,
    deleteJobSnapshot,
    deleteMultipleJobsProcess,
    massBuildMaterials,
    mergeJobs,
    mergeJobsNew,
    moveMultipleJobsForward,
    moveMultipleJobsBackward,
    newJobProcess,
    newJobSnapshot,
    openEditJob,
    replaceSnapshot,
    updateJobSnapshot,
    updateJobSnapshotActiveJob,
  };
}
