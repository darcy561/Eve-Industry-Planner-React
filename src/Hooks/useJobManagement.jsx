import { useContext } from "react";
import {
  SnackBarDataContext,
  DialogDataContext,
  DataExchangeContext,
  PageLoadContext,
  LoadingTextContext,
  MultiSelectJobPlannerContext,
} from "../Context/LayoutContext";
import { UsersContext } from "../Context/AuthContext";
import {
  ActiveJobContext,
  ApiJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../Context/JobContext";
import { IsLoggedInContext } from "../Context/AuthContext";
import { createJob } from "../Components/Job Planner/JobBuild";
import { useBlueprintCalc } from "./useBlueprintCalc";
import { useFirebase } from "./useFirebase";
import { trace } from "@firebase/performance";
import { performance } from "../firebase";
import { jobTypes } from "../Components/Job Planner";
import { getAnalytics, logEvent } from "firebase/analytics";
import { EvePricesContext } from "../Context/EveDataContext";

export function useJobManagement() {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { jobStatus } = useContext(JobStatusContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { evePrices, updateEvePrices } = useContext(EvePricesContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { CalculateResources } = useBlueprintCalc();
  const {
    addNewJob,
    downloadCharacterJobs,
    getItemPrices,
    removeJob,
    updateMainUserDoc,
    uploadJob,
    uploadJobAsSnapshot,
  } = useFirebase();

  class newSnapshot {
    constructor(inputJob, childJobs, totalComplete, materialIDs) {
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
    }
  }
  class updateSnapshot {
    constructor(inputJob) {
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
    }
  }

  const analytics = getAnalytics();
  const parentUser = users.find((i) => i.ParentUser);
  const parentUserIndex = users.findIndex((i) => i.ParentUser);

  const newJobProcess = async (itemID, itemQty, parentJobs) => {
    const t = trace(performance, "CreateJobProcessFull");
    t.start();

    if (!isLoggedIn && jobArray.length >= 10) {
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "Max-Jobs-Exceeded",
        open: true,
        title: "Job Count Exceeded",
        body:
          "You have exceeded the maximum number of jobs you can create as an unregistered user." +
          "\r\n" +
          "Sign into your Eve Account to create more.Jobs that have been created without registering will be lost upon leaving / refreshing the page.",
      }));
    } else if (isLoggedIn && jobArray.length >= 300) {
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "Max-Jobs-Exceeded",
        open: true,
        title: "Job Count Exceeded",
        body: "You currently cannot create more than 300 individual job cards. Remove existing job cards to add more.",
      }));
    } else {
      updateDataExchange(true);
      const newJob = await createJob(itemID);

      if (newJob === "TypeError") {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "No blueprint found for this item",
          severity: "error",
          autoHideDuration: 2000,
        }));
        updateDataExchange(false);
      } else if (newJob === "objectError") {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "Error building job object, please try again",
          severity: "error",
          autoHideDuration: 2000,
        }));
        updateDataExchange(false);
      } else {
        newJob.build.buildChar = parentUser.CharacterHash;
        if (isLoggedIn) {
          if (newJob.jobType === jobTypes.manufacturing) {
            let blueprintOptions = [];
            users.forEach((user) => {
              let temp = user.apiBlueprints.filter(
                (i) => i.type_id === newJob.blueprintTypeID
              );
              temp.forEach((i) => {
                blueprintOptions.push(i);
              });
            });
            if (blueprintOptions.length > 0) {
              blueprintOptions.sort(
                (a, b) =>
                  b.material_efficiency - a.material_efficiency ||
                  b.time_efficiency - a.time_efficiency
              );
              newJob.bpME = blueprintOptions[0].material_efficiency;
              newJob.bpTE = blueprintOptions[0].time_efficiency / 2;
            }

            const structureData =
              parentUser.settings.structures.manufacturing.find(
                (i) => i.default === true
              );
            if (structureData !== undefined) {
              newJob.rigType = structureData.rigType;
              newJob.systemType = structureData.systemType;
              newJob.structureType = structureData.structureValue;
              newJob.structureTypeDisplay = structureData.structureName;
            }
          }
          if (newJob.jobType === jobTypes.reaction) {
            const structureData = parentUser.settings.structures.reaction.find(
              (i) => i.default === true
            );
            if (structureData !== undefined) {
              newJob.rigType = structureData.rigType;
              newJob.systemType = structureData.systemType;
              newJob.structureType = structureData.structureValue;
              newJob.structureTypeDisplay = structureData.structureName;
            }
          }
        }
        if (itemQty != null) {
          newJob.jobCount = Math.ceil(
            itemQty /
              (newJob.maxProductionLimit * newJob.rawData.products[0].quantity)
          );
          newJob.runCount = Math.ceil(
            itemQty / newJob.rawData.products[0].quantity / newJob.jobCount
          );
        }

        const calculatedJob = CalculateResources(newJob);
        if (parentJobs !== undefined) {
          let itemParents = [];
          parentJobs.forEach((job) => {
            job.build.materials.forEach((mat) => {
              if (mat.typeID === calculatedJob.itemID) {
                itemParents.push(job.jobID);
              }
            });
          });
          calculatedJob.parentJob = itemParents;
        }
        await newJobSnapshot(calculatedJob);

        if (isLoggedIn) {
          await updateMainUserDoc();
          await addNewJob(calculatedJob);
        }

        logEvent(analytics, "New Job", {
          loggedIn: isLoggedIn,
          UID: parentUser.accountID,
          name: calculatedJob.name,
          itemID: calculatedJob.itemID,
        });

        updateJobArray((prev) => [...prev, calculatedJob]);
        updateDataExchange(false);
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: `${calculatedJob.name} Added`,
          severity: "success",
          autoHideDuration: 3000,
        }));
        if (parentJobs !== undefined) {
          return calculatedJob;
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
    let jobPrices = await getItemPrices(inputJob);
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

  const closeEditJob = async (inputJob) => {
    const index = jobArray.findIndex((x) => inputJob.jobID === x.jobID);
    const newArray = [...jobArray];
    newArray[index] = inputJob;
    await updateJobSnapshot(inputJob);
    updateJobArray(newArray);
    if (isLoggedIn) {
      await updateMainUserDoc();
    }
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${inputJob.name} Updated`,
      severity: "info",
      autoHideDuration: 1000,
    }));
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
    if (inputJob !== undefined) {
      const index = parentUser.snapshotData.findIndex(
        (i) => i.jobID === inputJob.jobID
      );
      if (!inputJob.isSnapshot) {
        inputJob.build.materials.forEach((material) => {
          materialIDs.push(material.typeID);
          childJobs.push(...material.childJob);
          if (material.quantityPurchased >= material.quantity) {
            totalComplete++;
          }
        });
        const replacementSnap = Object.assign(
          {},
          new newSnapshot(inputJob, childJobs, totalComplete, materialIDs)
        );
        parentUser.snapshotData[index] = replacementSnap;
      } else {
        const replacementSnap = Object.assign({}, new updateSnapshot(inputJob));
        parentUser.snapshotData[index] = replacementSnap;
      }
    }
  };

  const newJobSnapshot = async (inputJob) => {
    let totalComplete = 0;
    let materialIDs = [];
    let childJobs = [];

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
        new newSnapshot(inputJob, childJobs, totalComplete, materialIDs)
      )
    );
  };

  const massBuildMaterials = async (inputJobs) => {
    let finalBuildCount = [];
    let parentIDs = [];
    let childJobs = [];
    for (let inputJob of inputJobs) {
      if (inputJob.isSnapshot) {
        inputJob = await downloadCharacterJobs(inputJob);
        inputJob.isSnapshot = false;
        replaceSnapshot(inputJob);
      }
      parentIDs.push(inputJob);
      inputJob.build.materials.forEach((material) => {
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
    for (let item of finalBuildCount) {
      let childJob = await newJobProcess(item.typeID, item.quantity, parentIDs);
      childJobs.push(childJob);
      setTimeout(1000);
    }

    for (let inputJob of inputJobs) {
      let updatedJob = jobArray.find((i) => i.jobID === inputJob.jobID);
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
    if (isLoggedIn) {
      await updateMainUserDoc();
    }
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

  return {
    closeEditJob,
    deleteJobProcess,
    deleteJobSnapshot,
    deleteMultipleJobsProcess,
    massBuildMaterials,
    mergeJobs,
    moveMultipleJobsForward,
    moveMultipleJobsBackward,
    newJobProcess,
    newJobSnapshot,
    openEditJob,
    buildShoppingList,
    updateJobSnapshot,
    replaceSnapshot,
  };
}
