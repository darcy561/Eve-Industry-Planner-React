import { useContext } from "react";
import { ActiveJobContext } from "../../Context/JobContext";

export function useManageGroupJobs() {
  const { activeGroup } = useContext(ActiveJobContext);

  const addJobToGroup = (inputJob, inputGroupArray, inputJobArray) => {
    if (!inputJob) return inputGroupArray;

    if (!inputJob.groupID) return inputGroupArray;

    const selectedGroupIndex = inputGroupArray.findIndex(
      (i) => i.groupID === inputJob.groupID
    );

    if (selectedGroupIndex === -1) return inputGroupArray;

    const matchedGroup = inputGroupArray[selectedGroupIndex];

    const filteredGroupJobs = inputJobArray.filter(
      (job) => job.groupID === activeGroup && job.jobID !== inputJob.jobID
    );

    filteredGroupJobs.push(inputJob);

    const {
      outputJobCount,
      materialIDs,
      jobTypeIDs,
      includedJobIDs,
      linkedJobIDs,
      linkedTransIDs,
      linkedOrderIDs,
    } = filteredGroupJobs.reduce(
      (prev, job) => {
        if (job.parentJob.length === 0) {
          prev.outputJobCount++;
        }
        prev.materialIDs.add(job.itemID);
        prev.jobTypeIDs.add(job.itemID);
        prev.includedJobIDs.add(job.jobID);
        prev.linkedJobIDs = new Set([...prev.linkedJobIDs, ...job.apiJobs]);
        prev.linkedOrderIDs = new Set([
          ...prev.linkedOrderIDs,
          ...job.apiOrders,
        ]);
        prev.linkedTransIDs = new Set([
          ...prev.linkedTransIDs,
          ...job.apiTransactions,
        ]);

        job.build.materials.forEach((mat) => {
          prev.materialIDs.add(mat.typeID);
        });
        return prev;
      },
      {
        outputJobCount: 0,
        materialIDs: new Set(),
        jobTypeIDs: new Set(),
        includedJobIDs: new Set(),
        linkedJobIDs: new Set(),
        linkedTransIDs: new Set(),
        linkedOrderIDs: new Set(),
      }
    );

    matchedGroup.includedJobIDs = [...includedJobIDs];
    matchedGroup.includedTypeIDs = [...jobTypeIDs];
    matchedGroup.materialIDs = [...materialIDs];
    matchedGroup.outputJobCount = outputJobCount;
    matchedGroup.linkedJobIDs = [...linkedJobIDs];
    matchedGroup.linkedOrderIDs = [...linkedOrderIDs];
    matchedGroup.linkedTransIDs = [...linkedTransIDs];

    inputGroupArray[selectedGroupIndex] = matchedGroup;

    return inputGroupArray;
  };

  const removeJobFromGroup = () => {};

  return { addJobToGroup, removeJobFromGroup };
}
