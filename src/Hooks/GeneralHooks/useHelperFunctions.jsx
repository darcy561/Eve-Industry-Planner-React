import { useContext } from "react";
import { EveIDsContext, EvePricesContext } from "../../Context/EveDataContext";
import { jobTypes } from "../../Context/defaultValues";
import { IsLoggedInContext, UsersContext } from "../../Context/AuthContext";
import {
  ApplicationSettingsContext,
  SnackBarDataContext,
  UserLoginUIContext,
} from "../../Context/LayoutContext";

export function useHelperFunction() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const { evePrices } = useContext(EvePricesContext);
  const { eveIDs } = useContext(EveIDsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { userDataFetch } = useContext(UserLoginUIContext);
  const { applicationSettings } = useContext(ApplicationSettingsContext);

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

  function findItemPriceObject(requestedTypeID, alternativePriceObject = {}) {
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
    if (
      !alternativeItemLocation ||
      typeof alternativeItemLocation !== "object"
    ) {
      return eveIDs[requestedID] || null;
    }
    return eveIDs[requestedID] || alternativeItemLocation[requestedID] || null;
  }

  function isItemBuildable(inputJobType) {
    if (
      inputJobType === jobTypes.manufacturing ||
      inputJobType === jobTypes.reaction
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

  async function checkClipboardReadPermissions() {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "clipboard-read",
      });
      if (["granted", "prompt"].includes(permissionStatus.state)) return true;

      return false;
    } catch (error) {
      console.error("Error requesting clipboard read permission:", error);
      return false;
    }
  }

  async function importMultibuyFromClipboard() {
    try {
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
    } catch (err) {
      console.error(err.message);
      return [];
    }
  }

  async function importAssetsFromClipboard_IconView() {
    try {
      let returnObject = {};
      const importedText = await readTextFromClipboard();
      if (!importedText) return returnObject;

      const itemMatches = [
        ...importedText.matchAll(
          /^(?<itemName>.+?)\s*(?<itemQuantity>\d+)?\s*$/gm
        ),
      ];

      itemMatches.forEach((inputMatch) => {
        let objectMatch = returnObject[inputMatch.groups.itemName];

        const quantityAsNumber = Number(inputMatch.groups.itemQuantity) || 0;

        if (objectMatch) {
          objectMatch += isNaN(quantityAsNumber) ? 0 : quantityAsNumber;
        } else {
          returnObject[inputMatch.groups.itemName] = isNaN(quantityAsNumber)
            ? 0
            : quantityAsNumber;
        }
      });
      return returnObject;
    } catch (err) {
      console.error(err.message);
      return {};
    }
  }

  async function writeTextToClipboard(inputTextString) {
    try {
      await navigator.clipboard.writeText(inputTextString);
      sendSnackbarNotificationSuccess(`Successfully Copied`, 1);
    } catch (err) {
      console.error(err.message);
      sendSnackbarNotificationError(`Error Copying Text To Clipboard`);
    }
  }

  async function readTextFromClipboard() {
    try {
      return await navigator.clipboard.readText();
    } catch (err) {
      console.error(err.message);
      sendSnackbarNotificationError(`Error Reading Text From Clipboard`);
      return null;
    }
  }

  function checkDisplayTutorials() {
    if (!isLoggedIn) return true;
    const tutorialsAreHidden = applicationSettings.hideTutorials;

    if (tutorialsAreHidden) return false;

    return true;
  }

  function sendSnackbarNotificationSuccess(
    messageText = "",
    durationInSeconds = 1
  ) {
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: messageText,
      severity: "success",
      autoHideDuration: durationInSeconds * 1000,
    }));
  }

  function sendSnackbarNotificationError(
    messageText = "",
    durationInSeconds = 1
  ) {
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: messageText,
      severity: "error",
      autoHideDuration: durationInSeconds * 1000,
    }));
  }

  function sendSnackbarNotificationWarning(
    messageText = "",
    durationInSeconds = 1
  ) {
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: messageText,
      severity: "warning",
      autoHideDuration: durationInSeconds * 1000,
    }));
  }

  function sendSnackbarNotificationInfo(
    messageText = "",
    durationInSeconds = 1
  ) {
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: messageText,
      severity: "info",
      autoHideDuration: durationInSeconds * 1000,
    }));
  }

  function getJobSetupCount(inputJob) {
    return Object.values(inputJob.build.setup).length;
  }

  function getJobCountFromJob(inputJob) {
    return Object.values(inputJob.build.setup).reduce((prev, { jobCount }) => {
      return (prev += jobCount);
    }, 0);
  }

  function getTotalCompleteMaterialsFromJob(inputJob) {
    return inputJob.build.materials.reduce((prev, material) => {
      if (material.purchaseComplete) {
        return prev++;
      }
    }, 0);
  }

  return {
    Add_RemovePendingChildJobs,
    Add_RemovePendingParentJobs,
    checkClipboardReadPermissions,
    checkDisplayTutorials,
    findItemPriceObject,
    findParentUser,
    findParentUserIndex,
    findUniverseItemObject,
    getJobSetupCount,
    getJobCountFromJob,
    getTotalCompleteMaterialsFromJob,
    importAssetsFromClipboard_IconView,
    importMultibuyFromClipboard,
    isItemBuildable,
    readTextFromClipboard,
    sendSnackbarNotificationSuccess,
    sendSnackbarNotificationError,
    sendSnackbarNotificationWarning,
    sendSnackbarNotificationInfo,
    writeTextToClipboard,
  };
}
