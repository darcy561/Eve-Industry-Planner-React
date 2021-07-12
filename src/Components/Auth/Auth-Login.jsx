import React, { useContext, useState } from 'react';
import { UsersContext } from '../../Context/AuthContext';

const appClientID = "d1f943a341524afd9242a49e9e7b46da";
const appSecretKey = "8w9t3ElwUSL9PcQN4J8qL4tjH2vPLq8OYpuImKYM";
const urlCallback = "http://localhost:3000/auth/";
const scopes = "publicData"
const baseURl = "https://login.eveonline.com/v2/oauth/authorize/?response_type=code";


export function login() {
    const state="aba123"
    window.location.href = `${baseURl}&redirect_uri=${encodeURIComponent(urlCallback)}&client_id=${appClientID}&scope=${scopes}&state=${state}`    
};

export function AuthToken() {   
    const [users, updateUsers] = useContext(UsersContext);
                
    const authCode = window.location.search.match(/code=(\w*)/)[1];
    const returnState = window.location.search.match(/state=(\w*)/)[1];

    const newUserObject = fetchTokens(authCode);
    if (users.length >= 1) {
        newUserObject.ParentUser = false;
    } else {
        newUserObject.ParentUser = true;
    };

    // updateUsers([...users, newUserObject]);    

    console.log(users);
    
    return (<></>)
};

async function fetchTokens(authCode) {

    class User{
        constructor(charJSON, tokenJSON) {
            this.CharacterID = charJSON.CharacterID;
            this.CharacterHash = charJSON.CharacterOwnerHash;
            this.CharacterName = charJSON.CharacterName;
            this.aToken = tokenJSON.access_token;
            this.ParentUser = null;
        };
    };
    

    const encodedCredentials = btoa(`${appClientID}:${appSecretKey}`);
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
            }
        );
        const tokenJSON = await tokenPromise.json();

        const charPromise = await fetch(
        "https://login.eveonline.com/oauth/verify",
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${tokenJSON.access_token}`,
                Host: "login.eveonline.com"
            },
        }
    );
    const charJSON = await charPromise.json();
    
    const newUser = new User(charJSON, tokenJSON)
    
    localStorage.setItem(charJSON.CharacterID, tokenJSON.refresh_token);

    return { newUser };
};


// async function refreshTokens() {
//     const rToken = localStorage.getItem(charID)
//     const encodedCredentials = btoa(`${appClientID}:${appSecretKey}`);

//     const newTokenPromise = await fetch(
//         "https://login.eveonline.com/oauth/token",
//         {
//             method: "POST",
//             headers: {
//                 Authorization: `Basic ${encodedCredentials}`,
//                 "Content-Type": "application / x-www-form-urlencoded",
//                 Host: "login.eveonline.com",
//             },
//             body: `grant_type=refresh_token&refresh_token=${rToken}`,
//         }
//     );
//     const newTokenJSON = await newTokenPromise.json();

// }