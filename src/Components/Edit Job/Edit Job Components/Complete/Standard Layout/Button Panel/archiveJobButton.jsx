import { useContext } from "react";
import { Button, Tooltip } from "@mui/material";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../../../../../Context/AuthContext";
import { useFirebase } from "../../../../../../Hooks/useFirebase";
import { useJobSnapshotManagement } from "../../../../../../Hooks/JobHooks/useJobSnapshots";
import { getAnalytics, logEvent } from "firebase/analytics";
import { useNavigate } from "react-router-dom";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function ArchiveJobButton({ activeJob }) {
  const { activeGroup } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { archiveJob, removeJob, uploadUserJobSnapshot, updateMainUserDoc } =
    useFirebase();
  const { deleteJobSnapshot } = useJobSnapshotManagement();
  const { findParentUserIndex, sendSnackbarNotificationSuccess } =
    useHelperFunction();
  const analytics = getAnalytics();
  const navigate = useNavigate();

  const archiveJobProcess = async () => {
    const parentUserIndex = findParentUserIndex();
    let newUserArray = [...users];

    logEvent(analytics, "Archive Job", {
      UID: newUserArray[parentUserIndex].accountID,
      jobID: activeJob.jobID,
      itemID: activeJob.itemID,
    });

    const newJobArray = jobArray.filter((job) => job.jobID !== activeJob.jobID);

    activeJob.apiOrders.forEach((id) => {
      newUserArray[parentUserIndex].linkedOrders.add(id);
    });
    activeJob.apiTransactions.forEach((id) => {
      newUserArray[parentUserIndex].linkedTrans.add(id);
    });
    activeJob.apiJobs.forEach((id) => {
      newUserArray[parentUserIndex].linkedJobs.add(id);
    });

    updateJobArray(newJobArray);
    updateUsers(newUserArray);
    sendSnackbarNotificationSuccess(`${activeJob.name} Archived`);

    let newUserJobSnapshot = deleteJobSnapshot(activeJob, [...userJobSnapshot]);
    await uploadUserJobSnapshot(newUserJobSnapshot);
    await archiveJob(activeJob);
    await removeJob(activeJob);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateMainUserDoc();
    navigate("/jobplanner");
  };

  if (!isLoggedIn || activeGroup) {
    return null;
  }

  return (
    <Tooltip
      arrow
      title="Removes the job from your planner but stores the data for later use in reporting and cost calculations. If you do not wish to store this job data then simply delete the job."
    >
      <Button
        color="primary"
        variant="contained"
        size="small"
        onClick={archiveJobProcess}
        sx={{ margin: "10px" }}
      >
        Archive Job
      </Button>
    </Tooltip>
  );
}
