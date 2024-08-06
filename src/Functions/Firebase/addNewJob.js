import { firestore } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";
import getCurrentFirebaseUser from "./currentFirebaseUser";

async function addNewJobToFirebase(inputJob) {
  try {
    if (!inputJob) {
      throw new Error("Input Job is null or undefined");
    }

    const uid = getCurrentFirebaseUser();

    if (!uid) {
      throw new Error("No authenticated user found");
    }

    await setDoc(
      doc(firestore, `Users/${uid}/Jobs`, inputJob.jobID.toString()),
      inputJob.toDocument()
    );
  } catch (err) {
    console.error(`Error uploading job object to Firebase: ${err}`);
  }
}

export default addNewJobToFirebase;
