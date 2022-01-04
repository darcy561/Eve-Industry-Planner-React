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
import { IsLoggedInContext } from "../../Context/AuthContext";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

export function Header({mode, colorMode}) {
  const { isLoggedIn } = useContext(IsLoggedInContext);

  const [open, setOpen] = useState(false);

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
              <IconButton color="inherit" onClick={() => {
                colorMode.toggleColorMode()
              localStorage.setItem("theme", "dark")}}>
                <DarkModeIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Toggle Light/Dark Theme" arrow>
                <IconButton color="inherit" onClick={() => {
                  colorMode.toggleColorMode()
                  localStorage.setItem("theme", "light")
                }}>
                <LightModeIcon />
              </IconButton>
            </Tooltip>
          )}

          {isLoggedIn ? (
            <>
              <Tooltip title="Refresh API Data" arrow>
                <IconButton color="inherit" sx={{ marginRight: "5px" }}>
                  <AutorenewIcon />
                </IconButton>
              </Tooltip>

              <UserIcon />
            </>
          ) : (
            <Box sx={{marginLeft: "5px"}}>
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
