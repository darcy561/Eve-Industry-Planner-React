import { MainUserContext, UsersContext } from '../../Context/AuthContext';

const appClientID = "d1f943a341524afd9242a49e9e7b46da";
const appSecretKey = "8w9t3ElwUSL9PcQN4J8qL4tjH2vPLq8OYpuImKYM";

export async function RefreshTokens(rToken) {
    const encodedCredentials = btoa(`${appClientID}:${appSecretKey}`);
    let failCount = 0;

    while (failCount < 6) {
        try {
            const newTokenPromise = await fetch(
                "https://login.eveonline.com/v2/oauth/token",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Basic ${encodedCredentials}`,
                        "Content-Type": "application / x-www-form-urlencoded",
                        Host: "login.eveonline.com",
                    },
                    body: `grant_type=refresh_token&refresh_token=${rToken}`,
                }
            );
            const newTokenJSON = await newTokenPromise.json();

            const charPromise = await fetch(
                "https://login.eveonline.com/oauth/verify",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${newTokenJSON.access_token}`,
                        Host: "login.eveonline.com"
                    },
                });

            const charJSON = await charPromise.json();

            const newUser = new User(charJSON, newTokenJSON)
            return newUser
        } catch (err) {
            failCount++;
        }
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