import { useContext } from "react";
import {
  DialogDataContext,
  LoadingTextContext,
  PageLoadContext,
} from "../../Context/LayoutContext";
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
import { IsLoggedInContext } from "../../Context/AuthContext";
import { useSystemIndexFunctions } from "../GeneralHooks/useSystemIndexFunctions";
import { useInstallCostsCalc } from "../GeneralHooks/useInstallCostCalc";
import useCheckGlobalAppVersion from "../GeneralHooks/useCheckGlobalAppVersion";
import findOrGetJobObject from "../../Functions/Helper/findJobObject";

export function useOpenEditJob() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateArchivedJobs } = useContext(ArchivedJobsContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { updateSystemIndexData } = useContext(SystemIndexContext);
  const { generatePriceRequestFromJob } = useJobManagement();
  const { findMissingSystemIndex } = useSystemIndexFunctions();
  const { calculateInstallCostFromJob } = useInstallCostsCalc();

  const { getArchivedJobData, getItemPrices } = useFirebase();

  async function openEditJob(inputJobID) {
    try {
      const retrievedJobs = [];
      updateLoadingText((prevObj) => ({
        ...prevObj,
        jobData: true,
      }));
      updatePageLoad(true);
      let openJob = await findOrGetJobObject(
        inputJobID,
        jobArray,
        retrievedJobs
      );

      if (!openJob) return undefined;

      updateLoadingText((prevObj) => ({
        ...prevObj,
        jobData: true,
        jobDataComp: true,
        priceData: true,
      }));
      let itemIDs = new Set(generatePriceRequestFromJob(openJob));
      for (let parentID of openJob.parentJob) {
        let parentJob = await findOrGetJobObject(
          parentID,
          jobArray,
          retrievedJobs
        );
        if (!parentJob) continue;
        itemIDs = new Set(itemIDs, generatePriceRequestFromJob(parentJob));
      }
      for (let mat of openJob.build.materials) {
        if (openJob.build.childJobs[mat.typeID].length === 0) {
          continue;
        }
        for (let cJID of openJob.build.childJobs[mat.typeID]) {
          let childJob = await findOrGetJobObject(
            cJID,
            jobArray,
            retrievedJobs
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
      }

      if (!useCheckGlobalAppVersion()) {
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
      const itemPriceResult = await getItemPrices([...itemIDs]);

      manageListenerRequests(
        retrievedJobs,
        updateJobArray,
        updateFirebaseListeners,
        firebaseListeners,
        isLoggedIn
      );

      updateEvePrices((prev) => ({
        ...prev,
        ...itemPriceResult,
      }));
      updateJobArray((prev) => {
        const existingIDs = new Set(prev.map(({ jobID }) => jobID));
        return [
          ...prev,
          ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
        ];
      });

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
      return openJob;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  return { openEditJob };
}
