import { useContext, useMemo } from "react";
import {
  SnackBarDataContext,
  DataExchangeContext,
  PageLoadContext,
  LoadingTextContext,
  MultiSelectJobPlannerContext,
  MassBuildDisplayContext,
} from "../Context/LayoutContext";
import { UsersContext } from "../Context/AuthContext";
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
import { EveIDsContext, EvePricesContext } from "../Context/EveDataContext";
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
  const {
    addNewJob,
    downloadCharacterJobs,
    getArchivedJobData,
    getItemPrices,
    removeJob,
    updateMainUserDoc,
    uploadJob,
    uploadJobAsSnapshot,
  } = useFirebase();
  const { eveIDs } = useContext(EveIDsContext);
  const { IDtoName } = useEveApi();
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
      this.isSnapshot = true;
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
      this.isSnapshot = true;
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

  const newJobProcess = async (itemID, itemQty, parentJobs) => {
    t.start();
    if (checkAllowBuild()) {
      updateDataExchange(true);
      const newJob = await buildJob(itemID, itemQty, parentJobs);
      if (newJob !== undefined) {
        let priceIDRequest = new Set();
        let promiseArray = [];
        priceIDRequest.add(newJob.itemID);
        newJob.build.materials.forEach((mat) => {
          priceIDRequest.add(mat.typeID);
        });
        let itemPrices = getItemPrices([...priceIDRequest], parentUser);
        promiseArray.push(itemPrices);

        await newJobSnapshot(newJob);

        if (isLoggedIn) {
          await updateMainUserDoc();
          await addNewJob(newJob);
        }

        logEvent(analytics, "New Job", {
          loggedIn: isLoggedIn,
          UID: parentUser.accountID,
          name: newJob.name,
          itemID: newJob.itemID,
        });
        let returnPromiseArray = await Promise.all(promiseArray);

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
        if (parentJobs !== undefined) {
          return newJob;
        }
      }
      t.stop();
    }
  };

  const openEditJob = async (inputJob) => {
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
    }));
    updatePageLoad(true);
    if (inputJob.isSnapshot) {
      inputJob = await downloadCharacterJobs(inputJob);
      inputJob.isSnapshot = false;
      const index = jobArray.findIndex((x) => inputJob.jobID === x.jobID);
      const newArray = [...jobArray];
      newArray[index] = inputJob;
      updateJobArray(newArray);
    }
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
      jobDataComp: true,
      priceData: true,
    }));
    let itemIDs = new Set();
    itemIDs.add(inputJob.itemID);
    inputJob.build.materials.forEach((mat) => {
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
      let newArchivedJobsArray = await getArchivedJobData(inputJob.itemID);
      updateArchivedJobs(newArchivedJobsArray);
    }

    let jobPrices = await getItemPrices([...itemIDs], parentUser);
    if (jobPrices.length > 0) {
      updateEvePrices(evePrices.concat(jobPrices));
    }
    updateActiveJob(inputJob);
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
    const index = jobArray.findIndex((x) => inputJob.jobID === x.jobID);
    const newArray = [...jobArray];
    newArray[index] = inputJob;
    await updateJobSnapshot(inputJob);
    updateJobArray(newArray);
    if (isLoggedIn && jobModified) {
      await updateMainUserDoc();
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

  const deleteJobSnapshot = async (inputJob) => {
    parentUser.snapshotData = parentUser.snapshotData.filter(
      (i) => i.jobID !== inputJob.jobID
    );
  };

  const updateJobSnapshot = async (inputJob) => {
    let totalComplete = 0;
    let materialIDs = [];
    let childJobs = [];
    let endDate = null;

    if (inputJob === undefined) {
      return null;
    }
    const index = parentUser.snapshotData.findIndex(
      (i) => i.jobID === inputJob.jobID
    );
    if (!inputJob.isSnapshot) {
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

      const replacementSnap = Object.assign(
        {},
        new newSnapshot(
          inputJob,
          childJobs,
          totalComplete,
          materialIDs,
          endDate
        )
      );
      parentUser.snapshotData[index] = replacementSnap;
    } else {
      const replacementSnap = Object.assign(
        {},
        new updateSnapshot(inputJob, endDate)
      );
      parentUser.snapshotData[index] = replacementSnap;
    }
  };

  const newJobSnapshot = async (inputJob) => {
    let totalComplete = 0;
    let materialIDs = [];
    let childJobs = [];
    let endDate = null;

    inputJob.build.materials.forEach((material) => {
      materialIDs.push(material.typeID);
      childJobs.push(...material.childJob);
      if (material.quantityPurchased >= material.quantity) {
        totalComplete++;
      }
    });

    parentUser.snapshotData.push(
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
  };

  const massBuildMaterials = async (inputJobs) => {
    r.start();
    let finalBuildCount = [];
    let parentIDs = [];
    let childJobs = [];
    let materialPriceIDs = new Set();

    for (let inputJob of inputJobs) {
      if (inputJob.isSnapshot) {
        inputJob = await downloadCharacterJobs(inputJob);
        inputJob.isSnapshot = false;
        replaceSnapshot(inputJob);
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
    let newJobArray = [...jobArray];
    updateMassBuildDisplay((prev) => ({
      ...prev,
      open: true,
      currentJob: 0,
      totalJob: finalBuildCount.length,
    }));

    for (let item of finalBuildCount) {
      if (checkAllowBuild()) {
        const newJob = await buildJob(item.typeID, item.quantity, parentIDs);
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

    for (let inputJob of inputJobs) {
      let updatedJob = newJobArray.find((i) => i.jobID === inputJob.jobID);
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
      await updateJobSnapshot(updatedJob);
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
      await newJobSnapshot(childJob);

      if (isLoggedIn) {
        await addNewJob(childJob);
      }
      newJobArray.push(childJob);
    }

    if (isLoggedIn) {
      await updateMainUserDoc();
    }
    updateMassBuildDisplay((prev) => ({
      ...prev,
      totalPrice: [...materialPriceIDs].length,
    }));
    let itemPrices = await getItemPrices([...materialPriceIDs], parentUser);
    updateEvePrices((prev) => prev.concat(itemPrices));
    updateJobArray(newJobArray);
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

  const deleteJobProcess = async (inputJob) => {
    logEvent(analytics, "DeleteJob", {
      UID: parentUser.accountID,
      jobID: inputJob.jobID,
      name: inputJob.name,
      itemID: inputJob.itemID,
      stage: inputJob.stage,
      loggedIn: isLoggedIn,
    });
    let newUserArray = [...users];
    let newApiJobsArary = [...apiJobs];

    if (inputJob.isSnapshot) {
      inputJob = await downloadCharacterJobs(inputJob);
      inputJob.isSnapshot = false;
      replaceSnapshot(inputJob);
    }

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
              await updateJobSnapshot(child);
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
          await updateJobSnapshot(parentJob);
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

    deleteJobSnapshot(inputJob);

    updateUsers(newUserArray);
    updateApiJobs(newApiJobsArary);
    updateMultiSelectJobPlanner(newMutliSelct);

    if (isLoggedIn) {
      await updateMainUserDoc();
      await removeJob(inputJob);
    }

    const newJobArray = jobArray.filter((job) => job.jobID !== inputJob.jobID);
    updateJobArray(newJobArray);

    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${inputJob.name} Deleted`,
      severity: "error",
      autoHideDuration: 3000,
    }));
  };

  const deleteMultipleJobsProcess = async (inputJobs) => {
    const newUserArray = [...users];
    const newApiJobsArary = [...apiJobs];
    const newJobArray = [...jobArray];

    for (let inputJob of inputJobs) {
      if (inputJob.isSnapshot) {
        inputJob = await downloadCharacterJobs(inputJob);
        inputJob.isSnapshot = false;
        replaceSnapshot(inputJob);
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
            if (isLoggedIn) {
              await uploadJob(parentJob);
            }
          }
        }
      }
      if (jobIndex !== -1) {
        newJobArray.splice(jobIndex, 1);
      }
      await deleteJobSnapshot(inputJob);
      if (isLoggedIn) {
        await removeJob(inputJob);
      }
    }
    if (isLoggedIn) {
      updateMainUserDoc();
    }
    updateUsers(newUserArray);
    updateApiJobs(newApiJobsArary);
    updateJobArray(newJobArray);

    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${inputJobs.length} Job/Jobs Deleted`,
      severity: "error",
      autoHideDuration: 3000,
    }));
  };

  const moveMultipleJobsForward = async (inputJobs) => {
    let newJobArray = [...jobArray];
    for (let inputJob of inputJobs) {
      if (inputJob.jobStatus < jobStatus.length - 1) {
        const jaIndex = newJobArray.findIndex(
          (i) => i.jobID === inputJob.jobID
        );
        inputJob.jobStatus++;
        newJobArray[jaIndex] = inputJob;

        if (isLoggedIn) {
          await updateJobSnapshot(inputJob);
          if (inputJob.isSnapshot) {
            await uploadJobAsSnapshot(inputJob);
          } else {
            await uploadJob(inputJob);
          }
        }
      }
    }
    if (isLoggedIn) {
      await updateMainUserDoc();
    }

    updateJobArray(newJobArray);
  };

  const moveMultipleJobsBackward = async (inputJobs) => {
    let newJobArray = [...jobArray];
    for (let inputJob of inputJobs) {
      if (inputJob.jobStatus > 0) {
        const jaIndex = newJobArray.findIndex(
          (i) => i.jobID === inputJob.jobID
        );
        inputJob.jobStatus--;
        newJobArray[jaIndex] = inputJob;

        if (isLoggedIn) {
          await updateJobSnapshot(inputJob);
          if (inputJob.isSnapshot) {
            await uploadJobAsSnapshot(inputJob);
          } else {
            await uploadJob(inputJob);
          }
        }
      }
    }
    if (isLoggedIn) {
      await updateMainUserDoc();
    }
    updateJobArray(newJobArray);
  };

  const buildShoppingList = async (inputJobs) => {
    let finalShoppingList = [];
    for (let inputJob of inputJobs) {
      if (inputJob.isSnapshot) {
        inputJob = await downloadCharacterJobs(inputJob);
        inputJob.isSnapshot = false;
      }
      inputJob.build.materials.forEach((material) => {
        if (material.quantityPurchased < material.quantity) {
          if (!finalShoppingList.find((i) => i.typeID === material.typeID)) {
            finalShoppingList.push({
              name: material.name,
              typeID: material.typeID,
              quantity: material.quantity - material.quantityPurchased,
              volume: material.volume,
              hasChild: material.childJob.length > 0 ? true : false,
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
    return finalShoppingList;
  };

  const buildItemPriceEntry = async (inputJobs) => {
    let finalPriceEntry = [];
    for (let inputJob of inputJobs) {
      if (inputJob.isSnapshot) {
        inputJob = await downloadCharacterJobs(inputJob);
        inputJob.isSnapshot = false;
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
    return finalPriceEntry;
  };

  const mergeJobs = async (inputJobs) => {
    let totalItems = 0;
    let parentJobs = [];
    let childJobs = [];
    for (let inputJob of inputJobs) {
      if (inputJob.isSnapshot) {
        inputJob = await downloadCharacterJobs(inputJob);
        inputJob.isSnapshot = false;
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
      replaceSnapshot(inputJob);
    }
    await deleteMultipleJobsProcess(inputJobs);
    let newJob = await newJobProcess(
      inputJobs[0].itemID,
      totalItems,
      parentJobs
    );
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
              await updateJobSnapshot(jobArrayMatch);
            }
          }
        }
      }
    }
    if (isLoggedIn) {
      await updateMainUserDoc();
      await uploadJob(newJob);
    }
  };

  const retrieveAssetLocation = (initialAsset, userAssets) => {
    let parentAsset = userAssets.find(
      (i) => i.item_id === initialAsset.location_id
    );
    if (
      parentAsset.location_type === "item" ||
      parentAsset.location_type === "other"
    ) {
      retrieveAssetLocation(parentAsset, userAssets);
    }
    if (
      parentAsset.location_type === "station" ||
      parentAsset.location_type === "solar_system"
    ) {
      return parentAsset;
    }
    if (parentAsset === undefined) {
      return initialAsset;
    }
  };

  const findItemAssets = async (requestedItemID) => {
    let filteredAssetList = [];
    let newEveIDs = [...eveIDs];
    let missingStationIDs = new Set();
    let itemLocations = []
    for (let user of users) {
      let missingCitadelIDs = new Set();
      let userAssets = JSON.parse(
        sessionStorage.getItem(`assets_${user.CharacterHash}`)
      );
      let filteredUserAssetList = userAssets.filter(
        (entry) => entry.type_id === requestedItemID
      );
      for (let item of filteredUserAssetList) {
        if (!eveIDs.some((i) => item.type_id === i.type_id)) {
          if (
            item.location_type === "station" ||
            item.location_type === "solar_system"
          ) {
            if (item.location_id.toString().length > 10) {
              missingCitadelIDs.add(item.location_id);
            } else {
              missingStationIDs.add(item.location_id);
            }
            if (itemLocations.some((i) => item.location_id === i.location_id)){
              let index = itemLocations.findIndex((i) => i.location_id === item.location_id)
              if (index !== -1) {
                itemLocations[index].itemIDs.push(item.item_id)
              }
            } else {
              itemLocations.push({location_id: item.location_id, itemIDs:[item.item_id]})
            }
          }
          if (item.location_type === "item" || item.location_type === "other") {
            let parentLocation = retrieveAssetLocation(item, userAssets);
            if (parentLocation.location_id.toString().length > 10) {
              missingCitadelIDs.add(parentLocation.location_id);
            } else {
              missingStationIDs.add(parentLocation.location_id);
            }
            if (itemLocations.some((i) => parentLocation.location_id === i.location_id)){
              let index = itemLocations.findIndex((i) => i.location_id === parentLocation.location_id)
              if (index !== -1) {
                itemLocations[index].itemIDs.push(item.item_id)
              }
            } else {
              itemLocations.push({location_id: parentLocation.location_id, itemIDs:[item.item_id]})
            }
          }
        }
        if ([...missingCitadelIDs].length > 0) {
          let tempCit = await IDtoName([...missingCitadelIDs], user);
          newEveIDs = newEveIDs.concat(tempCit);
        }
      }
      filteredAssetList = filteredAssetList.concat(filteredUserAssetList);
    }

    if ([...missingStationIDs].length > 0) {
      let tempStation = await IDtoName([...missingStationIDs], users[0]);
      newEveIDs = newEveIDs.concat(tempStation);
    }
    return [filteredAssetList, newEveIDs, itemLocations];
  };

  return {
    buildItemPriceEntry,
    buildShoppingList,
    closeEditJob,
    deleteJobProcess,
    deleteJobSnapshot,
    deleteMultipleJobsProcess,
    findItemAssets,
    massBuildMaterials,
    mergeJobs,
    moveMultipleJobsForward,
    moveMultipleJobsBackward,
    newJobProcess,
    newJobSnapshot,
    openEditJob,
    replaceSnapshot,
    retrieveAssetLocation,
    updateJobSnapshot,
  };
}
