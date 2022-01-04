import { Avatar, Box, Grid, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { useContext, useState } from "react";
import {
  IsLoggedInContext,
  MainUserContext,
  UsersContext,
} from "../../../Context/AuthContext";
import {
  ActiveJobContext,
  ApiJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../../../Context/JobContext";
import { SnackBarDataContext } from "../../../Context/LayoutContext";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { auth } from "../../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router";

export function UserIcon() {
  const { updateUsers } = useContext(UsersContext);
  const { mainUser, updateMainUser } = useContext(MainUserContext);
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
    updateUsers([]);
    updateMainUser({});
    updateJobArray([]);
    setJobStatus([
      {
        id: 0,
        name: "Planning",
        sortOrder: 0,
        expanded: true,
        openAPIJobs: false,
        completeAPIJobs: false,
      },
      {
        id: 1,
        name: "Purchasing",
        sortOrder: 1,
        expanded: true,
        openAPIJobs: false,
        completeAPIJobs: false,
      },
      {
        id: 2,
        name: "Building",
        sortOrder: 2,
        expanded: true,
        openAPIJobs: true,
        completeAPIJobs: false,
      },
      {
        id: 3,
        name: "Complete",
        sortOrder: 3,
        expanded: true,
        openAPIJobs: false,
        completeAPIJobs: true,
      },
      {
        id: 4,
        name: "For Sale",
        sortOrder: 4,
        expanded: true,
        openAPIJobs: false,
        completeAPIJobs: false,
      },
    ]);
    updateActiveJob({});
    updateApiJobs([]);
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

    return (
      <>
        <Box>
          <Grid container direction="column">
            <Grid item align="center">
              <Tooltip title="Account" arrow>
              <Avatar
                alt="Account Logo"
                src={`https://images.evetech.net/characters/${mainUser.CharacterID}/portrait`}
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
