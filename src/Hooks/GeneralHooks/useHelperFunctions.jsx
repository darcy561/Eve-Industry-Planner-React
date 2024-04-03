import { useContext } from "react";
import { EveIDsContext, EvePricesContext } from "../../Context/EveDataContext";
import { jobTypes } from "../../Context/defaultValues";
import { UsersContext } from "../../Context/AuthContext";
import { SnackBarDataContext } from "../../Context/LayoutContext";

export function useHelperFunction() {
  const { users } = useContext(UsersContext);
  const { evePrices } = useContext(EvePricesContext);
  const { eveIDs } = useContext(EveIDsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

  function Add_RemovePendingChildJobs(
    materialChildJobObject,
    reqiredID,
    isAdd
  ) {
    const newChildJobstoAdd = new Set(materialChildJobObject?.add);
    const newChildJobsToRemove = new Set(materialChildJobObject?.remove);

    if (isAdd) {
      newChildJobstoAdd.add(reqiredID);
      newChildJobsToRemove.delete(reqiredID);
    } else {
      newChildJobstoAdd.delete(reqiredID);
      newChildJobsToRemove.add(reqiredID);
    }
    return {
      newChildJobstoAdd: [...newChildJobstoAdd],
      newChildJobsToRemove: [...newChildJobsToRemove],
    };
  }

  function Add_RemovePendingParentJobs(parentJobObject, reqiredID, isAdd) {
    const newParentJobsToAdd = new Set(parentJobObject.add);
    const newParentJobsToRemove = new Set(parentJobObject.remove);

    if (isAdd) {
      newParentJobsToAdd.add(reqiredID);
      newParentJobsToRemove.delete(reqiredID);
    } else {
      newParentJobsToAdd.delete(reqiredID);
      newParentJobsToRemove.add(reqiredID);
    }

    return {
      newParentJobsToAdd: [...newParentJobsToAdd],
      newParentJobsToRemove: [...newParentJobsToRemove],
    };
  }

  function findItemPriceObject(requestedTypeID, alternativePriceObject) {
    const missingItemCost = {
      jita: {
        buy: 0,
        sell: 0,
      },
      amarr: {
        buy: 0,
        sell: 0,
      },
      dodixie: {
        buy: 0,
        sell: 0,
      },
      typeID: requestedTypeID,
      lastUpdated: 0,
      adjustedPrice: 0,
    };
    return (
      evePrices[requestedTypeID] ||
      alternativePriceObject[requestedTypeID] ||
      missingItemCost
    );
  }

  function findUniverseItemObject(requestedID, alternativeItemLocation) {
    return eveIDs[requestedID] || alternativeItemLocation[requestedID] || null;
  }

  function isItemBuildable(requestedJobType) {
    if (
      requestedJobType === jobTypes.manufacturing ||
      requestedJobType === jobTypes.reaction
    ) {
      return true;
    }
    return false;
  }

  function findParentUser() {
    return users.find((i) => i.ParentUser);
  }

  function findParentUserIndex() {
    return users.findIndex((i) => i.ParentUser);
  }

  async function importMultibuyFromClipboard() {
    const returnArray = [];
    const importedText = await readTextFromClipboard();

    const matchedItems = [
      ...importedText.matchAll(/^(.*)\t([0-9,]*)\t([0-9,.]*)\t([0-9,.]*)$/gm),
    ];

    for (let item of matchedItems) {
      returnArray.push({
        importedName: item[1] || "",
        importedQuantity: parseFloat(item[2].replace(/,/g, "")) || 0,
        importedCost: parseFloat(item[3].replace(/,/g, "")) || 0,
      });
    }
    return returnArray;
  }

  async function writeTextToClipboard(inputTextString) {
    try {
      await navigator.clipboard.writeText(inputTextString);
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `Successfully Copied`,
        severity: "success",
        autoHideDuration: 1000,
      }));
    } catch (err) {
      console.message(err.message);
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `Error Copying Text To Clipboard`,
        severity: "error",
        autoHideDuration: 3000,
      }));
    }
  }

  async function readTextFromClipboard() {
    try {
      return await navigator.clipboard.readText();
    } catch (err) {
      console.message(err.message);
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `Error Reading Text From Clipboard`,
        severity: "error",
        autoHideDuration: 3000,
      }));
    }
  }



  return {
    Add_RemovePendingChildJobs,
    Add_RemovePendingParentJobs,
    findItemPriceObject,
    findParentUser,
    findParentUserIndex,
    findUniverseItemObject,
    importMultibuyFromClipboard,
    isItemBuildable,
    readTextFromClipboard,
    writeTextToClipboard,
  };
}
