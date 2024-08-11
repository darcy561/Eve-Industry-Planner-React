import { useContext } from "react";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import {
  ActiveJobContext,
  JobArrayContext,
  LinkedIDsContext,
} from "../../Context/JobContext";
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";
import JobSnapshot from "../../Classes/jobSnapshotConstructor";
import addNewJobToFirebase from "../../Functions/Firebase/addNewJob";
import updateJobInFirebase from "../../Functions/Firebase/updateJob";
import uploadJobSnapshotsToFirebase from "../../Functions/Firebase/uploadJobSnapshots";
import findOrGetJobObject from "../../Functions/Helper/findJobObject";
import manageListenerRequests from "../../Functions/Firebase/manageListenerRequests";

export function useCloseActiveJob() {
  const { updateActiveJob } = useContext(ActiveJobContext);
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
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );
  const { sendSnackbarNotificationInfo } = useHelperFunction();

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
    const retrievedJobs = [];
    let newGroupArray = [...groupArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    const newLinkedJobIDs = new Set(linkedJobIDs);
    const newLinkedOrderIDs = new Set(linkedOrderIDs);
    const newLinkedTransIDs = new Set(linkedTransIDs);
    const index = newJobArray.findIndex((x) => inputJob.jobID === x.jobID);
    newJobArray[index] = inputJob;

    Object.values(tempJobsToAdd).forEach((tempJob) => {
      inputJob.build.childJobs[tempJob.itemID].push(tempJob.jobID);
      newJobArray.push(tempJob);
      if (!inputJob.groupID) {
        newUserJobSnapshot.push(new JobSnapshot(tempJob));
      } else {
        const matchedGroup = newGroupArray.find(
          (i) => i.groupID === tempJob.groupID
        );
        matchedGroup.addJobsToGroup(tempJob);
      }
      if (isLoggedIn) {
        addNewJobToFirebase(tempJob);
      }
    });

    addIDsToSet(newLinkedJobIDs, esiDataToLink.industryJobs.add);
    addIDsToSet(newLinkedOrderIDs, esiDataToLink.marketOrders.add);
    addIDsToSet(newLinkedTransIDs, esiDataToLink.transactions.add);
    removeIDsFromSet(newLinkedJobIDs, esiDataToLink.industryJobs.remove);
    removeIDsFromSet(newLinkedOrderIDs, esiDataToLink.marketOrders.remove);
    removeIDsFromSet(newLinkedTransIDs, esiDataToLink.transactions.remove);

    const matchedSnapshot = newUserJobSnapshot.find(
      (i) => i.jobID === inputJob.jobID
    );
    matchedSnapshot.setSnapshot(inputJob);

    let parentIDsToRemove = new Set();
    const modifiedJobsSet = new Set();

    for (const idToRemove of parentChildToEdit.parentJobs.remove) {
      let matchingJob = newJobArray.find((i) => i.jobID === idToRemove);
      if (!matchingJob) continue;
      matchingJob.build.childJobs[inputJob.itemID] =
        matchingJob.build.childJobs[inputJob.itemID].filter(
          (i) => i !== inputJob.jobID
        );
      modifiedJobsSet.add(matchingJob.jobID);
    }
    inputJob.parentJob = inputJob.parentJob.filter(
      (i) => !parentChildToEdit.parentJobs.remove.includes(i)
    );

    for (let idToAdd of parentChildToEdit.parentJobs.add) {
      let matchingJob = newJobArray.find((i) => i.jobID === idToAdd);
      if (!matchingJob) continue;
      matchingJob.build.childJobs[inputJob.itemID].push(inputJob.jobID);
      modifiedJobsSet.add(matchingJob.jobID);
    }
    inputJob.parentJob = [
      ...new Set([...inputJob.parentJob, ...parentChildToEdit.parentJobs.add]),
    ];

    for (let material of inputJob.build.materials) {
      let childJobsToRemove = new Set();
      if (!parentChildToEdit.childJobs[material.typeID]) continue;

      for (const idToAdd of parentChildToEdit.childJobs[material.typeID].add) {
        const matchedJob = newJobArray.find((i) => i.jobID === idToAdd);
        if (!matchedJob) continue;
        matchedJob.parentJob.push(inputJob.jobID);
        inputJob.build.childJobs[material.typeID].push(idToAdd);
        modifiedJobsSet.add(matchedJob.jobID);
      }

      for (const idToRemove of parentChildToEdit.childJobs[material.typeID]
        .remove) {
        let matchedJob = newJobArray.find((i) => i.jobID === idToRemove);
        if (!matchedJob) continue;
        matchedJob.parentJob = matchedJob.parentJob.filter(
          (i) => i !== inputJob.jobID
        );
        inputJob.build.childJobs[material.typeID] = inputJob.build.childJobs[
          material.typeID
        ].filter((i) => i !== matchedJob.jobID);
        modifiedJobsSet.add(matchedJob.jobID);
      }

      for (let parentID of inputJob.parentJob) {
        let parentJob = await findOrGetJobObject(
          parentID,
          newJobArray,
          retrievedJobs
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
      for (let childJobID of inputJob.build.childJobs[material.typeID]) {
        let childJob = await findOrGetJobObject(
          childJobID,
          newJobArray,
          retrievedJobs
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

    for (let modifiedID of [...modifiedJobsSet]) {
      const matchedJob = newJobArray.find((i) => i.jobID === modifiedID);
      if (!matchedJob) return;

      const matchedSnapshot = newUserJobSnapshot.find(
        (i) => i.jobID === matchedJob.jobID
      );
      matchedSnapshot.setSnapshot(matchedJob);

      if (isLoggedIn) {
        await updateJobInFirebase(matchedJob);
      }
    }

    if (
      inputJob.groupID !== null &&
      inputJob.isReadyToSell &&
      !newUserJobSnapshot.some((i) => i.jobID === inputJob.jobID)
    ) {
      newUserJobSnapshot.push(new JobSnapshot(inputJob));
    }

    manageListenerRequests(
      [...retrievedJobs, ...Object.values(tempJobsToAdd)],
      updateJobArray,
      updateFirebaseListeners,
      firebaseListeners,
      isLoggedIn
    );

    if (inputJob.groupID) {
      updateGroupArray(newGroupArray);
    }

    updateLinkedJobIDs([...newLinkedJobIDs]);
    updateLinkedOrderIDs([...newLinkedOrderIDs]);
    updateLinkedTransIDs([...newLinkedTransIDs]);
    updateJobArray(() => [...newJobArray, ...retrievedJobs]);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateActiveJob(null);
    if (isLoggedIn) {
      await uploadJobSnapshotsToFirebase(newUserJobSnapshot);
      await updateJobInFirebase(inputJob);
    }

    sendSnackbarNotificationInfo(`${inputJob.name} Updated`);
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

  return {
    closeActiveJob,
  };
}
