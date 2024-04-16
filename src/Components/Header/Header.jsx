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
import { IsLoggedInContext } from "../../Context/AuthContext";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { UserIcon } from "./Components/UserIcon";
import { RefreshApiIcon } from "./Components/refreshIcon";
import { UserLoginUIContext } from "../../Context/LayoutContext";
import { useTheme } from "@emotion/react";

export function Header({ colorMode }) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const [open, setOpen] = useState(false);
  const { loginInProgressComplete } = useContext(UserLoginUIContext);

  const currentTheme = useTheme().palette.mode;

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar
        sx={{
          paddingLeft: { xs: "8px", sm: "16px" },
          paddingRight: { xs: "4px", sm: "8px" },
        }}
      >
        <IconButton
          edge="start"
          color="inherit"
          W
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
          sx={{
            typography: { xs: "subtitle2", sm: "h5" },
            flexGrow: "1",
            display: { xs: "flex" },
          }}
        >
          Eve Industry Planner
        </Typography>

        <Tooltip title="Toggle Light/Dark Theme" arrow>
          <IconButton
            color="inherit"
            onClick={() => {
              colorMode.toggleColorMode();
              localStorage.setItem(
                "theme",
                currentTheme === "light" ? "dark" : "light"
              );
            }}
          >
            {currentTheme === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>

        {isLoggedIn && loginInProgressComplete ? (
          <>
            <RefreshApiIcon />
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
  );
}
