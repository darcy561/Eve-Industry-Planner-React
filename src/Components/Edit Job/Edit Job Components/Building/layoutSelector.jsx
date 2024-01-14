import { useContext, useMemo } from "react";
import {
  ApiJobsContext,
  LinkedIDsContext,
} from "../../../../Context/JobContext";
import { UsersContext } from "../../../../Context/AuthContext";
import { useMediaQuery } from "@mui/material";
import { Building_StandardLayout_EditJob } from "./StandardLayout/standardLayout";

export function LayoutSelector_EditJob_Building({
  activeJob,
  updateActiveJob,
  setJobModified,
  esiDataToLink,
  updateEsiDataToLink
}) {
  const { apiJobs } = useContext(ApiJobsContext);
  const { users } = useContext(UsersContext);
  const { linkedJobIDs } = useContext(LinkedIDsContext);

  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const jobMatches = useMemo(() => {
    const uniqueJobIds = new Set(); 
  
    return apiJobs.filter((job) => {
      const isDuplicate = uniqueJobIds.has(job.job_id);

      if (!isDuplicate) {
        uniqueJobIds.add(job.job_id);
      }

      return (
        !isDuplicate &&
        activeJob.itemID === job.product_type_id &&
        !activeJob.apiJobs.has(job.job_id) &&
        !linkedJobIDs.includes(job.job_id) &&
        !parentUser.linkedJobs.has(job.job_id)
      );
    });
  }, [apiJobs, activeJob, linkedJobIDs, parentUser]);
  

  console.log(jobMatches)

  switch (deviceNotMobile) {
    case true:
      return (
        <Building_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob} 
          setJobModified={setJobModified}
          parentUser={parentUser}
          jobMatches={jobMatches}
          esiDataToLink={esiDataToLink}
          updateEsiDataToLink={updateEsiDataToLink}
        />
      );
    case false:
      return (
        <Building_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          parentUser={parentUser}
          jobMatches={jobMatches}
          esiDataToLink={esiDataToLink}
          updateEsiDataToLink={updateEsiDataToLink}
        />
      );
    default:
      return (
        <Building_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          parentUser={parentUser}
          jobMatches={jobMatches}
          esiDataToLink={esiDataToLink}
          updateEsiDataToLink={updateEsiDataToLink}
        />
      );
  }
}
