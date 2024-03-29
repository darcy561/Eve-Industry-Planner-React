import { useContext } from "react";
import { JobArrayContext } from "../../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import { useFindJobObject } from "./useFindJobObject";
import { logEvent } from "firebase/analytics";
import { analytics } from "../../firebase";
import { useHelperFunction } from "./useHelperFunctions";

export function useShoppingList() {
  const { jobArray, groupArray, updateJobArray } = useContext(JobArrayContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { findJobData } = useFindJobObject();
  const { findParentUser, findItemPriceObject } = useHelperFunction();

  const parentUser = findParentUser();

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

  function buildCopyText(removeAssetsFlag, item) {
    return removeAssetsFlag
      ? `${item.name} ${item.quantityLessAsset}\n`
      : `${item.name} ${item.quantity}\n`;
  }

  function calculateItemPrice(
    removeAssetsFlag,
    item,
    assetQuantity,
    alternativePriceLocation
  ) {
    const itemPriceObject = findItemPriceObject(
      item.typeID,
      alternativePriceLocation
    );
    const individualItemPrice =
      itemPriceObject[parentUser.settings.editJob.defaultMarket][
        parentUser.settings.editJob.defaultOrders
      ];

    return removeAssetsFlag
      ? individualItemPrice * (item.quantity - assetQuantity)
      : individualItemPrice * item.quantity;
  }

  function calculateVolumeTotal(removeAssetsFlag, item, assetQuantity) {
    return removeAssetsFlag
      ? item.volume * (item.quantity - assetQuantity)
      : item.volume * item.quantity;
  }

  function isAssetQuantityVisable(item, assetQuantity) {
    return item.quantity - assetQuantity > 0 ? true : false;
  }

  function isChildJobVisable(childJobDisplayFlag, item) {
    return !childJobDisplayFlag && !item.hasChild ? true : false;
  }

  function isItemVisable(
    remvoveAssetFlag,
    childJobDisplayFlag,
    item,
    assetQuantity
  ) {
    const quantity = isAssetQuantityVisable(item, assetQuantity);
    const childJob = isChildJobVisable(childJobDisplayFlag, item);

    if (remvoveAssetFlag && quantity && childJob) return true;

    if (!remvoveAssetFlag && childJob) return true;

    return false;
  }

  function findCharacterAssets(fullAssetList, itemID, selectedCharacter) {
    if (selectedCharacter !== "all") {
      return fullAssetList.find(
        (i) => i.itemID === itemID && i.CharacterHash === itemID
      );
    }

    return fullAssetList.find((i) => i.item_id === itemID);
  }

  function generateTextToCopy(removeAssetFlag, inputItems) {
    let outputText = "";

    inputItems.forEach((item) => {
      outputText = outputText.concat(buildCopyText(removeAssetFlag, item));
    });
    return outputText;
  }

  return {
    buildShoppingList,
    calculateItemPrice,
    calculateVolumeTotal,
    findCharacterAssets,
    generateTextToCopy,
    isItemVisable,
  };
}
