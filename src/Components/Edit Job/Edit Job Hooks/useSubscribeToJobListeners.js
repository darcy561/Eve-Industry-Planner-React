import { useContext, useEffect, useState } from "react";
import { JobArrayContext } from "../../../Context/JobContext";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
} from "../../../Context/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../../../firebase";
import getCurrentFirebaseUser from "../../../Functions/Firebase/currentFirebaseUser";
import Job from "../../../Classes/jobConstructor";

function useSubscribeToJobListeners(requestedJobID, onJobLoaded) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );
  const [loading, setLoading] = useState(true);

  if (!isLoggedIn || !requestedJobID) return loading;

  const uid = getCurrentFirebaseUser();

  useEffect(() => {
    async function setupJobListeners() {
      const existingJob = jobArray.find((doc) => doc.id === requestedJobID);

      if (existingJob) {
        setLoading(false);
        onJobLoaded();
        return;
      }

      try {
        if (
          !firebaseListeners.some((listener) => listener.id === requestedJobID)
        ) {
          const initialDocumentListener = onSnapshot(
            doc(firestore, `Users/${uid}/Jobs`, requestedJobID.toString()),
            (initialDoc) => {
              console.log(initialDoc);
              if (initialDoc) {
                const initalJob = new Job(initialDoc.data());
                if (!initialDoc.metadata.fromCache) {
                  updateJobArray((prevDocs) => [
                    ...prevDocs.filter((doc) => doc.id !== requestedJobID),
                    initalJob,
                  ]);
                }

                console.log(initalJob);
                const relatedDocuments = initalJob.getRelatedJobs();

                if (relatedDocuments.length > 0) {
                  relatedDocuments.forEach((id) => {
                    if (
                      !firebaseListeners.some((listener) => listener.id === id)
                    ) {
                      const unsubscribe = onSnapshot(
                        doc(firestore, `Users/${uid}/Jobs`, id.toSting()),
                        (secondaryDoc) => {
                          if (secondaryDoc.exists()) {
                            const secondaryJob = new Job(secondaryDoc.data());
                            if (!secondaryDoc.metadata.fromCache) {
                              updateJobArray((prevDocs) => [
                                ...prevDocs.filter((doc) => doc.id !== id),
                                secondaryJob,
                              ]);
                            }
                          }
                        }
                      );
                      updateFirebaseListeners((prevListeners) => [
                        ...prevListeners,
                        { id, unsubscribe },
                      ]);
                    }
                  });
                }

                setLoading(false);
                onJobLoaded();
              }
            }
          );
          updateFirebaseListeners((prevListeners) => [
            ...prevListeners,
            { id: requestedJobID, unsubscribe: initialDocumentListener },
          ]);
        }
      } catch (err) {
        console.error("Error setting up job listeners:", err);
        setLoading(false);
      }
    }

    setupJobListeners();
  }, [
    requestedJobID,
    firebaseListeners,
    updateJobArray,
    updateFirebaseListeners,
    isLoggedIn,
    uid,
  ]);
  return loading;
}

export default useSubscribeToJobListeners;
