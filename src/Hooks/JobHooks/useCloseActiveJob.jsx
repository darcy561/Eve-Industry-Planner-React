import { useContext } from "react";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { SnackBarDataContext } from "../../Context/LayoutContext";
import { useFirebase } from "../useFirebase";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import { useJobSnapshotManagement } from "./useJobSnapshots";

export function useCloseActiveJob() {
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { uploadJob, uploadUserJobSnapshot } = useFirebase();
  const { newJobSnapshot, updateJobSnapshot } = useJobSnapshotManagement();
  const { findJobData } = useFindJobObject();

  const closeActiveJob = async (inputJob, jobModifiedFlag) => {
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    const index = newJobArray.findIndex((x) => inputJob.jobID === x.jobID);
    newJobArray[index] = inputJob;
    // newUserJobSnapshot = unlockUserJob(newUserJobSnapshot, inputJob.jobID);

    newUserJobSnapshot = updateJobSnapshot(inputJob, newUserJobSnapshot);
    if (jobModifiedFlag) {
      let parentIDsToRemove = new Set();
      for (let parentID of inputJob.parentJob) {
        let parentJob = await findJobData(
          parentID,
          newUserJobSnapshot,
          newJobArray
        );

        if (!parentJob) continue;

        let parentMaterial = parentJob.build.materials.find(
          (mat) => mat.typeID === inputJob.itemID
        );

        if (!parentMaterial) continue;

        if (parentMaterial.typeID !== inputJob.itemID) {
          parentIDsToRemove.add(parentID);
          continue;
        }

        let childJobSet = new Set(
          parentJob.build.childJobs[parentMaterial.typeID]
        );

        if (!childJobSet.has(inputJob.jobID)) {
          childJobSet.add(inputJob.jobID);
          parentJob.build.childJobs[parentMaterial.typeID] = [...childJobSet];
          newUserJobSnapshot = updateJobSnapshot(parentJob, newUserJobSnapshot);
          uploadJob(parentJob);
        }
      }
      if (parentIDsToRemove.size > 0) {
        let replacementParentJobs = new Set(inputJob.parentJob);
        parentIDsToRemove.forEach((id) => {
          replacementParentJobs.delete(id);
        });
        inputJob.parentJob = [...replacementParentJobs];
      }

      for (let material of inputJob.build.materials) {
        let childJobsToRemove = new Set();
        for (let childJobID of inputJob.build.childJobs[material.typeID]) {
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

          if (!childJobParentSet.has(inputJob.jobID)) {
            childJobParentSet.add(inputJob.jobID);
            childJob.parentJob = [...childJobParentSet];
            newUserJobSnapshot = updateJobSnapshot(
              childJob,
              newUserJobSnapshot
            );
            uploadJob(childJob);
          }
        }
        if (childJobsToRemove.size > 0) {
          let replacementChildJobs = new Set(material.childJob);
          childJobsToRemove.forEach((id) => {
            replacementChildJobs.delete(id);
          });
          inputJob.build.childJobs[material.typeID] = [...replacementChildJobs];
        }
      }
    }
    if (
      inputJob.groupID !== null &&
      inputJob.isReadyToSell &&
      !newUserJobSnapshot.some((i) => i.jobID === inputJob.jobID)
    ) {
      newUserJobSnapshot = newJobSnapshot(inputJob, newUserJobSnapshot);
    }
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateActiveJob(null);

    if (isLoggedIn && jobModifiedFlag) {
      await uploadUserJobSnapshot(newUserJobSnapshot);
      await uploadJob(inputJob);
    }

    if (jobModifiedFlag) {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `${inputJob.name} Updated`,
        severity: "info",
        autoHideDuration: 1000,
      }));
    }
  };

  return {
    closeActiveJob,
  };
}
