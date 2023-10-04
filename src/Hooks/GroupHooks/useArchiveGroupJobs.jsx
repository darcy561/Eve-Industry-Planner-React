import { getAnalytics, logEvent } from "firebase/analytics";
import { useContext, useMemo } from "react";
import {
  IsLoggedIn,
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../Context/AuthContext";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { SnackBarDataContext } from "../../Context/LayoutContext";
import { useFirebase } from "../useFirebase";

export function useArchiveGroupJobs() {
  const { users, updateUsers } = useContext(UsersContext);
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { jobArray, groupArray, updateGroupArray, updateJobArray } =
    useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { archiveJob, removeJob, updateMainUserDoc, uploadGroups } =
    useFirebase();
  const analytics = getAnalytics();

  const archiveGroupJobs = async (selectedJobs) => {
    let newUserArray = [...users];
    let parentUserIndex = newUserArray.findIndex((i) => i.ParentUser);
    let newLinkedOrders = new Set(newUserArray[parentUserIndex].linkedOrders);
    let newLinkedTrans = new Set(newUserArray[parentUserIndex].linkedTrans);
    let newLinkedJobs = new Set(newUserArray[parentUserIndex].linkedJobs);

    logEvent(analytics, "Archive Group Jobs", {
      UID: newUserArray[parentUserIndex].accountID,
      groupID: activeGroup.groupID,
      groupSize: selectedJobs.length,
    });

    for (let selectedJob of selectedJobs) {
      if (userJobSnapshot.some((i) => i.jobID === selectedJob.jobID)) continue;

      newLinkedOrders = new Set([...newLinkedOrders], selectedJob.apiOrders);
      newLinkedTrans = new Set([...newLinkedTrans], selectedJob.linkedTrans);
      newLinkedJobs = new Set([...newLinkedJobs], selectedJob.linkedJobs);
    }

    let newJobArray = jobArray.filter(
      (i) =>
        selectedJobs.some((z) => z.jobID === i.jobID) &&
        !userJobSnapshot.some((x) => x.job === i.jobID)
    );

    let newGroupArray = groupArray.filter(
      (i) => i.groupID !== activeGroup.groupID
    );

    for (let selectedJob of selectedJobs) {
      if (userJobSnapshot.some((i) => i.jobID === selectedJob.jobID)) continue;
      await archiveJob(selectedJob);
      await removeJob(selectedJob);
    }
    updateUsers(newUserArray);
    updateGroupArray(newGroupArray);
    updateJobArray(newJobArray);
    updateActiveGroup(null);
    if (isLoggedIn) {
      await uploadGroups(newGroupArray);
      await updateMainUserDoc();
    }
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${activeGroup.groupName} Archived`,
      severity: "success",
      autoHideDuration: 3000,
    }));
  };

  return {
    archiveGroupJobs,
  };
}
0;
