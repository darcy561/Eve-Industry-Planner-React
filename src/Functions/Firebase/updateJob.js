import { firestore } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import getCurrentFirebaseUser from "./currentFirebaseUser";

async function updateJobInFirebase(inputJob) {
  try {
    if (!inputJob) {
      throw new Error("Input Job is null or undefined");
    }

    const uid = getCurrentFirebaseUser();

    if (!uid) {
      throw new Error("No authenticated user found");
    }

    await updateDoc(
      doc(firestore, `Users/${uid}/Jobs`, inputJob.jobID.toString()),
      inputJob.toDocument()
    );
  } catch (err) {
    console.error(`Error updating job object in Firebase: ${err}`);
  }
}

export default updateJobInFirebase;
