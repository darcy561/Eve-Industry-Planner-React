import jwt from "jsonwebtoken";
import { login } from "./MainUserAuth";

export async function RefreshTokens(rToken) {
    const buffer = Buffer.from(`${process.env.REACT_APP_eveClientID}:${ process.env.REACT_APP_eveSecretKey }`, "utf-8")
    const encodedCredentials = buffer.toString("base64")
    console.log(encodedCredentials);
        try {
            const newTokenPromise = await fetch(
                "https://login.eveonline.com/v2/oauth/token",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Basic ${encodedCredentials}`,
                        "Content-Type": "application/x-www-form-urlencoded",
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
            // login();
        }         
};

class MainUser {
    constructor(decodedToken, tokenJSON) {
        this.accountID = null;
        this.CharacterID = Number(decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]);
        this.CharacterHash = decodedToken.owner;
        this.CharacterName = decodedToken.name;
        this.aToken = tokenJSON.access_token;
        this.aTokenEXP = Number(decodedToken.exp);
        this.fbToken = null;
        this.ParentUser = true;
        this.apiSkills = null;
        this.apiJobs = null;
        this.apiOrders = null;
        this.Settings = null;
    };
};