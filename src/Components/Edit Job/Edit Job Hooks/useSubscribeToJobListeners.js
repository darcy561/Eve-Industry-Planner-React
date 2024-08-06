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

  if (!isLoggedIn || !requestedJobID) return;

  const uid = getCurrentFirebaseUser();

  useEffect(() => {
    async function setupJobListeners() {
      const existingJob = jobArray.find((i) => i.jobID === requestedJobID);
      if (existingJob) {
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
              if (initialDoc.exists()) {
                const initalJob = new Job(initialDoc.data());
                if (!initialDoc.metadata.fromCache) {
                  updateJobArray((prevDocs) => [
                    ...prevDocs.filter((doc) => doc.id !== requestedJobID),
                    initalJob,
                  ]);
                }

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
              }
              onJobLoaded();
            }
          );
          updateFirebaseListeners((prevListeners) => [
            ...prevListeners,
            { id: requestedJobID, unsubscribe: initialDocumentListener },
          ]);
        }
      } catch (err) {
        console.error("Error setting up job listeners:", err);
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
}

export default useSubscribeToJobListeners;
