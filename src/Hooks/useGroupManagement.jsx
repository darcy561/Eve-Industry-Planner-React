import { useContext } from "react";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../Context/AuthContext";
import { JobArrayContext } from "../Context/JobContext";
import Group from "../Classes/groupsConstructor";
import JobSnapshot from "../Classes/jobSnapshotConstructor";
import uploadGroupsToFirebase from "../Functions/Firebase/uploadGroupData";
import updateJobInFirebase from "../Functions/Firebase/updateJob";
import uploadJobSnapshotsToFirebase from "../Functions/Firebase/uploadJobSnapshots";
import findOrGetJobObject from "../Functions/Helper/findJobObject";
import manageListenerRequests from "../Functions/Firebase/manageListenerRequests";

export function useGroupManagement() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { groupArray, updateGroupArray } = useContext(JobArrayContext);
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );

  const createNewGroupWithJobs = async (inputJobIDs) => {
    const retrievedJobs = [];
    let newUserJobSnapshot = [...userJobSnapshot];
    const newGroupArray = [...groupArray];
    const jobsToSave = new Set();
    const jobsForGroup = [];

    const newGroupEntry = new Group();

    for (let inputID of inputJobIDs) {
      const inputJob = await findOrGetJobObject(
        inputID,
        jobArray,
        retrievedJobs
      );
      if (!inputJob) {
        continue;
      }
      jobsForGroup.push(inputJob);

      inputJob.groupID = newGroupEntry.groupID;

      for (let id of inputJob.parentJob) {
        if (inputJobIDs.includes(id)) {
          continue;
        }
        let job = await findOrGetJobObject(id, jobArray, retrievedJobs);
        if (!job) {
          continue;
        }
        let material = job.build.childJobs[inputJob.itemID];
        if (!material) {
          continue;
        }
        material = material.filter((i) => i !== inputJob.jobID);
      }

      inputJob.parentJob = inputJob.parentJob.filter((i) =>
        inputJobIDs.includes(i)
      );

      for (let mat of inputJob.build.materials) {
        let childJobArray = inputJob.build.childJobs[mat.typeID];
        for (let id of childJobArray) {
          if (inputJobIDs.includes(id)) {
            continue;
          }
          const job = await findOrGetJobObject(id, jobArray, retrievedJobs);
          if (!job) {
            continue;
          }
          job.parentJob = job.parentJob.filter((i) => !inputJob.jobID);
        }
        childJobArray = childJobArray.filter((i) => inputJobIDs.includes(i));
      }

      newUserJobSnapshot = newUserJobSnapshot.filter(
        (i) => i.jobID !== inputJob.jobID
      );

      jobsToSave.add(inputJob.jobID);
    }

    newGroupEntry.setGroupName(jobsForGroup);
    newGroupEntry.updateGroupData(jobsForGroup);

    newGroupArray.push(newGroupEntry);
    if (isLoggedIn) {
      await uploadJobSnapshotsToFirebase(newUserJobSnapshot);
      await uploadGroupsToFirebase(newGroupArray);

      for (let id of [...jobsToSave]) {
        let job = [...jobArray, ...retrievedJobs].find((i) => i.jobID === id);
        if (!job) {
          return;
        }
        await updateJobInFirebase(job);
      }
    }

    updateJobArray((prev) => {
      const existingIDs = new Set(prev.map(({ jobID }) => jobID));
      return [
        ...prev,
        ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
      ];
    });
    manageListenerRequests(
      retrievedJobs,
      updateJobArray,
      updateFirebaseListeners,
      firebaseListeners,
      isLoggedIn
    );
    updateUserJobSnapshot(newUserJobSnapshot);

    return { newGroupEntry, newGroupArray };
  };

  const replaceGroupData = (inputGroup, chosenGroupArray) => {
    chosenGroupArray = chosenGroupArray.filter(
      (i) => i.groupID !== group.groupID
    );
    chosenGroupArray.push(inputGroup);
    return chosenGroupArray;
  };

  const deleteGroupWithoutJobs = async (inputGroupID) => {
    const retrievedJobs = [];
    let newGroupArray = [...groupArray];
    let newUserJobSnapshot = [...userJobSnapshot];

    const chosenGroup = newGroupArray.find((i) => i.groupID === inputGroupID);

    for (let jobID of [...chosenGroup.includedJobIDs]) {
      let foundJob = await findOrGetJobObject(jobID, jobArray, retrievedJobs);
      if (!foundJob) {
        continue;
      }
      foundJob.groupID = null;
      newUserJobSnapshot.push(new JobSnapshot(foundJob));
      if (isLoggedIn) {
        await updateJobInFirebase(foundJob);
      }
    }
    newGroupArray = newGroupArray.filter((i) => i.groupID !== inputGroupID);

    if (isLoggedIn) {
      await uploadJobSnapshotsToFirebase(newUserJobSnapshot);
      await uploadGroupsToFirebase(newGroupArray);
    }
    manageListenerRequests(
      retrievedJobs,
      updateJobArray,
      updateFirebaseListeners,
      firebaseListeners,
      isLoggedIn
    );
    updateGroupArray(newGroupArray);
    updateJobArray((prev) => {
      const existingIDs = new Set(prev.map(({ jobID }) => jobID));
      return [
        ...prev,
        ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
      ];
    });
    updateUserJobSnapshot(newUserJobSnapshot);
  };

  const calculateCurrentJobBuildCostFromChildren = (outputJob) => {
    let finalBuildCost = 0;

    finalBuildCost += outputJob.build.costs.installCosts;
    finalBuildCost += outputJob.build.costs.extrasTotal;
    for (let material of outputJob.build.materials) {
      const childJobs = outputJob.build.childJobs[material.typeID];
      finalBuildCost += findItemBuildCost(material, childJobs);
    }

    function findItemBuildCost(material, inputChildJobs) {
      if (material.purchaseComplete || inputChildJobs.length === 0) {
        return material.purchasedCost;
      }

      let returnTotal = 0;
      let totalProduced = 0;

      for (let childJobID of inputChildJobs) {
        let childJob = jobArray.find((i) => i.jobID === childJobID);

        if (!childJob) {
          continue;
        }
        returnTotal += childJob.build.costs.installCosts;
        returnTotal += childJob.build.costs.extrasTotal;
        totalProduced += childJob.build.products.totalQuantity;
        for (let cMaterial of childJob.build.materials) {
          const childJobs = childJob.build.childJobs[cMaterial.typeID];
          returnTotal += findItemBuildCost(cMaterial, childJobs);
        }
      }
      return (returnTotal / totalProduced) * material.quantity;
    }
    return finalBuildCost / outputJob.build.products.totalQuantity;
  };

  return {
    calculateCurrentJobBuildCostFromChildren,
    createNewGroupWithJobs,
    deleteGroupWithoutJobs,
    replaceGroupData,
  };
}
