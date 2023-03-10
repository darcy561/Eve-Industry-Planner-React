import { useContext } from "react";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { SnackBarDataContext } from "../../Context/LayoutContext";
import { useFirebase } from "../useFirebase";
import { useJobManagement } from "../useJobManagement";

export function useCloseActiveJob() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { uploadJob, uploadUserJobSnapshot } = useFirebase();
  const { newJobSnapshot, updateJobSnapshotFromFullJob } = useJobManagement();

  const closeActiveJob = async (inputJob, jobModifiedFlag) => {
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    const index = newJobArray.findIndex((x) => inputJob.jobID === x.jobID);
    newJobArray[index] = inputJob;
    // newUserJobSnapshot = unlockUserJob(newUserJobSnapshot, inputJob.jobID);

    newUserJobSnapshot = updateJobSnapshotFromFullJob(
      inputJob,
      newUserJobSnapshot
    );

    if (
      inputJob.groupID !== null &&
      inputJob.isReadyToSell &&
      !newUserJobSnapshot.some((i) => i.jobID === inputJob.jobID)
    ) {
      newUserJobSnapshot = newJobSnapshot(inputJob, newUserJobSnapshot);
    }

    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateActiveJob({});

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
