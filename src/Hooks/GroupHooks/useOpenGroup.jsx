import { useContext } from "react";
import { UserJobSnapshotContext } from "../../Context/AuthContext";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { DataExchangeContext } from "../../Context/LayoutContext";
import { useJobManagement } from "../useJobManagement";

export function useOpenGroup() {
  const { jobArray, groupArray, updateJobArray } = useContext(JobArrayContext);
  const { updateActiveGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { findJobData } = useJobManagement();

  const openGroup = async (inputGroupID) => {
    let newJobArray = [...jobArray];
    let requestedGroup = groupArray.find((i) => i.groupID === inputGroupID);
    if (requestedGroup === undefined) {
      return;
    }
    updateDataExchange((prev) => !prev);

    for (let jobID of requestedGroup.includedJobIDs) {
      let inputJob = await findJobData(
        jobID,
        userJobSnapshot,
        newJobArray,
        "groupJob"
      );
      if (inputJob === undefined) {
        continue;
      }
    }

    updateActiveGroup(requestedGroup);
    updateJobArray(newJobArray);
    updateDataExchange((prev) => !prev);
  };

  return {
    openGroup,
  };
}
