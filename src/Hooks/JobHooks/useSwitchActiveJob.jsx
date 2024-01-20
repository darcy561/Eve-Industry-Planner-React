import { useContext, useMemo } from "react";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../Context/AuthContext";
import {
  EvePricesContext,
  SystemIndexContext,
} from "../../Context/EveDataContext";
import {
  ActiveJobContext,
  ArchivedJobsContext,
  JobArrayContext,
} from "../../Context/JobContext";
import {
  LoadingTextContext,
  PageLoadContext,
} from "../../Context/LayoutContext";
import { useFirebase } from "../useFirebase";
import { useJobManagement } from "../useJobManagement";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import { useMissingSystemIndex } from "../GeneralHooks/useImportMissingSystemIndexData";
import { useJobSnapshotManagement } from "./useJobSnapshots";

export function useSwitchActiveJob() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { updateArchivedJobs } = useContext(ArchivedJobsContext);
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { updateSystemIndexData } = useContext(SystemIndexContext);
  const { findMissingSystemIndex } = useMissingSystemIndex();
  const { generatePriceRequestFromJob, generatePriceRequestFromSnapshot } =
    useJobManagement();
  const { newJobSnapshot, updateJobSnapshot } =
    useJobSnapshotManagement();
  const { findJobData } = useFindJobObject();
  const {
    getArchivedJobData,
    getItemPrices,
    uploadJob,
    uploadUserJobSnapshot,
    userJobListener,
  } = useFirebase();
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const switchActiveJob = async (
    existingJob,
    requestedJobID,
    jobModifiedFlag
  ) => {
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    const index = newJobArray.findIndex((x) => existingJob.jobID === x.jobID);
    newJobArray[index] = existingJob;
    console.log(existingJob);
    // newUserJobSnapshot = unlockUserJob(newUserJobSnapshot, existingJob.jobID);
    if (jobModifiedFlag) {
      let parentIDsToRemove = new Set();
      for (let parentID of existingJob.parentJob) {
        let parentJob = await findJobData(
          parentID,
          newUserJobSnapshot,
          newJobArray
        );

        if (!parentJob) continue;

        let parentMaterial = parentJob.build.materials.find(
          (mat) => mat.typeID === existingJob.itemID
        );

        if (!parentMaterial) continue;

        if (parentMaterial.typeID !== existingJob.itemID) {
          parentIDsToRemove.add(parentID);
          continue;
        }

        let childJobSet = new Set(parentJob.build.childJobs[parentMaterial.typeID]);

        if (!childJobSet.has(existingJob.jobID)) {
          childJobSet.add(existingJob.jobID);
          parentJob.build.childJobs[parentMaterial.typeID] = [...childJobSet];
          newUserJobSnapshot = updateJobSnapshot(
            parentJob,
            newUserJobSnapshot
          );
          uploadJob(parentJob);
        }
      }
      if (parentIDsToRemove.size > 0) {
        let replacementParentJobs = new Set(existingJob.parentJob);
        parentIDsToRemove.forEach((id) => {
          replacementParentJobs.delete(id);
        });
        existingJob.parentJob = [...replacementParentJobs];
      }

      for (let material of existingJob.build.materials) {
        let childJobsToRemove = new Set();
        for (let childJobID of existingJob.build.childJobs[material.typeID]) {
          let childJob = await findJobData(
            childJobID,
            newUserJobSnapshot,
            newJobArray
          );
          if (!childJob) continue;

          if (childJob.itemID !== material.typeID) {
            childJobsToRemove.add(childJobID);
            continue;
          }

          let childJobParentSet = new Set(childJob.parentJob);

          if (!childJobParentSet.has(existingJob.jobID)) {
            childJobParentSet.add(existingJob.jobID);
            childJob.parentJob = [...childJobParentSet];
            newUserJobSnapshot = updateJobSnapshot(
              childJob,
              newUserJobSnapshot
            );
            uploadJob(childJob);
          }
        }
        if (childJobsToRemove.size > 0) {
          let replacementChildJobs = new Set(existingJob.build.childJobs[material.typeID]);
          childJobsToRemove.forEach((id) => {
            replacementChildJobs.delete(id);
          });
          existingJob.build.childJobs[material.typeID] = [...replacementChildJobs];
        }
      }
    }

    if (
      existingJob.groupID !== null &&
      existingJob.isReadyToSell &&
      !newUserJobSnapshot.some((i) => i.jobID === existingJob.jobID)
    ) {
      newUserJobSnapshot = newJobSnapshot(existingJob, newUserJobSnapshot);
    }

    if (isLoggedIn && jobModifiedFlag) {
      uploadJob(existingJob);
    }
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
    }));
    updatePageLoad(true);
    let openJob = await findJobData(
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
    let itemIDs = new Set(generatePriceRequestFromJob(openJob));
    for (let mat of openJob.build.materials) {
      if (mat.childJob.length === 0) {
        continue;
      }
      for (let cJ of mat.childJob) {
        let snapshot = await findJobData(
          cJ,
          newUserJobSnapshot,
          newJobArray,
          undefined,
          "snapshot"
        );

        if (snapshot === undefined) {
          continue;
        }
        itemIDs = new Set(itemIDs, generatePriceRequestFromSnapshot(snapshot));
      }
    }
    if (isLoggedIn) {
      let newArchivedJobsArray = await getArchivedJobData(openJob.itemID);
      updateArchivedJobs(newArchivedJobsArray);
      uploadUserJobSnapshot(newUserJobSnapshot);
    }
    await checkSystemIndexData(openJob);
    let jobPrices = await getItemPrices([...itemIDs], parentUser);
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
      userJobListener(parentUser, requestedJobID);
    }
  };

  async function checkSystemIndexData(inputJob) {
    const updatedSystemIndexData = await findMissingSystemIndex(
      inputJob.buildSystem
    );
    if (!updatedSystemIndexData) return;
    updateSystemIndexData(updatedSystemIndexData);
  }

  return { switchActiveJob };
}
