import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../../firebase";
import getCurrentFirebaseUser from "./currentFirebaseUser";

async function uploadApplicationSettingsToFirebase(settingsObject) {
  try {
    if (!settingsObject) {
      throw new Error("Settings object is null or undefined");
    }

    const uid = getCurrentFirebaseUser();

    if (!uid) {
      throw new Error("No authenticated user found");
    }

    const settingsDoc = settingsObject.toDocument
      ? settingsObject.toDocument()
      : settingsObject;

    await updateDoc(doc(firestore, "Users", uid), {
      settings: settingsDoc,
    });
  } catch (err) {
    console.error("Error uploading application settings:", err);
  }
}

export default uploadApplicationSettingsToFirebase;
