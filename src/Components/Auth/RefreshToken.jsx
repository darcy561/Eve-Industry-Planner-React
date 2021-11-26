import { trace } from "@firebase/performance";
import { performance } from "../../firebase"
import jwt from "jsonwebtoken";
import { login } from "./MainUserAuth";

export async function RefreshTokens(rToken) {
    const t = trace(performance, "UseRefreshToken");
    t.start();
        try {
            const newTokenPromise = await fetch(
                "https://login.eveonline.com/v2/oauth/token",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Basic ${btoa(`${process.env.REACT_APP_eveClientID}:${process.env.REACT_APP_eveSecretKey}`)}`,
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Host": "login.eveonline.com",
                    },
                    body: `grant_type=refresh_token&refresh_token=${rToken}`,
                }
            );
            const newTokenJSON = await newTokenPromise.json();

            const decodedToken = jwt.decode(newTokenJSON.access_token);
              
            const newUser = new MainUser(decodedToken, newTokenJSON);
  
            localStorage.setItem("Auth", newTokenJSON.refresh_token);
            t.incrementMetric("RefreshSuccess", 1);
            t.stop()
            return newUser
        } catch (err) {
            t.incrementMetric("RefreshFail", 1);
            t.putAttribute("FailError", err.name);
            t.stop();
            localStorage.removeItem("Auth")
            login()
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