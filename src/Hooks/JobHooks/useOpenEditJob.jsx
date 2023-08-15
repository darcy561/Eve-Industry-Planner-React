import { useContext, useMemo } from "react";
import { functions } from "../../firebase";
import {
  DialogDataContext,
  LoadingTextContext,
  PageLoadContext,
} from "../../Context/LayoutContext";
import { httpsCallable } from "firebase/functions";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import { useJobManagement } from "../useJobManagement";
import { useFirebase } from "../useFirebase";
import {
  ActiveJobContext,
  ArchivedJobsContext,
  JobArrayContext,
} from "../../Context/JobContext";
import {
  EvePricesContext,
  SystemIndexContext,
} from "../../Context/EveDataContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../Context/AuthContext";
import { useMissingSystemIndex } from "../GeneralHooks/useImportMissingSystemIndexData";

export function useOpenEditJob() {
  const { users } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateArchivedJobs } = useContext(ArchivedJobsContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { updateSystemIndexData } = useContext(SystemIndexContext);
  const { generatePriceRequestFromJob } = useJobManagement();
  const { findJobData } = useFindJobObject();
  const { findMissingSystemIndex } = useMissingSystemIndex();

  const {
    getArchivedJobData,
    getItemPrices,
    uploadUserJobSnapshot,
    userJobListener,
  } = useFirebase();
  const checkAppVersion = httpsCallable(
    functions,
    "checkAppVersion-checkAppVersion"
  );

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const openEditJob = async (inputJobID) => {
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
    }));
    updatePageLoad(true);
    let verify = [checkAppVersion({ appVersion: __APP_VERSION__ })];

    let openJob = await findJobData(
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
    for (let parentID of openJob.parentJob) {
      let parentJob = await findJobData(
        parentID,
        newUserJobSnapshot,
        newJobArray
      );
      if (!parentJob) continue;
      itemIDs = new Set(itemIDs, generatePriceRequestFromJob(parentJob));
    }
    for (let mat of openJob.build.materials) {
      if (mat.childJob.length === 0) {
        continue;
        s;
      }
      for (let cJID of mat.childJob) {
        let childJob = await findJobData(cJID, newUserJobSnapshot, newJobArray);
        if (!childJob) {
          continue;
        }

        itemIDs = new Set(itemIDs, generatePriceRequestFromJob(childJob));
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
    await checkSystemIndexData(openJob);
    if (jobPrices.length > 0) {
      updateEvePrices((prev) => {
        const prevIds = new Set(prev.map((item) => item.typeID));
        const uniqueNewEvePrices = jobPrices.filter(
          (item) => !prevIds.has(item.typeID)
        );
        return [...prev, ...uniqueNewEvePrices];
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
      for (let parentID of openJob.parentJob) {
        userJobListener(parentUser, parentID);
      }
      for (let material of openJob.build.materials) {
        for (let childJobID of material.childJob) {
          userJobListener(parentUser, childJobID);
        }
      }
    }
  };

  async function checkSystemIndexData(inputJob) {
    const updatedSystemIndexData = await findMissingSystemIndex(
      inputJob.buildSystem
    );
    if (!updatedSystemIndexData) return;
    updateSystemIndexData(updatedSystemIndexData);
  }
  return { openEditJob };
}
