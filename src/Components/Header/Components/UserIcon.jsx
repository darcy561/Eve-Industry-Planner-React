import { Avatar, Box, Grid, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
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
import { auth } from "../../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router";
import {apiJobsDefault, jobArrayDefault, jobStatusDefault, usersDefault } from "../../../Context/defaultValues";

export function UserIcon() {
  const { users, updateUsers } = useContext(UsersContext);
  const [anchor, setAnchor] = useState(null);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { setJobStatus } = useContext(JobStatusContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const navigate = useNavigate();

  function logout() {
    updateIsLoggedIn(false);
    updateUsers(usersDefault);
    updateJobArray(jobArrayDefault);
    setJobStatus(jobStatusDefault);
    updateActiveJob({});
    updateApiJobs(apiJobsDefault);
    sessionStorage.clear();
    localStorage.clear();
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

  const parentUser = users.find((i) => i.ParentUser === true)

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
          <MenuItem
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
          </MenuItem>
          <MenuItem onClick={logout}>Log Out</MenuItem>
        </Menu>
      </>
    );
}
