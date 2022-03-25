import { useContext, useState } from "react";
import { UsersContext } from "../../../Context/AuthContext";
import { ApiJobsContext } from "../../../Context/JobContext";
import { useEveApi } from "../../../Hooks/useEveApi";
import { useRefreshUser } from "../../../Hooks/useRefreshUser";
import { Tooltip, IconButton } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import TimerIcon from "@mui/icons-material/Timer";
import { RefreshStateContext } from "../../../Context/LayoutContext";

export function RefreshApiIcon() {
  const { users, updateUsers } = useContext(UsersContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const {
    CharacterSkills,
    IndustryJobs,
    MarketOrders,
    HistoricMarketOrders,
    BlueprintLibrary,
    WalletTransactions,
    WalletJournal,
    serverStatus,
  } = useEveApi();
  const { RefreshUserAToken } = useRefreshUser();
  const { refreshState, updateRefreshState } = useContext(RefreshStateContext);

  const parentUser = users.find((i) => i.ParentUser);

  const refreshAPIData = async () => {
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
        ] = await Promise.all([
          CharacterSkills(user),
          IndustryJobs(user, parentUser),
          MarketOrders(user),
          HistoricMarketOrders(user),
          BlueprintLibrary(user),
          WalletTransactions(user),
          WalletJournal(user),
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
      }
    }

    newAPIArray.sort((a, b) => {
      if (a.product_name < b.product_name) {
        return -1;
      }
      if (a.product_name > b.product_name) {
        return 1;
      }
      return 0;
    });

    updateUsers(newUsers);
    updateApiJobs(newAPIArray);
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
