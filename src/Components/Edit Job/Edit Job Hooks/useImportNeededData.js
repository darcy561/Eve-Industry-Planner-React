import { useContext, useEffect, useState } from "react";
import {
  ArchivedJobsContext,
  JobArrayContext,
} from "../../../Context/JobContext";
import { useSystemIndexFunctions } from "../../../Hooks/GeneralHooks/useSystemIndexFunctions";
import { useFirebase } from "../../../Hooks/useFirebase";
import { IsLoggedIn, IsLoggedInContext } from "../../../Context/AuthContext";
import {
  EvePricesContext,
  SystemIndexContext,
} from "../../../Context/EveDataContext";

function useImportMissingData_EditJob(requestedJobID) {
  const { jobArray } = useContext(JobArrayContext);
  const { IsLoggedIn } = useContext(IsLoggedInContext);
  const { updateArchivedJobs } = useContext(ArchivedJobsContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { updateSystemIndexData } = useContext(SystemIndexContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { findMissingSystemIndex } = useSystemIndexFunctions();
  const { getArchivedJobData, getItemPrices } = useFirebase();

  useEffect(() => {
    async function retrieveMissingData() {
      setLoading(true);
      setError(null);
      try {
        let priceIDsToRequest = new Set();
        let systemIndexToRequest = new Set();
        const matchedJob = jobArray.find((i) => i.jobID === requestedJobID);
        const linkedJobs = jobArray.filter(
          (i) =>
            i.jobID === requestedJobID ||
            matchedJob.getRelatedJobs().includes(i.jobID)
        );

        linkedJobs.forEach((job) => {
          job.getMaterialIDs().forEach((i) => priceIDsToRequest.add(i));
          job.getSystemIndexes().forEach((i) => systemIndexToRequest.add(i));
        });

        const systemIndexResults = await findMissingSystemIndex([
          ...systemIndexToRequest,
        ]);
        if (IsLoggedIn) {
          const newArchivedJobsArray = await getArchivedJobData(requestedJobID);
          updateArchivedJobs(newArchivedJobsArray);
        }
        const itemPriceResults = await getItemPrices([...priceIDsToRequest]);

        updateEvePrices((prev) => ({
          ...prev,
          ...itemPriceResults,
        }));
        updateSystemIndexData((prev) => ({ ...prev, ...systemIndexResults }));
      } catch (err) {
        console.error("Error retrieving data for Job:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (requestedJobID) {
      retrieveMissingData();
    }
  }, [requestedJobID]);
  return { loading, error };
}

export default useImportMissingData_EditJob;
