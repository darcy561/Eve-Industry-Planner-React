import { useContext } from "react";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import {
  ActiveJobContext,
  JobArrayContext,
  LinkedIDsContext,
} from "../../Context/JobContext";
import { SnackBarDataContext } from "../../Context/LayoutContext";
import { useFirebase } from "../useFirebase";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import { useJobSnapshotManagement } from "./useJobSnapshots";
import { useManageGroupJobs } from "../GroupHooks/useManageGroupJobs";

export function useCloseActiveJob() {
  const { updateActiveJob, updateActiveGroup } = useContext(ActiveJobContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { jobArray, updateJobArray, groupArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const {
    linkedJobIDs,
    updateLinkedJobIDs,
    linkedOrderIDs,
    updateLinkedOrderIDs,
    linkedTransIDs,
    updateLinkedTransIDs,
  } = useContext(LinkedIDsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { addNewJob, uploadJob, uploadUserJobSnapshot } = useFirebase();
  const { newJobSnapshot, updateJobSnapshot } = useJobSnapshotManagement();
  const { addJobToGroup } = useManageGroupJobs();
  const { findJobData } = useFindJobObject();

  async function closeActiveJob(
    inputJob,
    jobModifiedFlag,
    tempJobsToAdd,
    esiDataToLink,
    parentChildToEdit
  ) {
    if (!jobModifiedFlag) {
      updateActiveJob(null);
      return;
    }

    let newJobArray = [...jobArray];
    let newGroupArray = [...groupArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    const newLinkedJobIDs = new Set(linkedJobIDs);
    const newLinkedOrderIDs = new Set(linkedOrderIDs);
    const newLinkedTransIDs = new Set(linkedTransIDs);
    const index = newJobArray.findIndex((x) => inputJob.jobID === x.jobID);
    newJobArray[index] = inputJob;
    // newUserJobSnapshot = unlockUserJob(newUserJobSnapshot, inputJob.jobID);

    Object.values(tempJobsToAdd).forEach((tempJob) => {
      inputJob.build.childJobs[tempJob.itemID].push(tempJob.jobID);
      newJobArray.push(tempJob);
      if (!inputJob.groupID) {
        newUserJobSnapshot = newJobSnapshot(tempJob, newUserJobSnapshot);
      } else {
        newGroupArray = addJobToGroup(tempJob, newGroupArray, newJobArray);
      }
      addNewJob(tempJob);
    });
    addIDsToSet(newLinkedJobIDs, esiDataToLink.industryJobs.add);
    addIDsToSet(newLinkedOrderIDs, esiDataToLink.marketOrders.add);
    addIDsToSet(newLinkedTransIDs, esiDataToLink.transactions.add);
    removeIDsFromSet(newLinkedJobIDs, esiDataToLink.industryJobs.remove);
    removeIDsFromSet(newLinkedOrderIDs, esiDataToLink.marketOrders.remove);
    removeIDsFromSet(newLinkedTransIDs, esiDataToLink.transactions.remove);

    // updateNewParentJobs(
    //   parentChildToEdit.parentJobs,
    //   inputJob,
    //   newJobArray,
    //   newUserJobSnapshot
    // );
    // updadteNewChildJobs(
    //   parentChildToEdit.childJobs,
    //   inputJob,
    //   newJobArray,
    //   newUserJobSnapshot
    // );

    newUserJobSnapshot = updateJobSnapshot(inputJob, newUserJobSnapshot);

    let parentIDsToRemove = new Set();
    const modifiedJobsSet = new Set();
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
        modifiedJobsSet.add(parentJob.jobID);
        continue;
      }

      let childJobSet = new Set(
        parentJob.build.childJobs[parentMaterial.typeID]
      );

      if (!childJobSet.has(inputJob.jobID)) {
        childJobSet.add(inputJob.jobID);
        modifiedJobsSet.add(parentJob.jobID);
        parentJob.build.childJobs[parentMaterial.typeID] = [...childJobSet];
      }
    }
    if (parentIDsToRemove.size > 0) {
      let replacementParentJobs = new Set(inputJob.parentJob);
      parentIDsToRemove.forEach((id) => {
        replacementParentJobs.delete(id);
      });
      inputJob.parentJob = [...replacementParentJobs];
    }
    for (const idToRemove of parentChildToEdit.parentJobs.remove) {
      let matchingJob = newJobArray.find((i) => i.jobID === idToRemove);
      if (!matchingJob) continue;
      matchingJob.build.childJobs[inputJob.itemID] =
        matchingJob.build.childJobs[inputJob.itemID].filter(
          (i) => i !== inputJob.jobID 
        );
      modifiedJobsSet.add(matchingJob.jobID);
    }

    for (let material of inputJob.build.materials) {
      let childJobsToRemove = new Set();
      if (parentChildToEdit.childJobs[material.typeID]) {
        for (const idToAdd of parentChildToEdit.childJobs[material.typeID]
          .remove) {
          const matchedJob = newJobArray.find((i) => i.jobID === idToAdd);
          if (!matchedJob) continue;
          matchedJob.parentJob.push(inputJob.jobID);
          modifiedJobsSet.add(matchedJob.jobID);
        }
        for (const idToRemove of parentChildToEdit.childJobs[material.typeID]
          .remove) {
          let matchedJob = newJobArray.find((i) => i.jobID === idToRemove);
          if (!matchedJob) continue;
          matchedJob.parentJob = matchedJob.parentJob.filter(
            (i) => i !== inputJob.jobID
          );
          modifiedJobsSet.add(matchedJob.jobID);
        }
      }

      for (let childJobID of inputJob.build.childJobs[material.typeID]) {
        let childJob = await findJobData(
          childJobID,
          newUserJobSnapshot,
          newJobArray
        );
        if (!childJob) continue;

        if (childJob.itemID !== material.typeID) {
          childJobsToRemove.add(childJobID);
          modifiedJobsSet.add(childJob.jobID);
          continue;
        }

        let childJobParentSet = new Set(childJob.parentJob);

        if (!childJobParentSet.has(inputJob.jobID)) {
          childJobParentSet.add(inputJob.jobID);
          childJob.parentJob = [...childJobParentSet];
          modifiedJobsSet.add(childJob.jobID);
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

    modifiedJobsSet.forEach((modifiedID) => {
      const matchedJob = newJobArray.find((i) => i.jobID === modifiedID);
      if (!matchedJob) return;
      newUserJobSnapshot = updateJobSnapshot(matchedJob, newUserJobSnapshot);

      if (isLoggedIn) {
        uploadJob(matchedJob);
      }
    });

    if (
      inputJob.groupID !== null &&
      inputJob.isReadyToSell &&
      !newUserJobSnapshot.some((i) => i.jobID === inputJob.jobID)
    ) {
      newUserJobSnapshot = newJobSnapshot(inputJob, newUserJobSnapshot);
    }

    if (inputJob.groupID) {
      let updatedGroupObject = newGroupArray.find(
        (i) => i.groupID === inputJob.groupID
      );
      if (updatedGroupObject) {
        updateActiveGroup(updatedGroupObject);
      }
      updateGroupArray(newGroupArray);
    }

    updateLinkedJobIDs([...newLinkedJobIDs]);
    updateLinkedOrderIDs([...newLinkedOrderIDs]);
    updateLinkedTransIDs([...newLinkedTransIDs]);
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateActiveJob(null);

    if (isLoggedIn) {
      await uploadUserJobSnapshot(newUserJobSnapshot);
      await uploadJob(inputJob);
    }

    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${inputJob.name} Updated`,
      severity: "info",
      autoHideDuration: 1000,
    }));
  }

  function addIDsToSet(originalSet, toBeAdded) {
    toBeAdded.forEach((i) => {
      originalSet.add(i);
    });
  }

  function removeIDsFromSet(originalSet, toBeRemoved) {
    toBeRemoved.forEach((i) => {
      originalSet.delete(i);
    });
  }

  function updateNewParentJobs(
    itemsToModify,
    inputJob,
    inputJobArray,
    inputJobSnapshot
  ) {
    for (const idToAdd of itemsToModify.add) {
      const matchingJob = inputJobArray.find((i) => i.jobID === idToAdd);
      if (!matchingJob) continue;
      matchingJob.build.childJobs[inputJob.itemID].push(inputJob.jobID);
      if (
        matchingJob.groupID !== null &&
        matchingJob.isReadyToSell &&
        !inputJobSnapshot.some((i) => i.jobID === matchingJob.jobID)
      ) {
        inputJobSnapshot = updateJobSnapshot(matchingJob, inputJobSnapshot);
      }
    }

    for (const idToRemove of itemsToModify.remove) {
      let matchingJob = inputJobArray.find((i) => i.jobID === idToRemove);
      if (!matchingJob) continue;
      matchingJob.build.childJobs[inputJob.itemID] =
        matchingJob.build.childJobs[inputJob.itemID].filter(
          (i) => i !== inputJob.jobID
        );
      if (
        matchingJob.groupID !== null &&
        matchingJob.isReadyToSell &&
        !inputJobSnapshot.some((i) => i.jobID === matchingJob.jobID)
      ) {
        inputJobSnapshot = updateJobSnapshot(matchingJob, inputJobSnapshot);
      }
    }
  }

  function updadteNewChildJobs(
    itemsToModify,
    inputJob,
    inputJobArray,
    inputJobSnapshot
  ) {
    for (let material of inputJob.build.materials) {
      if (!itemsToModify[material.typeID]) continue;
      for (const idToAdd of itemsToModify[material.typeID].add) {
        fo;
        const matchingJob = inputJobArray.find((i) => i.jobID === idToAdd);
        if (!matchingJob) continue;
        matchingJob.parentJob.push(inputJob.jobID);
        if (
          matchingJob.groupID !== null &&
          matchingJob.isReadyToSell &&
          !inputJobSnapshot.some((i) => i.jobID === matchingJob.jobID)
        ) {
          inputJobSnapshot = updateJobSnapshot(matchingJob, inputJobSnapshot);
        }
      }
      for (const idToRemove of itemsToModify[material.typeID].remove) {
        let matchingJob = inputJobArray.find((i) => i.jobID === idToRemove);
        if (!matchingJob) continue;
        matchingJob.parentJob = matchingJob.parentJob.filter(
          (i) => i !== inputJob.jobID
        );
        if (
          matchingJob.groupID !== null &&
          matchingJob.isReadyToSell &&
          !inputJobSnapshot.some((i) => i.jobID === matchingJob.jobID)
        ) {
          inputJobSnapshot = updateJobSnapshot(matchingJob, inputJobSnapshot);
        }
      }
    }
  }

  return {
    closeActiveJob,
  };
}
