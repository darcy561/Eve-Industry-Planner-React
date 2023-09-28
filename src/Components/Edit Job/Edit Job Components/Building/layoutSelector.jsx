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
  jobModified,
  setJobModified,
}) {
  const { apiJobs } = useContext(ApiJobsContext);
  const { users } = useContext(UsersContext);
  const { linkedJobIDs } = useContext(LinkedIDsContext);

  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const jobMatches = useMemo(() => {
    return apiJobs.filter(
      (job) =>
        activeJob.itemID === job.product_type_id &&
        !activeJob.apiJobs.has(job.job_id) &&
        !linkedJobIDs.includes(job.job_id) &&
        !parentUser.linkedJobs.has(job.job_id)
    );
  }, [apiJobs, linkedJobIDs, parentUser]);

  switch (deviceNotMobile) {
    case true:
      return (
        <Building_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          jobModified={jobModified}
          setJobModified={setJobModified}
          parentUser={parentUser}
          jobMatches={jobMatches}
        />
      );
    case false:
      return (
        <Building_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          jobModified={jobModified}
          setJobModified={setJobModified}
          parentUser={parentUser}
          jobMatches={jobMatches}
        />
      );
    default:
      return (
        <Building_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          jobModified={jobModified}
          setJobModified={setJobModified}
          parentUser={parentUser}
          jobMatches={jobMatches}
        />
      );
  }
}
