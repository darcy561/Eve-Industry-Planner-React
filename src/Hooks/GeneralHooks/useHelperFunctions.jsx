import { useContext } from "react";
import { EveIDsContext, EvePricesContext } from "../../Context/EveDataContext";

export function useHelperFunction() {
  const { evePrices } = useContext(EvePricesContext);
  const { eveIDs } = useContext(EveIDsContext);

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

  function findUniverseItemObject(requestedID) {
    return eveIDs[requestedID];
  }

  return {
    Add_RemovePendingChildJobs,
    Add_RemovePendingParentJobs,
    findItemPriceObject,
    findUniverseItemObject,
  };
}
