import { getAnalytics, logEvent } from "firebase/analytics";
import { useContext, useMemo } from "react";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../Context/AuthContext";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { useFirebase } from "../useFirebase";

export function useArchiveGroupJobs() {
  const { users, updateUsers } = useContext(UsersContext);
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { archiveJob, removeJob, updateMainUserDoc } = useFirebase();
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
  };

  return {
    archiveGroupJobs,
  };
}
0