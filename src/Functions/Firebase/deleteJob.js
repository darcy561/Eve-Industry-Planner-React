import { firestore } from "../../firebase";
import { deleteDoc, doc } from "firebase/firestore";
import getCurrentFirebaseUser from "./currentFirebaseUser";

async function deleteJobFromFirebase(inputJob) {
  try {
    if (!inputJob) {
      throw new Error("Input Job is null or undefined");
    }

    const uid = getCurrentFirebaseUser();

    if (!uid) {
      throw new Error("No authenticated user found");
    }

    await deleteDoc(
      doc(firestore, `Users/${uid}/Jobs`, inputJob.jobID.toString())
    );
  } catch (err) {
    console.error(`Error uploading job object to Firebase: ${err}`);
  }
}

export default deleteJobFromFirebase;
