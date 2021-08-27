import React, { useContext, useState, useEffect } from 'react';
import { MainUserContext, UsersContext } from '../../Context/AuthContext';
import { IsLoggedInContext } from '../../Context/AuthContext';
import { CircularProgress } from '@material-ui/core';
import { useHistory } from 'react-router';

const appClientID = "d1f943a341524afd9242a49e9e7b46da";
const appSecretKey = "8w9t3ElwUSL9PcQN4J8qL4tjH2vPLq8OYpuImKYM";
const urlCallback = encodeURIComponent(`https://${window.location.hostname}/auth`);
const scopes = "publicData"
const baseURl = "https://login.eveonline.com/v2/oauth/authorize/?response_type=code";


export function login() {
    const state = window.location.pathname;
    window.location.href = `${baseURl}&redirect_uri=${urlCallback}&client_id=${appClientID}&scope=${scopes}&state=${state}`;
};

export function AuthMainUser() { 
    const { users, updateUsers } = useContext(UsersContext);
    const { updateMainUser } = useContext(MainUserContext);
    const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
    const [Loading, setLoading] = useState(true);
    const history = useHistory();

    useEffect(() => {
      const authCode = window.location.search.match(/code=(\w*)/)[1];
      const returnState = window.location.search.match(/state=(\w*)/)[1];

      const userObject = fetchTokens(authCode);
      userObject.then((userData) => {
        userData.newUser.ParentUser = true;
        updateIsLoggedIn(true);
        const newArray = [...users];
        newArray.push(userData.newUser);
        updateUsers(newArray);
        updateMainUser(userData.newUser);
        setLoading(false);
        console.log(returnState);
        history.push(returnState);
      });
    }, []);
        
    return(
        Loading && <CircularProgress color="primary"/>
    );
};

async function fetchTokens(authCode) {
    let failCount = 0;
  
    const encodedCredentials = btoa(`${appClientID}:${appSecretKey}`);
    while (failCount < 6) {
        try {
            const tokenPromise = await fetch(
                "https://login.eveonline.com/v2/oauth/token",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Basic ${encodedCredentials}`,
                        "Content-Type": "application / x-www-form-urlencoded",
                        Host: "login.eveonline.com",
                    },
                    body: `grant_type=authorization_code&code=${authCode}`,
                });
    
            const tokenJSON = await tokenPromise.json();

            const charPromise = await fetch(
                "https://login.eveonline.com/oauth/verify",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${tokenJSON.access_token}`,
                        Host: "login.eveonline.com"
                    },
                });
    
            const charJSON = await charPromise.json();
        
            const newUser = new User(charJSON, tokenJSON)
    
            localStorage.setItem("Auth", tokenJSON.refresh_token);
            return { newUser };
        } catch (err) {
            failCount++;
        };
    };
};

class User {
    constructor(charJSON, tokenJSON) {
        this.CharacterID = charJSON.CharacterID;
        this.CharacterHash = charJSON.CharacterOwnerHash;
        this.CharacterName = charJSON.CharacterName;
        this.aToken = tokenJSON.access_token;
        this.ParentUser = null;
        this.Skills = {};
        this.Jobs = {};
    };
};