import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  SwipeableDrawer,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { makeStyles } from "@mui/styles";
import { useContext } from "react";
import { IsLoggedInContext } from "../../../Context/AuthContext";

const useStyles = makeStyles((theme) => ({
  list: {
    width: 250,
  },
  Box: {
    minHeight: "10%",
  },
}));

export function SideMenu(props) {
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
      <Box className={classes.Box}></Box>

      <Box className={classes.list}>
        <Divider />
        <List>
          <ListItem
            button
            onClick={() => {
              navigate("/");
              setOpen(false);
            }}
          >
            {isLoggedIn ? (
              
              <ListItemText primary={"Dashboard"} />
            ) : (
              <ListItemText primary={"Home"} />
            )}
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
      </Box>
    </SwipeableDrawer>
  );
}
