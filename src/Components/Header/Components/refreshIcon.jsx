import { useContext } from "react";
import { UsersContext } from "../../../Context/AuthContext";
import { ApiJobsContext } from "../../../Context/JobContext";
import { useEveApi } from "../../../Hooks/useEveApi";
import { useRefreshUser } from "../../../Hooks/useRefreshUser";
import { Tooltip, IconButton } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import TimerIcon from "@mui/icons-material/Timer";
import { RefreshStateContext } from "../../../Context/LayoutContext";
import {
  EveIDsContext,
  EvePricesContext,
} from "../../../Context/EveDataContext";
import { useFirebase } from "../../../Hooks/useFirebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import searchData from "../../../RawData/searchIndex.json";

export function RefreshApiIcon() {
  const { users, updateUsers } = useContext(UsersContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const {
    CharacterSkills,
    IndustryJobs,
    MarketOrders,
    HistoricMarketOrders,
    BlueprintLibrary,
    WalletTransactions,
    WalletJournal,
    serverStatus,
    IDtoName,
    fullAssetsList,
  } = useEveApi();
  const { refreshItemPrices } = useFirebase();
  const { RefreshUserAToken } = useRefreshUser();
  const { refreshState, updateRefreshState } = useContext(RefreshStateContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const analytics = getAnalytics();

  const parentUser = users.find((i) => i.ParentUser);

  const refreshAPIData = async () => {
    logEvent(analytics, "Refresh API Data", {
      UID: parentUser.accountID,
    });
    let newUsers = [...users];
    let newAPIArray = [];
    updateRefreshState(2);
    const sStatus = await serverStatus();
    if (sStatus) {
      for (let user of newUsers) {
        if (user.aTokenEXP <= Math.floor(Date.now() / 1000)) {
          user = await RefreshUserAToken(user);
        }

        const [
          skills,
          indJobs,
          orders,
          histOrders,
          blueprints,
          transactions,
          journal,
          assets,
        ] = await Promise.all([
          CharacterSkills(user),
          IndustryJobs(user, parentUser),
          MarketOrders(user),
          HistoricMarketOrders(user),
          BlueprintLibrary(user),
          WalletTransactions(user),
          WalletJournal(user),
          fullAssetsList(user),
        ]);
        if (skills.length > 0) {
          user.apiSkills = skills;
        }
        if (indJobs.length > 0) {
          user.apiJobs = indJobs;
          user.apiJobs.forEach((i) => newAPIArray.push(i));
        }
        if (orders.length > 0) {
          user.apiOrders = orders;
        }
        if (histOrders.length > 0) {
          user.apiHistOrders = histOrders;
        }
        if (blueprints.length > 0) {
          user.apiBlueprints = blueprints;
        }
        if (transactions.length > 0) {
          user.apiTransactions = transactions;
        }
        if (journal.length > 0) {
          user.apiJournal = journal;
        }
        if (assets.length > 0) {
          sessionStorage.setItem(
            `assets_${user.CharacterHash}`,
            JSON.stringify(assets)
          );
        }
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
      user.apiJobs.forEach((job) => {
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
      user.apiOrders.forEach((order) => {
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
      user.apiHistOrders.forEach((order) => {
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
    setTimeout(() => {
      updateRefreshState(1);
    }, 900000);
    //15 mins
  };

  if (refreshState === 1) {
    return (
      <Tooltip title="Refresh API Data" arrow>
        <IconButton
          color="inherit"
          onClick={refreshAPIData}
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
