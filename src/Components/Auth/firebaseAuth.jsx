import { auth, appCheck } from "../../firebase";
import {
  browserSessionPersistence,
  setPersistence,
  signInWithCustomToken,
} from "firebase/auth";
import { getToken } from "firebase/app-check";

export async function firebaseAuth(charObj) {
  const appCheckToken = await getToken(appCheck, true);
  try {
    const fbtokenPromise = await fetch(
      `${process.env.REACT_APP_APIURL}/auth/gentoken`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Firebase-AppCheck": appCheckToken.token,
          "Access-Token": charObj.aToken,
        },
        body: JSON.stringify({
          UID: charObj.accountID,
          CharacterHash: charObj.CharacterHash,
        }),
      }
    );

    const fbTokenJSON = await fbtokenPromise.json();
    await setPersistence(auth, browserSessionPersistence);
    const fbUser = await signInWithCustomToken(auth, fbTokenJSON.access_token);
    return fbUser;
  } catch (error) {
    console.log(error);
  }
}
