import { useContext, useEffect } from "react";
import {
  FirebaseListenersContext,
  UserJobSnapshotContext,
} from "../../../../Context/AuthContext";
import { JobArrayContext } from "../../../../Context/JobContext";
import createFirebaseJobDocumentListener from "../../../../Functions/Firebase/createJobListener";

function useSubscribeToNewGroupListeners(requestedJobIDs, onJobLoaded) {
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );

  useEffect(() => {
    try {
      if (!requestedJobIDs || !requestedJobIDs.length) {
        onJobLoaded();
        return;
      }
      let combinedJobIDs = new Set();
      for (let id of requestedJobIDs) {
        const matchedJobSnapshot = userJobSnapshot.find(
          ({ jobID }) => jobID === id
        );
        if (!matchedJobSnapshot) continue;
        const relatedJobs = matchedJobSnapshot.getRelatedJobs();
        combinedJobIDs.add(id);
        relatedJobs.forEach((jobId) => combinedJobIDs.add(jobId));
      }

      const existingListenerIds = new Set(
        firebaseListeners.map((listener) => listener.id)
      );
      const existingJobIds = new Set(jobArray.map((job) => job.jobID));

      combinedJobIDs.forEach((id) => {
        if (existingListenerIds.has(id) && existingJobIds.has(id)) return;

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
    requestedJobIDs,
    firebaseListeners,
    updateFirebaseListeners,
    jobArray,
    updateJobArray,
  ]);
}

export default useSubscribeToNewGroupListeners;
