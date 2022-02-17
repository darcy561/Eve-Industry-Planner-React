import { useContext } from "react";
import {
  SnackBarDataContext,
  DialogDataContext,
  DataExchangeContext,
  PageLoadContext,
  LoadingTextContext,
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
  const { addNewJob } = useFirebase();
  const { CalculateResources } = useBlueprintCalc();
  const {
    downloadCharacterJobs,
    removeJob,
    updateMainUserDoc,
    uploadJob,
    uploadSnapshotData,
  } = useFirebase();

  const analytics = getAnalytics();
  const parentUser = users.find((i) => i.ParentUser === true);
  const parentUserIndex = users.findIndex((i) => i.ParentUser === true);

  const newJobProcess = async (itemID, itemQty, parentJobs) => {
    const t = trace(performance, "CreateJobProcessFull");
    t.start();

    if (isLoggedIn === false && jobArray.length >= 10) {
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
        calculatedJob.build.buildChar = parentUser.CharacterHash;
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

        if (isLoggedIn) {
          addNewJob(calculatedJob);
        }

        logEvent(analytics, "New Job", {
          loggedIn: isLoggedIn,
          UID: parentUser.accountID,
          name: calculatedJob.name,
          itemID: calculatedJob.itemID,
        });

        updateJobArray((prevArray) => [...prevArray, calculatedJob]);
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
    updateActiveJob(inputJob);
    updatePageLoad(false);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobDataComp: true,
    }));
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: false,
      jobDataComp: false,
    }));
  };

  const closeEditJob = async (inputjob) => {
    const index = jobArray.findIndex((x) => inputjob.jobID === x.jobID);
    const newArray = [...jobArray];
    newArray[index] = inputjob;
    updateJobArray(newArray);
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${inputjob.name} Updated`,
      severity: "info",
      autoHideDuration: 1000,
    }));
  };

  const replaceSnapshot = async (inputJob) => {
    const index = jobArray.findIndex((x) => inputJob.jobID === x.jobID);
    jobArray[index] = inputJob;
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
            finalBuildCount[index].quantity += material.quantity;
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
      await uploadJob(updatedJob);
    }
  };

  const deleteJobProcess = async (inputJob) => {
    logEvent(analytics, "DeleteJob", {
      UID: parentUser.aaccountID,
      jobID: inputJob.jobID,
      name: inputJob.name,
      itemID: inputJob.itemID,
      stage: inputJob.stage,
      loggedIn: isLoggedIn,
    });
    const newUserArray = [...users];
    const newApiJobsArary = [...apiJobs];
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
      newUserArray[parentUserIndex].linkedJobs.splice(x, 1);
      newApiJobsArary[y].linked = false;
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
              await uploadJob(child);
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
          await replaceSnapshot(parentJob)
          await uploadJob(parentJob)
        }
      }
    }

    inputJob.build.sale.transactions.forEach((trans) => {
      const tIndex = newUserArray[parentUserIndex].linkedTrans.findIndex(
        (i) => i === trans.order_id
      );
      newUserArray[parentUserIndex].linkedTrans.splice(tIndex, 1);
    });

    inputJob.build.sale.marketOrders.forEach((order) => {
      const oIndex = newUserArray[parentUserIndex].linkedOrders.findIndex(
        (i) => i === order.order_id
      );
      newUserArray[parentUserIndex].linkedOrders.splice(oIndex, 1);
    });

    updateUsers(newUserArray);
    updateApiJobs(newApiJobsArary);

    if (isLoggedIn) {
      await removeJob(inputJob);
      await updateMainUserDoc();
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
        newUserArray[parentUserIndex].linkedJobs.splice(x, 1);
        newApiJobsArary[y].linked = false;
      });

      inputJob.build.sale.transactions.forEach((trans) => {
        const tIndex = newUserArray[parentUserIndex].linkedTrans.findIndex(
          (i) => i === trans.order_id
        );
        newUserArray[parentUserIndex].linkedTrans.splice(tIndex, 1);
      });

      inputJob.build.sale.marketOrders.forEach((order) => {
        const oIndex = newUserArray[parentUserIndex].linkedOrders.findIndex(
          (i) => i === order.order_id
        );
        newUserArray[parentUserIndex].linkedOrders.splice(oIndex, 1);
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
                await uploadJob(child);
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
            await uploadJob(parentJob);
          }
        }
      }

      newJobArray.splice(jobIndex, 1);
      if (isLoggedIn) {
        removeJob(inputJob);
      }
    }

    if (isLoggedIn) {
      updateMainUserDoc(newUserArray);
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
    const newJobArray = [...jobArray];

    for (let inputJob of inputJobs) {
      if (inputJob.jobStatus < jobStatus.length - 1) {
        const index = newJobArray.findIndex((i) => i.jobID === inputJob.jobID);
        newJobArray[index].jobStatus++;
        if (isLoggedIn) {
          if (!inputJob.isSnapshot) {
            uploadJob(inputJob);
          } else {
            uploadSnapshotData(inputJob);
          }
        }
      }
    }
    updateJobArray(newJobArray);
  };

  const moveMultipleJobsBackward = async (inputJobs) => {
    const newJobArray = [...jobArray];

    for (let inputJob of inputJobs) {
      if (inputJob.jobStatus > 0) {
        const index = newJobArray.findIndex((i) => i.jobID === inputJob.jobID);
        newJobArray[index].jobStatus--;
        if (isLoggedIn) {
          if (!inputJob.isSnapshot) {
            uploadJob(inputJob);
          } else {
            uploadSnapshotData(inputJob);
          }
        }
      }
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
              hasChild: material.childJob.length > 0 ? true : false
            });
          } else {
            const index = finalShoppingList.findIndex(
              (i) => i.typeID === material.typeID
            );
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
              await uploadJob(jobArrayMatch);
              await replaceSnapshot(jobArrayMatch);
            }
          }
        }
      }
    }
    await uploadJob(newJob);
  };

  return {
    closeEditJob,
    deleteJobProcess,
    deleteMultipleJobsProcess,
    massBuildMaterials,
    mergeJobs,
    moveMultipleJobsForward,
    moveMultipleJobsBackward,
    newJobProcess,
    openEditJob,
    buildShoppingList,
  };
}
