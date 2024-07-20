import { auth, appCheck } from "../../firebase";
import { signInWithCustomToken } from "firebase/auth";
import { getToken } from "firebase/app-check";

export async function firebaseAuth(charObj) {
  const appCheckToken = await getToken(appCheck, true);

  try {
    const fbTokenResponse = await fetch(
      `${import.meta.env.VITE_APIURL}/auth/generate-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Firebase-AppCheck": appCheckToken.token,
          "Access-Token": charObj.aToken,
          appVersion: __APP_VERSION__,
        },
        body: JSON.stringify({
          UID: charObj.accountID,
          CharacterHash: charObj.CharacterHash,
        }),
      }
    );

    if (!fbTokenResponse.ok) {
      throw new Error("Failed to generate Firebase token");
    }

    const fbTokenJSON = await fbTokenResponse.json();
    const fbToken = await signInWithCustomToken(auth, fbTokenJSON.access_token);

    return fbToken;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
