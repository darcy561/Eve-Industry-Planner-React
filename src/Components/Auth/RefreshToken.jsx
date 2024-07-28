import { trace } from "@firebase/performance";
import { performance } from "../../firebase";
import { decodeJwt } from "jose";
import { login } from "./MainUserAuth";
import { Buffer } from "buffer";
import User from "../../Classes/usersConstructor";

export async function RefreshTokens(rToken, accountType = false) {
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

    const newUser = new User(decodedToken, newTokenJSON, accountType);

    if (accountType) {
      localStorage.setItem("Auth", newTokenJSON.refresh_token);
    }
    t.incrementMetric("RefreshSuccess", 1);
    t.stop();
    return newUser;
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
