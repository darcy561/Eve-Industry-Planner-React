import React,{useContext} from 'react';
import { Avatar, Box, Hidden, Typography, Divider, List, ListItem, ListItemText, SwipeableDrawer } from '@material-ui/core';
import { useHistory } from "react-router-dom";
import { makeStyles } from '@material-ui/styles';
import { MainUserContext } from '../../../../Context/AuthContext';

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
    const open = props.open;
    const setOpen = props.setOpen;
    const history = useHistory();
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
          <Hidden mdUp>
            <Typography align="center" variant="h5">
              Eve Industry Planner
            </Typography>
            <Box align="center" maxWidth="xs">
              <Avatar
                alt=""
                src={`https://images.evetech.net/characters/${mainUser.CharacterID}/portrait`}
              />
              <Typography variant="body1">{mainUser.CharacterName}</Typography>
            </Box>
          </Hidden>
        </Box>

        <div className={classes.list}>
          <Divider />
          <List>
            <ListItem
              button
              onClick={() => {
                history.push("/");
                setOpen(false);
              }}
            >
              <ListItemText primary={"Home"} />
            </ListItem>
            <Divider />
            <ListItem
              button
              onClick={() => {
                history.push("/jobplanner");
                setOpen(false);
              }}
            >
              <ListItemText primary={"Job Planner"} />
            </ListItem>
            <Divider />
            <ListItem
              button
              disabled
              onClick={() => {
                useHistory.push("/itemtree");
                setOpen(false);
              }}
            >
              <ListItemText primary={"Item Tree"} />
            </ListItem>
            <Divider />
          </List>
        </div>
      </SwipeableDrawer>
    );
};