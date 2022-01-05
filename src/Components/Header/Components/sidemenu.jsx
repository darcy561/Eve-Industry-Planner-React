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

const useStyles = makeStyles((theme) => ({
  list: {
    width: 250,
  },
  Box: {
    minHeight: "10%",
  },
}));

export function SideMenu(props) {
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
