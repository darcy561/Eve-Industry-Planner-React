import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../../firebase";
import getCurrentFirebaseUser from "./currentFirebaseUser";
import Job from "../../Classes/jobConstructor";
import createFirebaseJobDocumentListener from "./createJobListener";

function manageListenerRequests(
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

    if (Array.isArray(inputJobIDs) || inputJobIDs instanceof Set) {
      (Array.isArray(inputJobIDs)
        ? inputJobIDs
        : Array.from(inputJobIDs)
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
      typeof inputJobIDs === "string" ||
      typeof inputJobIDs === "number"
    ) {
      jobIDs.push(inputJobIDs);
    } else {
      throw new Error(
        "Invalid type for inputJobIDs. Must be an array, Set, or a single ID."
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
      const unsubscribe = createFirebaseJobDocumentListener(
        requestedJobID,
        updateJobArray,
        updateFirebaseListeners
      );

      return { id: requestedJobID, unsubscribe };
    });

    updateFirebaseListeners((prev) => {
      const updatedListeners = prev.filter((i) => !idsToListen.includes(i.id));
      return [...updatedListeners, ...newListeners];
    });
  } catch (err) {
    console.error("Error setting up job document listener:", err);
  }
}

export default manageListenerRequests;
