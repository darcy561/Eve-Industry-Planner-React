import { useContext, useEffect, useMemo, useState } from "react";
import { UsersContext } from "../../../Context/AuthContext";
import { ApiJobsContext } from "../../../Context/JobContext";
import { useEveApi } from "../../../Hooks/useEveApi";
import { useRefreshUser } from "../../../Hooks/useRefreshUser";
import { Tooltip, IconButton } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import TimerIcon from "@mui/icons-material/Timer";
import {
  DialogDataContext,
  RefreshStateContext,
  UserLoginUIContext,
} from "../../../Context/LayoutContext";
import {
  CorpEsiDataContext,
  EveIDsContext,
  EvePricesContext,
  PersonalESIDataContext,
} from "../../../Context/EveDataContext";
import { useFirebase } from "../../../Hooks/useFirebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import searchData from "../../../RawData/searchIndex.json";
import { useAccountManagement } from "../../../Hooks/useAccountManagement";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../firebase";

export function RefreshApiIcon() {
  const { users, updateUsers } = useContext(UsersContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const { serverStatus, IDtoName } = useEveApi();
  const {
    buildApiArray,
    characterAPICall,
    checkUserClaims,
    getCharacterInfo,
    storeCorpObjects,
    storeESIData,
  } = useAccountManagement();
  const { refreshItemPrices } = useFirebase();
  const { RefreshUserAToken } = useRefreshUser();
  const { refreshState, updateRefreshState } = useContext(RefreshStateContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const [refreshTrigger, updateRefreshTrigger] = useState(false);
  const { updateDialogData } = useContext(DialogDataContext);
  const { esiIndJobs, esiOrders, esiHistOrders } = useContext(
    PersonalESIDataContext
  );
  const { corpEsiIndJobs, corpEsiOrders, corpEsiHistOrders } =
    useContext(CorpEsiDataContext);
  const { loginInProgressComplete } = useContext(UserLoginUIContext);
  const analytics = getAnalytics();
  const checkAppVersion = httpsCallable(
    functions,
    "checkAppVersion-checkAppVersion"
  );

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  useEffect(() => {
    const refreshAPIData = async () => {
      logEvent(analytics, "Refresh API Data", {
        UID: parentUser.accountID,
      });
      let newUsers = [...users];
      let newAPIArray = [];

      let verifyApp = [checkAppVersion({ appVersion: __APP_VERSION__ })];
      updateRefreshState(2);
      const sStatus = await serverStatus();
      let [appVersionPass] = await Promise.all(verifyApp);
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
      if (sStatus) {
        let esiObjectsArray = [];
        for (let user of newUsers) {
          if (user.aTokenEXP <= Math.floor(Date.now() / 1000)) {
            user = await RefreshUserAToken(user);
          }
          await getCharacterInfo(user);
          esiObjectsArray.push(await characterAPICall(user));
        }
        await storeESIData(esiObjectsArray);
        storeCorpObjects(esiObjectsArray);
        newAPIArray = buildApiArray(newUsers, esiObjectsArray);
      }
      let existingLocations = new Set();
      let locationIDS = new Set();
      let citadelStore = new Set();
      let newIDNamePromises = [];
      let newNameArray = [];

      for (let entry of eveIDs) {
        existingLocations.add(entry.id);
      }

      for (let user of newUsers) {
        let citadelIDs = new Set();
        let userJobs = esiIndJobs.find(
          (i) => i.user === user.CharacterHash
        )?.data;
        let userOrders = esiOrders.find(
          (i) => i.user === user.CharacterHash
        )?.data;
        let userHistOrders = esiHistOrders.find(
          (i) => i.user === user.CharacterHash
        )?.data;
        let corpJobs = corpEsiIndJobs.find(
          (i) => i.user === user.CharacterHash
        )?.data;
        let userCorpOrders = corpEsiOrders.find(
          (i) => i.user === user.CharacterHash
        )?.data;
        let userCorpHistOrders = corpEsiHistOrders.find(
          (i) => i.user === user.CharacterHash
        )?.data;

        const addLocation = (id) => {
          if (!existingLocations.has(id)) {
            locationIDS.add(id);
          }
        };

        const addCitadel = (id) => {
          if (!existingLocations.has(id) && !citadelIDs.has(id)) {
            citadelIDs.add(id);
          }
        };

        [...userJobs, ...corpJobs].forEach((job) => {
          if (job.facility_id.toString().length > 10) {
            if (!citadelStore.has(job.facility_id)) {
              citadelStore.add(job.facility_id);
              addCitadel(job.facility_id);
            }
          } else {
            addLocation(job.facility_id);
          }
        });

        [
          ...userOrders,
          ...userHistOrders,
          ...userCorpOrders,
          ...userCorpHistOrders,
        ].forEach((order) => {
          if (order.location_id.toString().length > 10) {
            if (!citadelStore.has(order.location_id)) {
              citadelStore.add(order.location_id);
              addCitadel(order.location_id);
            }
          } else {
            addLocation(order.location_id);
          }
          addLocation(order.region_id);
        });

        if ([...citadelIDs].length > 0) {
          let tempCit = IDtoName([...citadelIDs], user);
          newIDNamePromises.push(tempCit);
        }
      }
      if ([...locationIDS].length > 0) {
        let tempLoc = IDtoName([...locationIDS], parentUser);
        newIDNamePromises.push(tempLoc);
      }

      checkUserClaims(newUsers);
      let newEvePrices = await refreshItemPrices(parentUser);

      let returnLocations = await Promise.all(newIDNamePromises);

      returnLocations.forEach((group) => {
        newNameArray = newNameArray.concat(group);
      });

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

      updateEveIDs((prev) => prev.concat(newNameArray));
      updateUsers(newUsers);
      updateApiJobs(newAPIArray);
      updateEvePrices(newEvePrices);
      updateRefreshState(3);
      updateRefreshTrigger((prev) => !prev);
      setTimeout(() => {
        updateRefreshState(1);
      }, 900000);
      //15 mins
    };

    if (refreshTrigger) {
      refreshAPIData();
    }
  }, [refreshTrigger]);

  if (!loginInProgressComplete) {
    return null
  }

  if (refreshState === 1) {
    return (
      <Tooltip title="Refresh API Data" arrow>
        <IconButton
          color="inherit"
          onClick={() => {
            updateRefreshTrigger((prev) => !prev);
          }}
          sx={{ marginRight: "5px" }}
        >
          <AutorenewIcon />
        </IconButton>
      </Tooltip>
    );
  }
  if (refreshState === 2) {
    return (
      <Tooltip title="Refreshing API Data" arrow>
        <IconButton disableRipple color="inherit" sx={{ marginRight: "5px" }}>
          <SyncAltIcon />
        </IconButton>
      </Tooltip>
    );
  }

  if (refreshState === 3) {
    return (
      <Tooltip title="Next refresh available in 15 mins" arrow>
        <IconButton disableRipple color="inherit" sx={{ marginRight: "5px" }}>
          <TimerIcon />
        </IconButton>
      </Tooltip>
    );
  }
}
