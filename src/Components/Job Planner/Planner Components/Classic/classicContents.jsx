import { CircularProgress, Grid, Skeleton, Typography } from "@mui/material";
import { useContext, useMemo } from "react";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../../../Context/AuthContext";
import {
  ApiJobsContext,
  JobArrayContext,
  LinkedIDsContext,
} from "../../../../Context/JobContext";
import { JobCardFrame } from "./ClassicJobCardFrame";
import { ClassicGroupJobCard } from "./ClassicGroupJobCard";
import { UserLoginUIContext } from "../../../../Context/LayoutContext";
import uuid from "react-uuid";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";
import ClassiceAPIJobCard from "./Job Cards/ClassicApiJobCard";

export function ClassicAccordionContents({
  status,
  skeletonElementsToDisplay,
}) {
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { groupArray } = useContext(JobArrayContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { linkedJobIDs } = useContext(LinkedIDsContext);
  const { userJobSnapshotDataFetch } = useContext(UserLoginUIContext);
  const { findParentUser } = useHelperFunction();

  const parentUser = findParentUser();

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
      <Grid container item xs={12} spacing={2} sx={{ height: "100%" }}>
        {groupArray.map((group) => {
          if (group.groupStatus === status.id) {
            return <ClassicGroupJobCard key={uuid()} group={group} />;
          } else {
            return null;
          }
        })}
        {userJobSnapshot.map((job) => {
          if (job.jobStatus === status.id) {
            return <JobCardFrame key={uuid()} job={job} />;
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
              return <ClassiceAPIJobCard key={uuid()} job={j} />;
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
              return <ClassiceAPIJobCard key={uuid()} job={j} />;
            } else {
              return null;
            }
          })}
        {status.id === 0 &&
          Array.from({ length: skeletonElementsToDisplay }).map((_, index) => {
            return (
              <Grid
                key={uuid()}
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                sx={{ minHeight: 200, width: "100%" }}
              >
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height="100%"
                />
              </Grid>
            );
          })}
      </Grid>
    );
  }
}
