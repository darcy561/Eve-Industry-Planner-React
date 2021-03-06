import { Avatar, Grid, IconButton, Paper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import TimerIcon from "@mui/icons-material/Timer";
import { useContext, useState } from "react";
import {
  RefreshStateContext,
  SnackBarDataContext,
} from "../../Context/LayoutContext";
import { useEveApi } from "../../Hooks/useEveApi";
import { UsersContext } from "../../Context/AuthContext";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { ApiJobsContext, JobArrayContext } from "../../Context/JobContext";
import { useFirebase } from "../../Hooks/useFirebase";
import { useJobManagement } from "../../Hooks/useJobManagement";
import { getAnalytics, logEvent } from "firebase/analytics";

export function AccountEntry({ user, parentUserIndex }) {
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
  const { downloadCharacterJobs, updateMainUserDoc } = useFirebase();
  const { replaceSnapshot } = useJobManagement();
  const { RefreshUserAToken } = useRefreshUser();
  const { users, updateUsers } = useContext(UsersContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { refreshState } = useContext(RefreshStateContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const [userRefreshState, updateUserRefreshState] = useState(
    user.refreshState
  );
  const analytics = getAnalytics();

  const parentUser = users.find((i) => i.ParentUser);

  async function refreshUserAPI(user) {
    let newUsers = [...users];
    let newAPIArray = [];
    updateUserRefreshState(2);
    user.refreshState = 2;
    const sStatus = await serverStatus();
    if (sStatus) {
      if (user.aTokenEXP <= Math.floor(Date.now() / 1000)) {
        user = await RefreshUserAToken(user);
      }
      if (user !== "RefreshFail") {
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
          newAPIArray = apiJobs.filter(
            (i) => i.installer_id !== user.CharacterID
          );
          user.apiJobs.forEach((i) => newAPIArray.push(i));
          newAPIArray.sort((a, b) => {
            if (a.product_name < b.product_name) {
              return -1;
            }
            if (a.product_name > b.product_name) {
              return 1;
            }
            return 0;
          });
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
        user.refreshState = 3;
        const index = newUsers.findIndex(
          (i) => i.CharacterHash === user.CharacterHash
        );
        if (index !== -1) {
          newUsers[index] = user;
        }
        updateUsers(newUsers);
        updateApiJobs(newAPIArray);
        updateUserRefreshState(3);

        setTimeout(() => {
          user.refreshState = 1;
        }, 900000);
        //15 mins
      }
    }
  }

  async function removeUser(user) {
    let newJobArray = [...jobArray];
    for (let job of newJobArray) {
      if (job.isSnapshot) {
        job = await downloadCharacterJobs(job);
        job.isSnapshot = false;
        replaceSnapshot(job);
      }
      if (job.build.buildChar === user.CharacterHash) {
        job.build.buildChar = parentUser.CharacterHash;
      }
    }
    let newApiArray = apiJobs.filter(
      (i) => i.installer_id !== user.CharacterID
    );
    let newUsers = [...users];
    for (let nUser of newUsers) {
      if (nUser.ParentUser) {
        if (nUser.settings.account.cloudAccounts) {
          nUser.accountRefreshTokens = nUser.accountRefreshTokens.filter(
            (i) => i.CharacterHash !== user.CharacterHash
          );
        } else {
          let oldLS = JSON.parse(localStorage.getItem("AdditionalAccounts"));
          let newLS = oldLS.filter(
            (i) => i.CharacterHash !== user.CharacterHash
          );
          localStorage.setItem("AdditionalAccounts", JSON.stringify(newLS));
        }
      }
    }

    newUsers = newUsers.filter((i) => i.CharacterHash !== user.CharacterHash);
    updateUsers(newUsers);
    updateApiJobs(newApiArray);
    updateJobArray(newJobArray);
    if (parentUser.settings.account.cloudAccounts) {
      updateMainUserDoc();
    }
    logEvent(analytics, "Remove Link Character", {
      UID: users[parentUserIndex].accountID,
      RemovedHash: user.CharacterHash,
      cloudAccount: users[parentUserIndex].settings.account.cloudAccounts,
    });
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${user.CharacterName} Removed`,
      severity: "error",
      autoHideDuration: 1000,
    }));
  }

  return (
    <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
      <Paper elevation={3} square={true} sx={{ width: "100%" }}>
        <Grid
          container
          item
          xs={12}
          sx={{
            padding: "10px",
          }}
          direction="row"
          justifyContent="center"
          alignItems="center"
        >
          <Grid item xs={2} sm={1}>
            <Avatar
              alt={`${user.CharacterName} portrait`}
              src={`https://images.evetech.net/characters/${user.CharacterID}/portrait`}
            />
          </Grid>
          <Grid item xs={8} sm={9}>
            <Typography variant="body1">{user.CharacterName}</Typography>
          </Grid>
          <Grid item xs={1} align="center">
            {refreshState === 1 && userRefreshState === 1 ? (
              <IconButton color="primary" onClick={() => refreshUserAPI(user)}>
                <AutorenewIcon />
              </IconButton>
            ) : null}
            {refreshState === 2 || userRefreshState === 2 ? (
              <IconButton disableRipple color="secondary">
                <SyncAltIcon />
              </IconButton>
            ) : null}
            {refreshState === 3 || userRefreshState === 3 ? (
              <IconButton disableRipple color="secondary">
                <TimerIcon />
              </IconButton>
            ) : null}
          </Grid>
          <Grid item xs={1} align="center">
            <IconButton
              color="error"
              onClick={() => {
                removeUser(user);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
