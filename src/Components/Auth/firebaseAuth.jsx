import { auth } from "../../firebase"
import { signInWithCustomToken } from "firebase/auth";

export async function firebaseAuth(charObj) {
  try {
    const fbtokenPromise = await fetch(
      "https://us-central1-eve-industry-planner-dev.cloudfunctions.net/app/auth/gentoken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ CharacterHash: charObj.CharacterHash }),
      }
    );

    const fbTokenJSON = await fbtokenPromise.json();

    const fbUser = await signInWithCustomToken(auth, fbTokenJSON.access_token);
    return fbUser;
  } catch (error) {
    console.log(error);
  }
}
