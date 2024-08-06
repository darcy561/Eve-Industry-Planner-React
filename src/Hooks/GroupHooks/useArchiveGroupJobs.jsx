import { getAnalytics, logEvent } from "firebase/analytics";
import { useContext } from "react";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../Context/AuthContext";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { useFirebase } from "../useFirebase";
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";
import uploadGroupsToFirebase from "../../Functions/Firebase/uploadGroupData";
import deleteJobFromFirebase from "../../Functions/Firebase/deleteJob";
import archiveJobInFirebase from "../../Functions/Firebase/archiveJob";

export function useArchiveGroupJobs() {
  const { users, updateUsers } = useContext(UsersContext);
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { jobArray, groupArray, updateGroupArray, updateJobArray } =
    useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { updateMainUserDoc } = useFirebase();
  const { sendSnackbarNotificationSuccess } = useHelperFunction();
  const analytics = getAnalytics();

  const archiveGroupJobs = async (selectedJobs) => {
    const { groupID, groupName } = groupArray.find(
      (i) => i.groupID === activeGroup
    );
    let newUserArray = [...users];
    let parentUserIndex = newUserArray.findIndex((i) => i.ParentUser);
    let newLinkedOrders = new Set(newUserArray[parentUserIndex].linkedOrders);
    let newLinkedTrans = new Set(newUserArray[parentUserIndex].linkedTrans);
    let newLinkedJobs = new Set(newUserArray[parentUserIndex].linkedJobs);

    logEvent(analytics, "Archive Group Jobs", {
      UID: newUserArray[parentUserIndex].accountID,
      groupID: groupID,
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

    let newGroupArray = groupArray.filter((i) => i.groupID !== activeGroup);

    for (let selectedJob of selectedJobs) {
      if (userJobSnapshot.some((i) => i.jobID === selectedJob.jobID)) continue;
      await archiveJobInFirebase(selectedJob);
      await deleteJobFromFirebase(selectedJob);
    }
    updateUsers(newUserArray);
    updateGroupArray(newGroupArray);
    updateJobArray(newJobArray);
    updateActiveGroup(null);
    if (isLoggedIn) {
      await uploadGroupsToFirebase(newGroupArray);
      await updateMainUserDoc();
    }
    sendSnackbarNotificationSuccess(`${groupName} Archived`, 3);
  };

  return {
    archiveGroupJobs,
  };
}
0;
