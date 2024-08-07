import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase";
import getCurrentFirebaseUser from "./currentFirebaseUser";
import Job from "../../Classes/jobConstructor";

function setupJobDocumentListeners(
  inputJobIDs,
  updateJobArray,
  updateFirebaseListeners,
  firebaseListeners,
  isLoggedIn
) {
  try {
    if (
      !inputJobIDs ||
      !updateJobArray ||
      !updateFirebaseListeners ||
      !firebaseListeners ||
      isLoggedIn == null
    ) {
      throw new Error(
        "Missing required input: requestedJobID, updateJobArray, updateFirebaseListeners, firebaseListeners, or isLoggedIn"
      );
    }

    if (!isLoggedIn) return;

    const jobIDs = [];

    if (Array.isArray(requestedJobIDs) || requestedJobIDs instanceof Set) {
      (Array.isArray(requestedJobIDs)
        ? requestedJobIDs
        : Array.from(requestedJobIDs)
      ).forEach((item) => {
        if (typeof item === "string" || typeof item === "number") {
          jobIDs.push(item);
        } else if (
          typeof item === "object" &&
          item !== null &&
          "jobID" in item
        ) {
          jobIDs.push(item.jobID);
        } else {
          throw new Error(
            "Array or Set item must be a string, number, or an object with an 'jobID' property."
          );
        }
      });
    } else if (
      typeof requestedJobIDs === "string" ||
      typeof requestedJobIDs === "number"
    ) {
      jobIDs.push(requestedJobIDs);
    } else {
      throw new Error(
        "Invalid type for requestedJobIDs. Must be an array, Set, or a single ID."
      );
    }

    const idsToListen = jobIDs.filter(
      (id) => !firebaseListeners.some((listener) => listener.id === id)
    );

    if (idsToListen.length === 0) return;

    const uid = getCurrentFirebaseUser();

    if (!uid) {
      throw new Error("No authenticated user found");
    }

    const newListeners = idsToListen.map((requestedJobID) => {
      const unsubscribe = onSnapshot(
        doc(firestore, `Users/${uid}/Jobs`, requestedJobID.toString()),
        (docSnapshot) => {
          if (!docSnapshot.exists() || docSnapshot.metadata.fromCache) return;
          const job = new Job(docSnapshot.data());
          updateJobArray((prevDocs) => [
            ...prevDocs.filter((doc) => doc.id !== requestedJobID),
            job,
          ]);
        }
      );

      return { id: requestedJobID, unsubscribe };
    });

    updateFirebaseListeners((prev) => [...prev, ...newListeners]);
  } catch (err) {
    console.error("Error settings up job document listener:", err);
  }
}

export default setupJobDocumentListeners;
