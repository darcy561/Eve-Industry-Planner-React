import { useContext, useState } from "react";
import { UsersContext } from "../../../Context/AuthContext";
import { ApiJobsContext } from "../../../Context/JobContext";
import { useEveApi } from "../../../Hooks/useEveApi";
import { useRefreshUser } from "../../../Hooks/useRefreshUser";
import { Tooltip, IconButton } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import TimerIcon from "@mui/icons-material/Timer";

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
  } = useEveApi();
  const { RefreshUserAToken } = useRefreshUser();
  const [refreshState, updateRefreshState] = useState(1);

  const refreshAPIData = async () => {
    let newUsers = [...users];
    let newAPIArray = [];
    updateRefreshState(2);
    for (let user of newUsers) {
      if (user.aTokenEXP <= Math.floor(Date.now() / 1000)) {
        user = await RefreshUserAToken(user);
      }
      const NewApiSkills = await CharacterSkills(user);
      if (NewApiSkills.length > 0) {
        user.apiSkills = NewApiSkills;
      }
      const NewApiJobs = await IndustryJobs(user);
      if (NewApiJobs.length > 0) {
        user.apiJobs = NewApiJobs;
        user.apiJobs.forEach((i) => newAPIArray.push(i));
      }
      const NewApiOrders = await MarketOrders(user);
      if (NewApiOrders.length > 0) {
        user.apiOrders = NewApiOrders;
      }
      const NewApiHistOrders = await HistoricMarketOrders(user);
      if (NewApiHistOrders.length > 0) {
        user.apiHistOrders = NewApiHistOrders;
      }
      const NewApiBlueprints = await BlueprintLibrary(user);
      if (NewApiBlueprints.length > 0) {
        user.apiBlueprints = NewApiBlueprints;
      }
      const NewApiTransactions = await WalletTransactions(user);
      if (NewApiTransactions.length > 0) {
        user.apiTransactions = NewApiTransactions;
      }
      const NewApiJournal = await WalletJournal(user);
      if (NewApiJournal.length > 0) {
        user.apiJournal = NewApiJournal;
      }
    }

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
