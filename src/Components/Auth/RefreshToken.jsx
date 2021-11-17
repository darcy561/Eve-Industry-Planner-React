import jwt from "jsonwebtoken";

const appClientID = "9adbd31df9324e6ead444f1ecfdf670d";
const appSecretKey = "1aaX3CsHUmJGr3p0nabmd2EsK4QlsOu8Fj2aGozF";

export async function RefreshTokens(rToken) {
    const encodedCredentials = btoa(`${appClientID}:${appSecretKey}`);
        try {
            const newTokenPromise = await fetch(
                "https://login.eveonline.com/v2/oauth/token",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Basic ${encodedCredentials}`,
                        "Content-Type": "application / x-www-form-urlencoded",
                        "Host": "login.eveonline.com",
                    },
                    body: `grant_type=refresh_token&refresh_token=${rToken}`,
                }
            );
            const newTokenJSON = await newTokenPromise.json();

            const decodedToken = jwt.decode(newTokenJSON.access_token);
            if (
              decodedToken.iss != "login.eveonline.com" && decodedToken.iss != "https://login.eveonline.com"
            ) {
              throw console.error("Invalid Token");
              }
              
            const newUser = new MainUser(decodedToken, newTokenJSON);
  
            localStorage.setItem("Auth", newTokenJSON.refresh_token);
            
            return newUser
        } catch (err) {
            console.log(err);
        }         
};

class MainUser {
    constructor(decodedToken, tokenJSON) {
        this.CharacterID = Number(decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]);
        this.CharacterHash = decodedToken.owner;
        this.CharacterName = decodedToken.name;
        this.aToken = tokenJSON.access_token;
        this.aTokenEXP = Number(decodedToken.exp);
        this.fbToken = null;
        this.ParentUser = true;
        this.Skills = [];
        this.Jobs = [];
        this.Orders = [];
        this.Settings = { accordion: [] };
    };
};