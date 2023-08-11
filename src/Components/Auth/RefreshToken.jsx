import { trace } from "@firebase/performance";
import { performance } from "../../firebase";
import { decodeJwt } from "jose";
import { login } from "./MainUserAuth";
import { Buffer } from "buffer";

export async function RefreshTokens(rToken, accountType) {
  const t = trace(performance, "UseRefreshToken");
  t.start();
  try {
    const authHeader = `Basic ${Buffer.from(
      `${import.meta.env.VITE_eveClientID}:${import.meta.env.VITE_eveSecretKey}`
    ).toString("base64")}`;

    const newTokenPromise = await fetch(
      "https://login.eveonline.com/v2/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
          Host: "login.eveonline.com",
        },
        body: `grant_type=refresh_token&refresh_token=${rToken}&scope=${
          import.meta.env.VITE_eveScope
        }`,
      }
    );
    const newTokenJSON = await newTokenPromise.json();
    const decodedToken = decodeJwt(newTokenJSON.access_token);
    if (accountType) {
      const newUser = new MainUser(decodedToken, newTokenJSON);
      newUser.ParentUser = accountType;
      localStorage.setItem("Auth", newTokenJSON.refresh_token);
      t.incrementMetric("RefreshSuccess", 1);
      t.stop();
      return newUser;
    } else {
      const newUser = new SecondaryUser(decodedToken, newTokenJSON);
      newUser.ParentUser = accountType;
      t.incrementMetric("RefreshSuccess", 1);
      t.stop();
      return newUser;
    }
  } catch (err) {
    t.incrementMetric("RefreshFail", 1);
    t.putAttribute("FailError", err.name);
    t.stop();
    if (accountType) {
      localStorage.removeItem("Auth");
      login();
    } else {
      return "RefreshFail";
    }
  }
}

class MainUser {
  constructor(decodedToken, tokenJSON) {
    this.accountID = decodedToken.owner.replace(/[^a-zA-z0-9 ]/g, "");
    this.CharacterID = Number(decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]);
    this.CharacterHash = decodedToken.owner;
    this.CharacterName = decodedToken.name;
    this.aToken = tokenJSON.access_token;
    this.aTokenEXP = Number(decodedToken.exp);
    this.ParentUser = null;
    this.linkedJobs = new Set();
    this.linkedOrders = new Set();
    this.linkedTrans = new Set();
    this.settings = null;
    this.accountRefreshTokens = [];
    this.refreshState = 1;
    this.corporation_id = null;
    this.isOmega = decodedToken.tier === "live" ? true : false;
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
    this.refreshState = 1;
    this.corporation_id = null;
    this.isOmega = decodedToken.tier === "live" ? true : false;
  }
}
