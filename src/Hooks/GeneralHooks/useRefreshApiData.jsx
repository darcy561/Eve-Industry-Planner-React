import { useContext, useMemo } from "react";
import { logEvent } from "firebase/analytics";
import { analytics, functions } from "../../firebase";
import { UsersContext } from "../../Context/AuthContext";
import { httpsCallable } from "firebase/functions";
import {
  DialogDataContext,
  RefreshStateContext,
} from "../../Context/LayoutContext";
import { useRefreshUser } from "../useRefreshUser";
import { useAccountManagement } from "../useAccountManagement";
import { useFirebase } from "../useFirebase";
import {
  CorpEsiDataContext,
  EveIDsContext,
  EvePricesContext,
  PersonalESIDataContext,
  SystemIndexContext,
} from "../../Context/EveDataContext";
import searchData from "../../RawData/searchIndex.json";
import { ApiJobsContext } from "../../Context/JobContext";
import { useSystemIndexFunctions } from "./useSystemIndexFunctions";
import { useEveApi } from "../useEveApi";

export function useRefreshApiData() {
  const { users, updateUsers } = useContext(UsersContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { updateSystemIndexData } = useContext(SystemIndexContext);
  const { esiIndJobs, esiOrders, esiHistOrders } = useContext(
    PersonalESIDataContext
  );
  const { corpEsiIndJobs, corpEsiOrders, corpEsiHistOrders } =
    useContext(CorpEsiDataContext);
  const { updateRefreshState } = useContext(RefreshStateContext);
  const { refreshUserAToken } = useRefreshUser();
  const {
    buildApiArray,
    characterAPICall,
    checkUserClaims,
    getCharacterInfo,
    storeCorpObjects,
    storeESIData,
  } = useAccountManagement();
  const { refreshItemPrices } = useFirebase();
  const { fetchUniverseNames } = useEveApi();
  const { refreshSystemIndexes } = useSystemIndexFunctions();

  const checkAppVersion = httpsCallable(
    functions,
    "checkAppVersion-checkAppVersion"
  );
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  async function refreshApiData(updateRefreshTrigger) {
    logEvent(analytics, "Refresh API Data", {
      UID: parentUser.accountID,
    });
    let newUserArray = [...users];
    let newEveIDs = {};

    const verifyApp = checkAppVersion({ appVersion: __APP_VERSION__ });
    updateRefreshState(2);
    const [appVersionPass] = await Promise.all([verifyApp]);
    if (!appVersionPass.data) {
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
    const userTokenRefreshPoint = Math.floor(Date.now() / 1000);

    for (let user of newUserArray) {
      if (user.aTokenEXP <= userTokenRefreshPoint) {
        user = await refreshUserAToken();
      }
      await getCharacterInfo(user);
      esiObjectsPromises.push(characterAPICall(user));
    }
    const esiObjectsArray = (await Promise.all(esiObjectsPromises)).flat();
    await storeESIData(esiObjectsArray);
    storeCorpObjects(esiObjectsArray);
    const itemPricePromise = refreshItemPrices(parentUser);
    const systemIndexPromise = refreshSystemIndexes();
    const newAPIArray = buildApiArray(newUserArray, esiObjectsArray);

    for (let user of newUserArray) {
      const requestIDs = new Set();
      const userIndJobs = esiIndJobs.find(
        (i) => i.user === user.CharacterHash
      )?.data;
      const userOrders = esiOrders.find(
        (i) => i.user === user.CharacterHash
      )?.data;
      const userHistOrders = esiHistOrders.find(
        (i) => i.user === user.CharacterHash
      )?.data;
      const corpIndJobs = corpEsiIndJobs.get(user.CharacterHash);
      const corpOrders = corpEsiOrders.find(
        (i) => i.user === user.CharacterHash
      )?.data;
      const corpHistOrders = corpEsiHistOrders.find(
        (i) => i.user === user.CharacterHash
      )?.data;

      [...userIndJobs, ...corpIndJobs].forEach(({ facility_id }) => {
        if (!facility_id) return;
        checkAndAddLocationID(facility_id, requestIDs);
      });
      [...userOrders, ...userHistOrders, ...corpOrders, corpHistOrders].forEach(
        ({ locaton_id, region_id }) => {
          if (!locaton_id || !region_id) return;
          checkAndAddLocationID(locaton_id, requestIDs);
          checkAndAddLocationID(region_id, requestIDs);
        }
      );
      const newLocationObjects = await fetchUniverseNames(
        [...requestIDs],
        user
      );
      newEveIDs = { ...newEveIDs, ...newLocationObjects };
    }

    checkUserClaims(newUserArray);

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
    updateUsers(newUserArray);
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
