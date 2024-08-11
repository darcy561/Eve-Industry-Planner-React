import { useContext } from "react";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../Context/AuthContext";
import { ItemTypes } from "../Context/DnDTypes";
import { JobArrayContext } from "../Context/JobContext";
import uploadGroupsToFirebase from "../Functions/Firebase/uploadGroupData";
import updateJobInFirebase from "../Functions/Firebase/updateJob";
import findOrGetJobObject from "../Functions/Helper/findJobObject";
import manageListenerRequests from "../Functions/Firebase/manageListenerRequests";

export function useDnD() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { jobArray, groupArray, updateJobArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );

  const recieveJobCardToStage = async (item, status) => {
    if (item.currentStatus === status.id) {
      return;
    }

    switch (item.cardType) {
      case ItemTypes.jobCard:
        let inputJob = await findOrGetJobObject(item.id, jobArray);
        if (!inputJob) {
          return;
        }
        inputJob.setJobStatus(status.id);

        const matchedSnapshot = userJobSnapshot.find(
          (i) => i.jobID === inputJob.jobID
        );
        matchedSnapshot.setSnapshot(inputJob);

        if (isLoggedIn) {
          await updateJobInFirebase(inputJob);
        }
        manageListenerRequests(
          inputJob.jobID,
          updateJobArray,
          updateFirebaseListeners,
          firebaseListeners,
          isLoggedIn
        );
        updateUserJobSnapshot((prev) => [...prev]);
        updateJobArray((prev) => [
          ...prev.filter((doc) => doc.id !== inputJob.jobID),
          inputJob,
        ]);

      case ItemTypes.groupCard:
        let newGroupArray = [...groupArray];

        let groupItem = newGroupArray.find((i) => i.groupID === item.id);
        if (!groupItem) {
          return;
        }

        groupItem.groupStatus = status.id;

        updateGroupArray(newGroupArray);
        if (isLoggedIn) {
          await uploadGroupsToFirebase(newGroupArray);
        }
    }
  };
  const canDropCard = (item, status) => {
    switch (item.cardType) {
      case ItemTypes.jobCard:
        if (item.currentStatus === status.id) {
          return false;
        }
        return true;
      case ItemTypes.groupCard:
        if (item.currentStatus === status.id || status.id > 3) {
          return false;
        }
        return true;
    }
  };

  return { canDropCard, recieveJobCardToStage };
}
