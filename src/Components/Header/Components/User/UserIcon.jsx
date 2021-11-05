import { Avatar, Box, Container, Hidden, Icon, Menu, MenuItem, Typography } from '@material-ui/core';
import React, {useContext, useState} from 'react';
import { IsLoggedInContext, MainUserContext, UsersContext } from '../../../../Context/AuthContext';
import { ActiveJobContext, JobArrayContext } from '../../../../Context/JobContext';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import firebase from "../../../../firebase";


export function UserIcon() {
    const { users, updateUsers } = useContext(UsersContext);
    const { mainUser } = useContext(MainUserContext);
    const [anchor, setAnchor] = useState(null);
    const { updateIsLoggedIn } = useContext(IsLoggedInContext);
    const { updateActiveJob } = useContext(ActiveJobContext);
    const { updateJobArray } = useContext(JobArrayContext);


  function logout() {
        updateIsLoggedIn(false);
        updateUsers([]);
        updateJobArray([]);
        updateActiveJob({});
        sessionStorage.clear();
        localStorage.clear();
        firebase.auth().signOut();
    };
    
    const openMenu = (event) => {
        setAnchor(event.currentTarget)
    };
    const closeMenu = () => {
        setAnchor(null);
    };

    if (mainUser != null) {
        return (
          <>
            <Hidden smDown>
              <Box align="center" maxWidth="xs" onClick={openMenu}>
                <Avatar
                  alt=""
                  src={`https://images.evetech.net/characters/${mainUser.CharacterID}/portrait`}
                />
                <Typography variant="body1">
                  {mainUser.CharacterName}
                </Typography>
              </Box>
            </Hidden>
                
            <Hidden mdUp>
                    <AccountCircleIcon color="secondary" fontSize="large" onClick={openMenu}/>
            </Hidden>
            <Menu
              id="userMenu"
              anchorEl={anchor}
              keepMounted
              open={Boolean(anchor)}
              onClose={closeMenu}
            >
              <MenuItem disabled>Accounts</MenuItem>
              <MenuItem onClick={logout}>Log Out</MenuItem>
            </Menu>
          </>
        );
    } else {
        return null;
    };
};