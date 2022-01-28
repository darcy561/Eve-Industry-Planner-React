import { Avatar, Box, Grid, Menu, MenuItem, Tooltip } from "@mui/material";
import { useContext, useState } from "react";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../Context/AuthContext";
import {
  ActiveJobContext,
  ApiJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../../../Context/JobContext";
import { SnackBarDataContext } from "../../../Context/LayoutContext";
import { EveIDsContext } from "../../../Context/EveDataContext";
import { analytics, auth } from "../../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router";
import { apiJobsDefault, jobArrayDefault, jobStatusDefault, usersDefault, eveIDsDefault } from "../../../Context/defaultValues";
import { getAnalytics, logEvent } from "firebase/analytics";

export function UserIcon() {
  const { users, updateUsers } = useContext(UsersContext);
  const [anchor, setAnchor] = useState(null);
  const { updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { setJobStatus } = useContext(JobStatusContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const {updateEveIDs} =useContext(EveIDsContext)
  const navigate = useNavigate();
  const analytics = getAnalytics();

  const parentUser = users.find((i) => i.ParentUser === true)

  function logout() {
    logEvent(analytics, "userLogOut", {
      UID: parentUser.accountID
    })
    updateIsLoggedIn(false);
    updateUsers(usersDefault);
    updateJobArray(jobArrayDefault);
    updateEveIDs(eveIDsDefault);
    setJobStatus(jobStatusDefault);
    updateActiveJob({});
    updateApiJobs(apiJobsDefault);
    localStorage.removeItem("Auth");
    signOut(auth);
    navigate("/");
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: "Logged Out",
      severity: "info",
      autoHideDuration: 3000,
    }));
  }

  const openMenu = (event) => {
    setAnchor(event.currentTarget);
  };
  const closeMenu = () => {
    setAnchor(null);
  };

  

    return (
      <>
        <Box>
          <Grid container direction="column">
            <Grid item align="center">
              <Tooltip title="Account" arrow>
              <Avatar
                alt="Account Logo"
                src={`https://images.evetech.net/characters/${parentUser.CharacterID}/portrait`}
                onClick={openMenu}
                sx={{
                  height: { xs: "36px", sm:"48px" },
                  width: { xs: "36px", sm: "48px" },
                  marginRight: { sm: "20px"}
                }}
                />
                </Tooltip>
            </Grid>
          </Grid>
        </Box>

        <Menu
          id="userMenu"
          anchorEl={anchor}
          keepMounted
          open={Boolean(anchor)}
          onClose={closeMenu}
          onClick={closeMenu}
        >
          {/* <MenuItem
            disabled
            onClick={() => {
              navigate("/accounts");
            }}
          >
            Accounts
          </MenuItem>
          <MenuItem
            disabled
            onClick={() => {
              navigate("/settings");
            }}
          >
            Settings
          </MenuItem> */}
          <MenuItem onClick={logout}>Log Out</MenuItem>
        </Menu>
      </>
    );
}
