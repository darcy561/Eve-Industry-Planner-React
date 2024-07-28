import { Avatar, Grid, IconButton, Paper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import TimerIcon from "@mui/icons-material/Timer";
import { useContext, useState } from "react";
import {
  ApplicationSettingsContext,
  RefreshStateContext,
} from "../../Context/LayoutContext";
import { useEveApi } from "../../Hooks/useEveApi";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../Context/AuthContext";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { ApiJobsContext, JobArrayContext } from "../../Context/JobContext";
import { useFirebase } from "../../Hooks/useFirebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import { useAccountManagement } from "../../Hooks/useAccountManagement";
import { useFindJobObject } from "../../Hooks/GeneralHooks/useFindJobObject";
import { useCorporationObject } from "../../Hooks/Account Management Hooks/Corporation Objects/useCorporationObject";
import { useHelperFunction } from "../../Hooks/GeneralHooks/useHelperFunctions";

export function AccountEntry({ user, parentUserIndex }) {
  const { serverStatus } = useEveApi();
  const { uploadUserJobSnapshot, updateMainUserDoc } = useFirebase();
  const {
    checkUserClaims,
    removeUserEsiData,
    updateApiArray,
    updateUserEsiData,
  } = useAccountManagement();
  const { findJobData } = useFindJobObject();
  const { RefreshUserAToken } = useRefreshUser();
  const { users, updateUsers } = useContext(UsersContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { refreshState } = useContext(RefreshStateContext);
  const { applicationSettings } = useContext(ApplicationSettingsContext);
  const [userRefreshState, updateUserRefreshState] = useState(
    user.refreshState
  );
  const { removeCorporationObject } = useCorporationObject();
  const analytics = getAnalytics();
  const { findParentUser, sendSnackbarNotificationError } = useHelperFunction();

  const parentUser = findParentUser();

  async function refreshUserAPI() {
    let newUsers = [...users];
    let newApiArray = [...apiJobs];
    let esiObjectsArray = [];
    const sStatus = await serverStatus();
    if (!sStatus) return;
    const refreshSuccess = await user.refreshAccessToken();
    updateUserRefreshState(2);
    if (!refreshSuccess) return;
    await user.getPublicCharacterData();
    esiObjectsArray.push(await user.getCharacterESIData());
    updateUserEsiData(esiObjectsArray);
    user.setRefreshState(3);
    newApiArray = updateApiArray(newApiArray, newUsers, esiObjectsArray);
    updateUsers(newUsers);
    updateApiJobs(newApiArray);
    updateUserRefreshState(3);

    setTimeout(() => {
      user.setRefreshState(1);
    }, 900000);
    //15 mins
  }

  async function removeUser(user) {
    const newUsers = users.filter(
      (i) => i.CharacterHash !== user.CharacterHash
    );
    const newApiArray = apiJobs.filter(
      (i) => i.installer_id !== user.CharacterID
    );

    parentUser.removeRefreshToken(
      user.CharacterHash,
      applicationSettings.cloudAccounts
    );

    removeUserEsiData(user);
    removeCorporationObject(user);
    await checkUserClaims(newUsers);
    updateUsers(newUsers);
    updateApiJobs(newApiArray);
    if (applicationSettings.cloudAccounts) {
      updateMainUserDoc();
    }
    logEvent(analytics, "Remove Link Character", {
      UID: users[parentUserIndex].accountID,
      RemovedHash: user.CharacterHash,
      cloudAccount: applicationSettings.cloudAccounts,
    });
    sendSnackbarNotificationError(`${user.CharacterName} Removed`);
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
            <Typography sx={{ typography: { xs: "caption", sm: "body1" } }}>
              {user.CharacterName}
            </Typography>
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
