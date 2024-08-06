import { useContext } from "react";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../Context/AuthContext";
import { ItemTypes } from "../Context/DnDTypes";
import { JobArrayContext } from "../Context/JobContext";
import { useFindJobObject } from "./GeneralHooks/useFindJobObject";
import uploadGroupsToFirebase from "../Functions/Firebase/uploadGroupData";
import updateJobInFirebase from "../Functions/Firebase/updateJob";

export function useDnD() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { jobArray, groupArray, updateJobArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { findJobData } = useFindJobObject();


  const recieveJobCardToStage = async (item, status) => {
    if (item.currentStatus === status.id) {
      return;
    }

    switch (item.cardType) {
      case ItemTypes.jobCard:
        let newUserJobSnapshot = [...userJobSnapshot];
        let newJobArray = [...jobArray];

        let inputJob = await findJobData(
          item.id,
          newUserJobSnapshot,
          newJobArray
        );
        if (!inputJob) {
          return;
        }
        inputJob.jobStatus = status.id;

        const matchedSnapshot = newUserJobSnapshot.find(
          (i) => i.jobID === inputJob.jobID
        );
        matchedSnapshot.setSnapshot(inputJob);

        if (isLoggedIn) {
          await updateJobInFirebase(inputJob);
        }
        updateUserJobSnapshot(newUserJobSnapshot);
        updateJobArray(newJobArray);

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
