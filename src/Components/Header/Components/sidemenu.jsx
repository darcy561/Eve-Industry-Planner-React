import React, { useContext } from "react";
import {
  Avatar,
  Box,
  Hidden,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  SwipeableDrawer,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { makeStyles } from "@mui/styles";
import {
  IsLoggedInContext,
  MainUserContext,
} from "../../../Context/AuthContext";

const useStyles = makeStyles((theme) => ({
  list: {
    width: 250,
  },
  Box: {
    minHeight: "10%",
  },
}));

export function SideMenu(props) {
  const { mainUser } = useContext(MainUserContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const open = props.open;
  const setOpen = props.setOpen;
  const navigate = useNavigate();
  const classes = useStyles();
  return (
    <SwipeableDrawer
      anchor="left"
      open={open}
      onClick={() => {}}
      onClose={() => {
        setOpen(false);
      }}
      onOpen={() => {
        setOpen(true);
      }}
    >
      <Box className={classes.Box}>
        {/* <Hidden mdUp>
          <Typography align="center" variant="h5">
            Eve Industry Planner
          </Typography>
          {isLoggedIn ? (
            <Box align="center" maxWidth="xs">
              <Avatar
                alt=""
                src={`https://images.evetech.net/characters/${mainUser.CharacterID}/portrait`}
              />
              <Typography variant="body1">{mainUser.CharacterName}</Typography>
            </Box>
          ) : null}
        </Hidden> */}
      </Box>

      <div className={classes.list}>
        <Divider />
        <List>
          <ListItem
            button
            onClick={() => {
              navigate("/");
              setOpen(false);
            }}
          >
            <ListItemText primary={"Home"} />
          </ListItem>
          <Divider />
          <ListItem
            button
            onClick={() => {
              navigate("/jobplanner");
              setOpen(false);
            }}
          >
            <ListItemText primary={"Job Planner"} />
          </ListItem>
          <Divider />
        </List>
      </div>
    </SwipeableDrawer>
  );
}
