import React, { useContext, useState } from "react";
import { login } from "../Auth/MainUserAuth";
import {
  Box,
  CircularProgress,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Hidden,
} from "@mui/material";
import { SideMenu } from "./Components/Side Menu/sidemenu";
import MenuIcon from "@mui/icons-material/Menu";
import { makeStyles } from "@mui/styles";
import { Search } from "../Header/Components/Search/Search";
import { UserIcon } from "./Components/User/UserIcon";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { DataExchangeContext } from "../../Context/LayoutContext";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    color: "inherit",
    marginRight: "5px",
  },
  title: {
    flexGrow: 1,
  },
  list: {
    width: 250,
  },
  Box: {
    height: "5%",
  },
}));

export function Header() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { DataExchange } = useContext(DataExchangeContext);
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  return <>
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          className={classes.menuButton}
          color="inherit"
          aria-label="menu"
          onClick={() => {
            setOpen(true);
          }}
          size="large">
          <MenuIcon />
        </IconButton>

        <SideMenu open={open} setOpen={setOpen} />
        
        <Hidden mdDown>
          <Typography variant="h5">
            Eve Industry Planner
          </Typography>
          <Typography variant="h6" className={classes.title}>
          - Alpha
          </Typography>
        </Hidden>

        {DataExchange && <CircularProgress color="secondary" />}

        <Search />

        {isLoggedIn ? (
          <UserIcon />
        ):
          <Box>
            <picture>
              <source
                media="(max-width:900px)"
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
        }
      </Toolbar>
    </AppBar>
  </>;
};