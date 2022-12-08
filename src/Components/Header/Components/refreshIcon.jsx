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
} from "../../../Context/LayoutContext";
import {
  EveIDsContext,
  EvePricesContext,
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
  const { characterAPICall, checkUserClaims } = useAccountManagement();
  const { refreshItemPrices } = useFirebase();
  const { RefreshUserAToken } = useRefreshUser();
  const { refreshState, updateRefreshState } = useContext(RefreshStateContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const [refreshTrigger, updateRefreshTrigger] = useState(false);
  const { updateDialogData } = useContext(DialogDataContext);
  const analytics = getAnalytics();
  const checkAppVersion = httpsCallable(
    functions,
    "appVersion-checkAppVersion"
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
        for (let user of newUsers) {
          if (user.aTokenEXP <= Math.floor(Date.now() / 1000)) {
            user = await RefreshUserAToken(user);
          }
          user = await characterAPICall(sStatus, user);
          JSON.parse(
            sessionStorage.getItem(`esiJobs_${user.CharacterHash}`)
          ).forEach((i) => newAPIArray.push(i));
        }
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
        JSON.parse(
          sessionStorage.getItem(`esiJobs_${user.CharacterHash}`)
        ).forEach((job) => {
          if (job.facility_id.toString().length > 10) {
            if (
              !existingLocations.has(job.facility_id) &&
              !citadelStore.has(job.facility_id)
            ) {
              citadelIDs.add(job.facility_id);
              citadelStore.add(job.facility_id);
            }
          } else {
            if (!existingLocations.has(job.facility_id)) {
              locationIDS.add(job.facility_id);
            }
          }
        });
        JSON.parse(
          sessionStorage.getItem(`esiOrders_${user.CharacterHash}`)
        ).forEach((order) => {
          if (order.location_id.toString().length > 10) {
            if (
              !existingLocations.has(order.location_id) &&
              !citadelStore.has(order.location_id)
            ) {
              citadelIDs.add(order.location_id);
              citadelStore.add(order.location_id);
            }
          } else {
            if (!existingLocations.has(order.location_id)) {
              locationIDS.add(order.location_id);
            }
          }
          if (!existingLocations.has(order.region_id)) {
            locationIDS.add(order.region_id);
          }
        });
        JSON.parse(
          sessionStorage.getItem(`esiHistOrders_${user.CharacterHash}`)
        ).forEach((order) => {
          if (order.location_id.toString().length > 10) {
            if (
              !existingLocations.has(order.location_id) &&
              !citadelStore.has(order.location_id)
            ) {
              citadelIDs.add(order.location_id);
              citadelStore.add(order.location_id);
            }
          } else {
            if (!existingLocations.has(order.location_id)) {
              locationIDS.add(order.location_id);
            }
          }
          if (!existingLocations.has(order.region_id)) {
            locationIDS.add(order.region_id);
          }
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
        let aName = searchData.find(
          (i) =>
            i.itemID === a.product_type_id ||
            i.blueprintID === a.blueprint_type_id
        );
        let bName = searchData.find(
          (i) =>
            i.itemID === b.product_type_id ||
            i.blueprintID === b.blueprint_type_id
        );
        if (aName.name < bName.name) {
          return -1;
        }
        if (aName.name > bName.name) {
          return 1;
        }
        return 0;
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
