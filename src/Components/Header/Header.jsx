import React, { useContext, useState } from "react";
import { login } from "../Auth/MainUserAuth";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Hidden,
  Container,
} from "@material-ui/core";
import { SideMenu } from "./Components/Side Menu/sidemenu";
import MenuIcon from "@material-ui/icons/Menu";
import { makeStyles } from "@material-ui/styles";
import { Search } from "../Header/Components/Search/Search";
import { UserIcon } from "./Components/User/UserIcon";
import { CircularProgress } from "@material-ui/core";
import { DataExchangeContext, IsLoggedInContext } from "../../Context/AuthContext";

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

  return (
    <>
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
          >
            <MenuIcon />
          </IconButton>

          <SideMenu open={open} setOpen={setOpen} />
          
          <Hidden smDown>
            <Typography variant="h5">
              Eve Industry Planner
            </Typography>
            <Typography variant="h6" className={classes.title}>
            - Alpha
            </Typography>
          </Hidden>

          {DataExchange ? <CircularProgress color="secondary" /> : null}

          <Search />

          {isLoggedIn ? (
            <UserIcon />
          ):
            <Box align="right">
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
    </>
  );
};