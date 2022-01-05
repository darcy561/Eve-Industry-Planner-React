import { useContext, useState } from "react";
import { login } from "../Auth/MainUserAuth";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  Tooltip,
  IconButton,
} from "@mui/material";
import { SideMenu } from "./Components/sidemenu";
import MenuIcon from "@mui/icons-material/Menu";
import { UserIcon } from "./Components/UserIcon";
import {
  IsLoggedInContext,
  MainUserContext,
  UsersContext,
} from "../../Context/AuthContext";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { useEveApi } from "../../Hooks/useEveApi";

export function Header({ mode, colorMode }) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { mainUser, updateMainUser } = useContext(MainUserContext);
  const { RefreshUserAToken } = useRefreshUser();
  const {
    CharacterSkills,
    IndustryJobs,
    MarketOrders,
    HistoricMarketOrders,
    BlueprintLibrary,
    WalletTransactions,
    WalletJournal,
  } = useEveApi();

  const [open, setOpen] = useState(false);

  const refreshAPIData = async () => {
    let newUsers = users
    
    for (let user of newUsers) {
      console.log(user.aTokenEXP);
      console.log(Math.floor(Date.now() / 1000))
      if (user.aTokenEXP <= Math.floor(Date.now() / 1000)) {
        user = await RefreshUserAToken(user);
      }
        console.log(user);
        user.apiSkills = await CharacterSkills(user);
        user.apiJobs = await IndustryJobs(user);
        user.apiOrders = await MarketOrders(user);
        user.apiHistOrders = await HistoricMarketOrders(user);
        user.apiBlueprints = await BlueprintLibrary(user);
        user.apiTransactions = await WalletTransactions(user);
        user.apiJournal = await WalletJournal(user);
      }
    
    let newMainUser = newUsers.find((item) => item.ParentUser === true);

    updateMainUser(newMainUser);
    updateUsers(newUsers)

    };


  return (
    <>
      <AppBar position="static">
        <Toolbar
          sx={{
            paddingLeft: { xs: "8px", sm: "16px" },
            paddingRight: { xs: "4px", sm: "8px" },
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => {
              setOpen(true);
            }}
          >
            <MenuIcon />
          </IconButton>
          <SideMenu open={open} setOpen={setOpen} />
          <Typography
            align="center"
            variant="h5"
            sx={{ flexGrow: "1", display: { xs: "none", sm: "flex" } }}
          >
            Eve Industry Planner
          </Typography>
          {isLoggedIn ? (
            <Typography
              align="center"
              variant="h6"
              sx={{ flexGrow: "1", display: { xs: "flex", sm: "none" } }}
            >
              Eve Industry Planner
            </Typography>
          ) : (
            <Typography
              align="center"
              variant="subtitle2"
              sx={{ flexGrow: "1", display: { xs: "flex", sm: "none" } }}
            >
              Eve Industry Planner
            </Typography>
          )}

          {mode === "light" ? (
            <Tooltip title="Toggle Light/Dark Theme" arrow>
              <IconButton
                color="inherit"
                onClick={() => {
                  colorMode.toggleColorMode();
                  localStorage.setItem("theme", "dark");
                }}
              >
                <DarkModeIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Toggle Light/Dark Theme" arrow>
              <IconButton
                color="inherit"
                onClick={() => {
                  colorMode.toggleColorMode();
                  localStorage.setItem("theme", "light");
                }}
              >
                <LightModeIcon />
              </IconButton>
            </Tooltip>
          )}

          {isLoggedIn ? (
            <>
              <Tooltip title="Refresh API Data" arrow>
                <IconButton
                  color="inherit"
                  onClick={refreshAPIData}
                  sx={{ marginRight: "5px" }}
                >
                  <AutorenewIcon />
                </IconButton>
              </Tooltip>

              <UserIcon />
            </>
          ) : (
            <Box sx={{ marginLeft: "5px" }}>
              <picture>
                <source
                  media="(max-width:1025px)"
                  srcSet="../images/eve-sso-login-black-small.png"
                  alt=""
                  onClick={() => {
                    login();
                  }}
                />
                <img
                  src="../images/eve-sso-login-black-large.png"
                  alt=""
                  onClick={() => {
                    login();
                  }}
                />
              </picture>
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </>
  );
}
