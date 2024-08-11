import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase";
import getCurrentFirebaseUser from "./currentFirebaseUser";
import Job from "../../Classes/jobConstructor";

function createFirebaseJobDocumentListener(documentID, updateJobArray) {
  try {
    if ((!documentID, !updateJobArray)) {
      throw new Error("Missing Inputs");
    }

    const uid = getCurrentFirebaseUser();

    if (!uid) {
      throw new Error("No authenticated user found");
    }

    return onSnapshot(
      doc(firestore, `Users/${uid}/Jobs`, documentID.toString()),
      (docSnapshot) => {
        if (!docSnapshot.exists()) return;
        const job = new Job(docSnapshot.data());

        if (!docSnapshot.metadata.fromCache) {
          updateJobArray((prevDocs) => {
            const jobExists = prevDocs.some((doc) => doc.id === documentID);

            // If the job is not in the array or it's not from cache, update the array
            if (!jobExists || !docSnapshot.metadata.fromCache) {
              return [...prevDocs.filter((doc) => doc.id !== documentID), job];
            }
            return prevDocs;
          });
        }
      }
    );
  } catch (err) {
    console.error("Error creating job document listener:", err);
    return null;
  }
}

export default createFirebaseJobDocumentListener;
