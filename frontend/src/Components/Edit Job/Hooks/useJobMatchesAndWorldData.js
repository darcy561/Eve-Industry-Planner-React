import { useState, useEffect } from "react";
import useUsersStore from "../../../Zustand/usersStore";
import { useQueryClient } from "@tanstack/react-query";
import { fetchLocationNames } from "../../../Hooks/React Query/World/locationNames";
import findIndustryJobsForItem from "../../../Functions/IndustryJobs/findIndustryJobsForItem";

export function useGatherJobMatchesAndUpdateExistingLinkedJobs(
  allIndustryJobs,
  activeJob,
  linkedJobs,
  esiDataToLink,
) {
  const queryClient = useQueryClient();
  const [jobMatches, setJobMatches] = useState([]);
  const [isWorldDataLoading, setIsWorldDataLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function processGatherJobMatchesAndUpdateExistingLinkedJobs() {
      if (!allIndustryJobs) {
        setJobMatches([]);
        setError(null);
        return;
      }

      try {
        setIsWorldDataLoading(true);
        setError(null);

        const matches = findIndustryJobsForItem(allIndustryJobs, activeJob, {
          linkedAcrossAccount: linkedJobs,
          beingRemoved: esiDataToLink.industryJobs.remove,
        });

        activeJob.updateLinkedJobData(allIndustryJobs);
        setJobMatches(matches);

        const allLocationIDs = new Set();
        matches.forEach((job) => {
          if (job.location_id) allLocationIDs.add(job.location_id);
          if (job.facility_id) allLocationIDs.add(job.facility_id);
          if (job.station_id) allLocationIDs.add(job.station_id);
        });

        if (activeJob.build.costs.linkedJobs.length > 0) {
          activeJob.build.costs.linkedJobs.forEach((job) => {
            if (job.location_id) allLocationIDs.add(job.location_id);
            if (job.facility_id) allLocationIDs.add(job.facility_id);
            if (job.station_id) allLocationIDs.add(job.station_id);
          });
        }

        if (allLocationIDs.size > 0) {
          const names = await fetchLocationNames(
            queryClient,
            allLocationIDs,
            Object.values(useUsersStore.getState().account.characters),
          );
          useUsersStore.getState().worldData.actions.addUniverseIDs(names);
        }

        setIsWorldDataLoading(false);
      } catch (err) {
        setError(err);
        setIsWorldDataLoading(false);
      }
    }

    processGatherJobMatchesAndUpdateExistingLinkedJobs();
  }, [allIndustryJobs, linkedJobs, esiDataToLink]);

  return {
    jobMatches,
    isWorldDataLoading,
    error,
  };
}
