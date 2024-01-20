import { useContext } from "react";
import { Button, Tooltip } from "@mui/material";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../../Context/LayoutContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../../../../../Context/AuthContext";
import { useFirebase } from "../../../../../../Hooks/useFirebase";
import { useJobSnapshotManagement } from "../../../../../../Hooks/JobHooks/useJobSnapshots";
import { getAnalytics } from "firebase/analytics";

<<<<<<< HEAD:src/Components/Job Planner/Edit Job/Edit Job Components/Page 5 Components/archiveJobButton.jsx
export function ArchiveJobButton({ updateEditJobTrigger }) {
  const { activeJob, activeGroup } = useContext(ActiveJobContext);
=======
export function ArchiveJobButton({ activeJob }) {
  const { activeGroup } = useContext(ActiveJobContext);
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569:src/Components/Edit Job/Edit Job Components/Complete/Standard Layout/Button Panel/archiveJobButton.jsx
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { archiveJob, removeJob, uploadUserJobSnapshot, updateMainUserDoc } =
    useFirebase();
  const { deleteJobSnapshot } = useJobSnapshotManagement();
  const analytics = getAnalytics();

  const archiveJobProcess = async () => {
    const parentUserIndex = users.findIndex((i) => i.ParentUser);
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
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${activeJob.name} Archived`,
      severity: "success",
      autoHideDuration: 3000,
    }));
    let newUserJobSnapshot = deleteJobSnapshot(activeJob, [...userJobSnapshot]);
    await uploadUserJobSnapshot(newUserJobSnapshot);
    await archiveJob(activeJob);
    await removeJob(activeJob);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateMainUserDoc();
    updateEditJobTrigger((prev) => !prev);
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
