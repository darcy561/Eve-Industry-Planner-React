import { useMemo } from "react";

import {
  parentCommitment,
  resolveParentRequirements,
} from "../../Functions/Groups/parentRequirements";
import useUsersStore from "../../Zustand/usersStore";

/**
 * How much of a job's output is owed to the jobs above it, and how much is left
 * to sell.
 *
 * Read through one hook because three panels on the Planning stage act on it and
 * must agree: Returns prices the surplus, Cost Breakdown charges fee and tax on
 * it, and Skills only asks what selling costs when there is something to sell.
 * Two of them deriving it separately is how they come to disagree.
 *
 * @param {object} params
 * @param {object} params.state - Edit Job state
 * @param {object} params.actions - Edit Job actions
 * @returns {import("../../Functions/Groups/parentRequirements").ParentCommitment}
 */
export function useJobCommitment({ state, actions }) {
  const { activeJob } = state;
  const findJobInJobArray = useUsersStore(
    (store) => store.jobData.actions.findJobInJobArray,
  );
  const parentJobIDs = actions?.getCurrentParentJobs?.() ?? [];
  const parentKey = parentJobIDs.join(",");

  return useMemo(
    () =>
      parentCommitment({
        produced: activeJob.totalQuantityProduced ?? 0,
        jobID: activeJob.jobID,
        hasParents: parentJobIDs.length > 0,
        requirements: resolveParentRequirements({
          parentJobIDs,
          findJobInJobArray,
          itemID: activeJob.itemID,
          jobID: activeJob.jobID,
        }),
      }),
    [activeJob, findJobInJobArray, parentKey],
  );
}
