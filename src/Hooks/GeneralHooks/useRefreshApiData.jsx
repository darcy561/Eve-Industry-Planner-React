import { useContext } from "react";
import { logEvent } from "firebase/analytics";
import { analytics } from "../../firebase";
import { UsersContext } from "../../Context/AuthContext";
import {
  DialogDataContext,
  RefreshStateContext,
} from "../../Context/LayoutContext";
import { useAccountManagement } from "../useAccountManagement";
import { useFirebase } from "../useFirebase";
import {
  EveIDsContext,
  EvePricesContext,
  SystemIndexContext,
} from "../../Context/EveDataContext";
import searchData from "../../RawData/searchIndex.json";
import { ApiJobsContext } from "../../Context/JobContext";
import { useSystemIndexFunctions } from "./useSystemIndexFunctions";
import { useCorporationObject } from "../Account Management Hooks/Corporation Objects/useCorporationObject";
import { useHelperFunction } from "./useHelperFunctions";
import useCheckGlobalAppVersion from "./useCheckGlobalAppVersion";
import getUniverseNames from "../../Functions/EveESI/World/getUniverseNames";

export function useRefreshApiData() {
  const { users } = useContext(UsersContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { updateSystemIndexData } = useContext(SystemIndexContext);
  const { updateRefreshState } = useContext(RefreshStateContext);
  const { buildApiArray, checkUserClaims, storeESIData } =
    useAccountManagement();
  const { refreshItemPrices } = useFirebase();
  const { refreshSystemIndexes } = useSystemIndexFunctions();
  const { updateCorporationObject } = useCorporationObject();
  const { findParentUser } = useHelperFunction();

  const parentUser = findParentUser();

  async function refreshApiData(updateRefreshTrigger) {
    logEvent(analytics, "Refresh API Data", {
      UID: parentUser.accountID,
    });

    let newEveIDs = {};
    updateRefreshState(2);
    if (!useCheckGlobalAppVersion) {
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "OutdatedAppVersion",
        open: true,
        title: "Outdated App Version",
        body: "A newer version of the application is available, refresh the page to begin using this.",
      }));
      updateRefreshState(1);
      return;
    }
    const esiObjectsPromises = [];

    for (let user of users) {
      await user.refreshAccessToken();
      await user.getPublicCharacterData();
      esiObjectsPromises.push(user.getCharacterESIData());
    }

    const esiObjectsArray = (await Promise.all(esiObjectsPromises)).flat();
    await storeESIData(esiObjectsArray);
    updateCorporationObject(esiObjectsArray);
    const itemPricePromise = refreshItemPrices(parentUser);
    const systemIndexPromise = refreshSystemIndexes();
    const newAPIArray = buildApiArray(users, esiObjectsArray);

    for (let esiObject of esiObjectsArray) {
      const requestIDs = new Set();
      const {
        esiJobs,
        esiOrders,
        esiHistOrders,
        esiCorpJobs,
        esiCorpMOrders,
        esiCorpHistMOrders,
      } = esiObject;
      const user = users.find((i) => i.CharacterHash === i.owner);

      [...esiJobs, ...esiCorpJobs].forEach(({ facility_id }) => {
        if (!facility_id) return;
        checkAndAddLocationID(facility_id, requestIDs);
      });
      [
        ...esiOrders,
        ...esiHistOrders,
        ...esiCorpMOrders,
        ...esiCorpHistMOrders,
      ].forEach(({ locaton_id, region_id }) => {
        if (!locaton_id || !region_id) return;
        checkAndAddLocationID(locaton_id, requestIDs);
        checkAndAddLocationID(region_id, requestIDs);
      });
      const newLocationObjects = await getUniverseNames(requestIDs, user);
      newEveIDs = { ...newEveIDs, ...newLocationObjects };
    }

    checkUserClaims(users);

    newAPIArray.sort((a, b) => {
      const getItemName = (itemId, blueprintId) => {
        const item = searchData.find(
          (i) => i.itemID === itemId || i.blueprintID === blueprintId
        );
        return item ? item.name : "";
      };

      const aName = getItemName(a.product_type_id, a.blueprint_type_id);
      const bName = getItemName(b.product_type_id, b.blueprint_type_id);

      return aName.localeCompare(bName);
    });

    const itemPriceResult = (await Promise.all([itemPricePromise])).flat();
    const systemIndexResult = (await Promise.all([systemIndexPromise])).flat();

    updateEveIDs((prev) => ({ ...prev, ...newEveIDs }));
    updateApiJobs(newAPIArray);
    updateEvePrices((prev) => ({
      ...prev,
      ...itemPriceResult,
    }));
    updateSystemIndexData((prev) => ({
      ...prev,
      ...systemIndexResult,
    }));
    updateRefreshState(3);
    updateRefreshTrigger((prev) => !prev);
    setTimeout(() => {
      updateRefreshState(1);
    }, 900000);
    //15 mins

    function checkAndAddLocationID(requestedID, requestSet) {
      if (!requestedID) return;

      if (!eveIDs[requestedID] && !newEveIDs[requestedID]) {
        requestSet.add(requestedID);
      }
    }
  }

  return {
    refreshApiData,
  };
}
