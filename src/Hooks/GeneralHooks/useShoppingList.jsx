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
  const {
    findParentUser,
    findItemPriceObject,
    importAssetsFromClipboard_IconView,
  } = useHelperFunction();

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
          finalShoppingList.push(buildShoppingListObject(material, childState));
          return;
        }
        let foundChild = shoppingListEntries.find(
          (i) => i.hasChild === childState
        );
        if (!foundChild) {
          finalShoppingList.push(buildShoppingListObject(material, childState));
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

  function buildShoppingListObject(material, childJobPresent) {
    return {
      name: material.name,
      typeID: material.typeID,
      quantity: material.quantity - material.quantityPurchased,
      assetQuantity: 0,
      volume: material.volume,
      hasChild: childJobPresent,
      isVisible: false,
    };
  }

  function buildCopyText(item) {
    return `${item.name} ${Math.max(
      item.quantity - (item.assetQuantity || 0),
      0
    )}\n`;
  }

  function calculateItemPrice(item, alternativePriceLocation) {
    const itemPriceObject = findItemPriceObject(
      item.typeID,
      alternativePriceLocation
    );
    const individualItemPrice =
      itemPriceObject[parentUser.settings.editJob.defaultMarket][
        parentUser.settings.editJob.defaultOrders
      ];

    return (
      individualItemPrice * Math.max(item.quantity - item.assetQuantity, 0)
    );
  }

  function calculateVolumeTotal(item) {
    return item.volume * Math.max(item.quantity - item.assetQuantity, 0);
  }

  function isAssetQuantityVisable(item) {
    return Math.max(item.quantity - item.assetQuantity, 0) > 0 ? true : false;
  }

  function isChildJobVisable(childJobDisplayFlag, item) {
    return !childJobDisplayFlag && !item.hasChild ? true : false;
  }

  function isItemVisable(remvoveAssetFlag, childJobDisplayFlag, item) {
    const quantity = isAssetQuantityVisable(item);
    const childJob = isChildJobVisable(childJobDisplayFlag, item);

    if (remvoveAssetFlag && quantity && childJob) return true;

    if (!remvoveAssetFlag && childJob) return true;

    return false;
  }

  function generateTextToCopy(inputItems) {
    let outputText = "";

    inputItems.forEach((item) => {
      outputText = outputText.concat(buildCopyText(item));
    });
    return outputText;
  }

  function clearAssetQuantities(itemList) {
    itemList.forEach((item) => (item.assetQuantity = 0));
  }

  async function importAssetsFromClipboard(itemList) {
    const newItemList = [...itemList];
    const importedAssets = await importAssetsFromClipboard_IconView();
    for (let item of newItemList) {
      const matchedItem = importedAssets[item.name];
      if (!matchedItem) continue;

      item.assetQuantity = matchedItem;
    }
    return newItemList;
  }

  return {
    buildShoppingList,
    calculateItemPrice,
    calculateVolumeTotal,
    clearAssetQuantities,
    generateTextToCopy,
    importAssetsFromClipboard,
    isItemVisable,
  };
}
