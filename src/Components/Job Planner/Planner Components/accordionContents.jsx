import { CircularProgress, Grid, Typography } from "@mui/material";
import { useContext, useMemo } from "react";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../../Context/AuthContext";
import {
  ApiJobsContext,
  JobArrayContext,
  LinkedIDsContext,
} from "../../../Context/JobContext";
import { JobCardFrame } from "../Job Cards/JobCard";
import { ApiJobCard } from "../Job Cards/ApiJobCard";
import { GroupJobCard } from "../Job Cards/groupJobCard";

export function AccordionContents({ updateEditJobTrigger, status }) {
  const { users } = useContext(UsersContext);
  const { userJobSnapshot, userJobSnapshotDataFetch } = useContext(
    UserJobSnapshotContext
  );
  const { groupArray } = useContext(JobArrayContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { linkedJobIDs } = useContext(LinkedIDsContext);

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  if (!userJobSnapshotDataFetch) {
    return (
      <Grid container align="center">
        <Grid item xs={12}>
          <CircularProgress color="primary" />
        </Grid>
        <Grid item xs={12}>
          <Typography sx={{ typography: { xs: "caption", sm: "body1" } }}>
            Building Job Data
          </Typography>
        </Grid>
      </Grid>
    );
  } else {
    return (
      <Grid container direction="row" item xs={12} spacing={2}>
        {groupArray.map((group) => {
          if (group.groupStatus === status.id) {
            return <GroupJobCard key={group.groupID} group={group} />;
          } else {
            return null;
          }
        })}
        {userJobSnapshot.map((job) => {
          if (job.jobStatus === status.id) {
            return (
              <JobCardFrame
                key={job.jobID}
                job={job}
                updateEditJobTrigger={updateEditJobTrigger}
              />
            );
          } else {
            return null;
          }
        })}

        {status.openAPIJobs &&
          apiJobs.map((j) => {
            if (
              !parentUser.linkedJobs.has(j.job_id) &&
              !linkedJobIDs.includes(j.job_id) &&
              j.status === "active"
            ) {
              return <ApiJobCard key={j.job_id} job={j} />;
            } else {
              return null;
            }
          })}

        {status.completeAPIJobs &&
          apiJobs.map((j) => {
            if (
              !parentUser.linkedJobs.has(j.job_id) &&
              !linkedJobIDs.includes(j.job_id) &&
              j.status === "delivered"
            ) {
              return <ApiJobCard key={j.job_id} job={j} />;
            } else {
              return null;
            }
          })}
      </Grid>
    );
  }
}
