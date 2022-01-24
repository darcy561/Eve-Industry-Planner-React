import { useContext } from "react";
import {
  SnackBarDataContext,
  DialogDataContext,
  DataExchangeContext,
} from "../Context/LayoutContext";
import { UsersContext } from "../Context/AuthContext";
import {
  ApiJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../Context/JobContext";
import { IsLoggedInContext } from "../Context/AuthContext";
import { createJob } from "../Components/Job Planner/JobBuild";
import { useBlueprintCalc } from "./useBlueprintCalc";
import { useFirebase } from "./useFirebase";
import { jobTypes } from "../Components/Job Planner";
import { trace } from "@firebase/performance";
import { performance } from "../firebase";
import { getAnalytics, logEvent } from "firebase/analytics";

export function useJobManagement() {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
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

  const newJobProcess = async (itemID, itemQty) => {
    const t = trace(performance, "CreateJobProcessFull");
    t.start();

    if (isLoggedIn === false && jobArray.length >= 8) {
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "Max-Jobs-Exceeded",
        open: true,
        title: "Job Count Exceeded",
        body: `You have exceeded the maximum number of jobs you can create as an unregistered user. Sign into your Eve Account to create more. Jobs that have been created without registering will be lost upon leaving/refreshing the page.`,
      }));
      t.putAttribute("JobArraySizeFull", "Not Logged In");
      t.incrementMetric("Max Jobs Reached - Not Logged In", 1);
    } else if (isLoggedIn && jobArray.length >= 100) {
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "Max-Jobs-Exceeded",
        open: true,
        title: "Job Count Exceeded",
        body: "You currently cannot create more than 100 individual job cards. Remove existing job cards to add more.",
      }));
      t.putAttribute("JobArraySizeFull", "Logged In");
      t.incrementMetric("Max Jobs Reached - Logged In", 1);
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
        t.putAttribute("FailedJobCreation", "No BP Found");
        t.incrementMetric("No Bp Found", 1);
        t.incrementMetric("Items with no BP", 1);
      } else if (newJob === "objectError") {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "Error building job object, please try again",
          severity: "error",
          autoHideDuration: 2000,
        }));
        updateDataExchange(false);
        t.putAttribute("FailedJobCreation", "Error Building Job");
        t.incrementMetric("Error building Job", 1);
      } else if (newJob.jobType === 3) {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "Unable to add Planetary Interation materials at this time",
          severity: "error",
          autoHideDuration: 3000,
        }));
        updateDataExchange(false);
        t.putAttribute("FailedJobCreation", "Added PI Job");
        t.incrementMetric("Unable to Add PI Job", 1);
      } else {
        t.putAttribute("CompleteJobCreation", "Basic Item");
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

        if (isLoggedIn) {
          isLoggedIn && addNewJob(calculatedJob);
          calculatedJob.build.buildChar = parentUser.CharacterHash;
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
        t.removeAttribute("CompleteJobCreation");
        t.putAttribute("CompleteJobCreation", "Calculated Item");
      }
      t.incrementMetric("Complete", 1);
      t.stop();
    }
  };

  const massBuildMaterials = async (inputJobs) => {
    let finalBuildCount = [];
    for (let inputJob of inputJobs) {
      if (inputJob.isSnapshot) {
        inputJob = await downloadCharacterJobs(inputJob);
        inputJob.isSnapshot = false;
      }
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
      await newJobProcess(item.typeID, item.quantity);
      setTimeout(1000);
    }
  };

  const deleteJobProcess = async (inputJob) => {
    const newUserArray = [...users];
    const newApiJobsArary = [...apiJobs];
    if (inputJob.isSnapshot) {
      inputJob = await downloadCharacterJobs(inputJob);
      inputJob.isSnapshot = false;
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

    updateUsers(newUserArray);
    updateApiJobs(newApiJobsArary);

    if (isLoggedIn) {
      removeJob(inputJob);
      updateMainUserDoc();
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

      newJobArray.splice(jobIndex, 1);
      if (isLoggedIn) {
        removeJob(inputJob);
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
        if (!finalShoppingList.find((i) => i.typeID === material.typeID)) {
          finalShoppingList.push({
            name: material.name,
            typeID: material.typeID,
            quantity: material.quantity,
            volume: material.volume,
          });
        } else {
          const index = finalShoppingList.findIndex(
            (i) => i.typeID === material.typeID
          );
          finalShoppingList[index].quantity += material.quantity;
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

  return {
    deleteJobProcess,
    deleteMultipleJobsProcess,
    massBuildMaterials,
    moveMultipleJobsForward,
    moveMultipleJobsBackward,
    newJobProcess,
    buildShoppingList,
  };
}
