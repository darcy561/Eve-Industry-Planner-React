import { useContext } from "react";
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
} from "../../Context/AuthContext";
import { useSystemIndexFunctions } from "../GeneralHooks/useSystemIndexFunctions";
import { useInstallCostsCalc } from "../GeneralHooks/useInstallCostCalc";
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";

export function useOpenEditJob() {
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
  const { findMissingSystemIndex } = useSystemIndexFunctions();
  const { calculateInstallCostFromJob } = useInstallCostsCalc();

  const {
    getArchivedJobData,
    getItemPrices,
    uploadUserJobSnapshot,
    userJobListener,
  } = useFirebase();
  const { findParentUser } = useHelperFunction();
  const checkAppVersion = httpsCallable(
    functions,
    "checkAppVersion-checkAppVersion"
  );

  const parentUser = findParentUser();

  const openEditJob = async (inputJobID) => {
    try {
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
        newJobArray,
        undefined
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
        if (openJob.build.childJobs[mat.typeID].length === 0) {
          continue;
          s;
        }
        for (let cJID of openJob.build.childJobs[mat.typeID]) {
          let childJob = await findJobData(
            cJID,
            newUserJobSnapshot,
            newJobArray
          );
          if (!childJob) {
            continue;
          }

          itemIDs = new Set(itemIDs, generatePriceRequestFromJob(childJob));
        }
      }

      const systemIndexesRequired = Object.values(openJob.build.setup).reduce(
        (prev, setup) => {
          return new Set([...prev, [setup.systemID]]);
        },
        new Set()
      );

      const systemIndexResults = await findMissingSystemIndex([
        ...systemIndexesRequired,
      ]);

      for (let setup of Object.values(openJob.build.setup)) {
        setup.estimatedInstallCost = calculateInstallCostFromJob(
          setup,
          undefined,
          systemIndexResults
        );
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
      const itemPriceResult = await getItemPrices([...itemIDs], parentUser);

      updateEvePrices((prev) => ({
        ...prev,
        ...itemPriceResult,
      }));
      updateJobArray(newJobArray);
      updateUserJobSnapshot(newUserJobSnapshot);
      updateActiveJob(openJob.jobID);
      updateSystemIndexData((prev) => ({ ...prev, ...systemIndexResults }));
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
          for (let childJobID of openJob.build.childJobs[material.typeID]) {
            userJobListener(parentUser, childJobID);
          }
        }
      }
      return openJob;
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  return { openEditJob };
}
