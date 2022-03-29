import { trace } from "@firebase/performance";
import { performance } from "../../firebase"
import jwt from "jsonwebtoken";
import { login } from "./MainUserAuth";

export async function RefreshTokens(rToken, accountType) {
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
                    body: `grant_type=refresh_token&refresh_token=${rToken}&scope=${process.env.REACT_APP_eveScope}`,
                }
            );
            const newTokenJSON = await newTokenPromise.json();

            const decodedToken = jwt.decode(newTokenJSON.access_token);
              
            if (accountType) {
                const newUser = new MainUser(decodedToken, newTokenJSON);
                newUser.ParentUser = accountType;
                localStorage.setItem("Auth", newTokenJSON.refresh_token);
                t.incrementMetric("RefreshSuccess", 1);
                t.stop()
                return newUser;
              } else {
                const newUser = new SecondaryUser(decodedToken, newTokenJSON);
                newUser.ParentUser = accountType;
                t.incrementMetric("RefreshSuccess", 1);
                t.stop()
                return newUser;
              }
        } catch (err) {
            t.incrementMetric("RefreshFail", 1);
            t.putAttribute("FailError", err.name);
            t.stop();
            if (accountType) {
                localStorage.removeItem("Auth")
                login()
            } else {
              console.log(err);
                return "RefreshFail"
                
            }

        }         
};

class MainUser {
    constructor(decodedToken, tokenJSON) {
      this.accountID = decodedToken.owner.replace(/[^a-zA-z0-9 ]/g, "");
      this.CharacterID = Number(decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]);
      this.CharacterHash = decodedToken.owner;
      this.CharacterName = decodedToken.name;
      this.aToken = tokenJSON.access_token;
      this.aTokenEXP = Number(decodedToken.exp);
      this.ParentUser = null;
      this.apiSkills = null;
      this.apiJobs = null;
      this.linkedJobs = [];
      this.linkedOrders = [];
      this.linkedTrans = [];
      this.apiOrders = null;
      this.apiHistOrders = null;
      this.apiBlueprints = null;
      this.settings = null;
      this.accountRefreshTokens = [];
      this.refreshState = 1;
    }
  }
  class SecondaryUser {
    constructor(decodedToken, tokenJSON) {
      this.CharacterID = Number(decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]);
      this.CharacterHash = decodedToken.owner;
      this.CharacterName = decodedToken.name;
      this.aToken = tokenJSON.access_token;
      this.aTokenEXP = Number(decodedToken.exp);
      this.rToken = tokenJSON.refresh_token;
      this.ParentUser = null;
      this.apiSkills = null;
      this.apiJobs = null;
      this.apiOrders = null;
      this.apiHistOrders = null;
      this.apiBlueprints = null;
      this.refreshState = 1;
    }
  }