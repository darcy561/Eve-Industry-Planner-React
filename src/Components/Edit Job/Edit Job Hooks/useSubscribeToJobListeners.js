import { useContext, useEffect } from "react";
import { JobArrayContext } from "../../../Context/JobContext";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../../Context/AuthContext";
import createFirebaseJobDocumentListener from "../../../Functions/Firebase/createJobListener";

function useSubscribeToJobListeners(requestedJobID, onJobLoaded) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );

  if (!isLoggedIn || !requestedJobID) {
    onJobLoaded();
    return;
  }

  useEffect(() => {
    try {
      const matchedJobSnapshot = userJobSnapshot.find(
        ({ jobID }) => jobID === requestedJobID
      );
      const relatedJobs = matchedJobSnapshot.getRelatedJobs();

      const requiredJobs = [...relatedJobs, requestedJobID];

      const existingListenerIds = new Set(
        firebaseListeners.map((listener) => listener.id)
      );
      const existingJobIds = new Set(jobArray.map((job) => job.jobID));

      requiredJobs.forEach((id) => {
        if (existingListenerIds.has(id) && existingJobIds.has(id)) return;

        console.log(id);
        const unsubscribe = createFirebaseJobDocumentListener(
          id,
          updateJobArray
        );

        if (!unsubscribe) return;

        updateFirebaseListeners((prev) => [...prev, { id, unsubscribe }]);
      });

      onJobLoaded();
    } catch (err) {
      console.error("Error setting up job listeners:", err);
    }
  }, [
    requestedJobID,
    firebaseListeners,
    updateFirebaseListeners,
    jobArray,
    updateJobArray,
  ]);
}

export default useSubscribeToJobListeners;
