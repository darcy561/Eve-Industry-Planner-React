import { useContext, useMemo } from "react";
import { JobArrayContext } from "../../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../Context/AuthContext";
import { useFindJobObject } from "./useFindJobObject";
import { logEvent } from "firebase/analytics";
import { analytics } from "../../firebase";

export function useShoppingList() {
  const { users } = useContext(UsersContext);
  const { jobArray, groupArray, updateJobArray } = useContext(JobArrayContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { findJobData } = useFindJobObject();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  async function buildShoppingList(inputJobIDs) {
    let finalInputList = [];
    let finalShoppingList = [];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];

    for (let inputID of inputJobIDs) {
      if (inputID.includes("group")) {
        let inputGroup = groupArray.find((i) => i.groupID === inputID);
        if (!inputGroup) {
          return;
        }
        finalInputList = finalInputList.concat([...inputGroup.includedJobIDs]);
      } else {
        finalInputList.push(inputID);
      }
    }

    for (let inputJobID of finalInputList) {
      let inputJob = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );

      if (!inputJob) {
        continue;
      }

      inputJob.build.materials.forEach((material) => {
        if (material.quantityPurchased >= material.quantity) {
          return;
        }
        let childState =
          inputJob.build.childJobs[material.typeID].length > 0 ? true : false;
        let shoppingListEntries = finalShoppingList.filter(
          (i) => i.typeID === material.typeID
        );
        if (shoppingListEntries.length === 0) {
          finalShoppingList.push({
            name: material.name,
            typeID: material.typeID,
            quantity: material.quantity - material.quantityPurchased,
            quantityLessAsset: 0,
            volume: material.volume,
            hasChild: childState,
            isVisible: false,
          });
          return;
        }
        let foundChild = shoppingListEntries.find(
          (i) => i.hasChild === childState
        );
        if (!foundChild) {
          finalShoppingList.push({
            name: material.name,
            typeID: material.typeID,
            quantity: material.quantity - material.quantityPurchased,
            quantityLessAsset: 0,
            volume: material.volume,
            hasChild: childState,
            isVisible: false,
          });
        } else {
          foundChild.quantity += material.quantity - material.quantityPurchased;
        }
      });
    }
    finalShoppingList.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name < b.name) {
        return 1;
      }
      return 0;
    });
    logEvent(analytics, "Build Shopping List", {
      UID: parentUser.accountID,
      buildCount: finalShoppingList.length,
      loggedIn: isLoggedIn,
    });
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    return finalShoppingList;
  }

  return { buildShoppingList };
}
