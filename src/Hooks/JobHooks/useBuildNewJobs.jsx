import { useContext } from "react";
import { trace } from "firebase/performance";
import { analytics, performance } from "../../firebase";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import { JobArrayContext } from "../../Context/JobContext";
import { DataExchangeContext } from "../../Context/LayoutContext";
import { useJobBuild } from "../useJobBuild";
import { useJobManagement } from "../useJobManagement";
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";
import { useJobSnapshotManagement } from "./useJobSnapshots";
import { useFirebase } from "../useFirebase";
import { EvePricesContext } from "../../Context/EveDataContext";
import { logEvent } from "firebase/analytics";

function useBuildNewJobs() {
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { jobArray, groupArray, updateJobArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { buildJob } = useJobBuild();
  const { addNewJob, uploadGroups, getItemPrices, userJobListener } =
    useFirebase();
  const { generatePriceRequestFromJob } = useJobManagement();
  const { newJobSnapshot } = useJobSnapshotManagement();
  const { findParentUser, sendSnackbarNotificationSuccess } =
    useHelperFunction();
  const parentUser = findParentUser();

  async function addNewJobsToPlanner(buildRequests) {
    const firestoreTrace = trace(performance, "CreateJobProcessFull");
    let newUserJobSnapshot = [...userJobSnapshot];
    let newGroupArray = [...groupArray];
    let newJobArray = [...jobArray];
    let priceRequestSet = new Set();
    let singleJobBuildFlag = false;
    let requiresGroupDocSave = false;

    firestoreTrace.start();
    updateDataExchange(true);

    let newJobObjects = await buildJob(buildRequests);

    if (!newJobObjects) return;

    if (!Array.isArray(newJobObjects)) {
      newJobObjects = [newJobObjects];
      singleJobBuildFlag = true;
    }

    for (let jobObject of newJobObjects) {
      priceRequestSet = new Set([
        ...priceRequestSet,
        ...generatePriceRequestFromJob(jobObject),
      ]);
    }
    const itemPriceRequest = [getItemPrices([...priceRequestSet], parentUser)];

    for (let jobObject of newJobObjects) {
      newJobArray.push(jobObject);

      if (!jobObject.groupID) {
        newUserJobSnapshot = newJobSnapshot(jobObject, newUserJobSnapshot);
        requiresGroupDocSave = true;
      }

      if (jobObject.groupID) {
        const matchedGroup = newGroupArray.find(
          (i) => i.groupID === jobObject.groupID
        );
        matchedGroup.addJobsToGroup(jobObject);
      }

      if (isLoggedIn) {
        await addNewJob(jobObject);

        userJobListener(parentUser, jobObject.jobID);
      }
      logEvent(analytics, "New Job", {
        loggedIn: isLoggedIn,
        UID: parentUser.accountID,
        name: jobObject.name,
        itemID: jobObject.itemID,
      });
    }
    const itemPriceResult = await Promise.all(itemPriceRequest);

    if (requiresGroupDocSave) {
      updateGroupArray(newGroupArray);
      if (isLoggedIn) {
        uploadGroups(newGroupArray);
      }
    }
    updateUserJobSnapshot(newUserJobSnapshot);

    updateJobArray(newJobArray);
    updateEvePrices((prev) => ({
      ...prev,
      ...itemPriceResult,
    }));
    updateDataExchange(false);

    sendSnackbarNotificationSuccess(
      singleJobBuildFlag
        ? `${newJobObjects[0].name} Added`
        : `${newJobObjects.length} jobs added.`,
      3
    );
    firestoreTrace.stop();
    if (singleJobBuildFlag && newJobObjects[0].parentJob.length > 0) {
      return newJobObjects[0];
    }
  }
  return {
    addNewJobsToPlanner,
  };
}

export default useBuildNewJobs;
