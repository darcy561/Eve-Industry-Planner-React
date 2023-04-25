import { useContext, useMemo } from "react";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../../../Context/AuthContext";
import { CircularProgress, Grid, Typography } from "@mui/material";
import { UserLoginUIContext } from "../../../../Context/LayoutContext";
import { JobArrayContext } from "../../../../Context/JobContext";
import { CompactGroupJobCard } from "./CompactGroupJobCard";
import { CompactJobCardFrame } from "./CompactJobCardFrame";

export function CompactAccordionContents({ updateEditJobTrigger, status }) {
  const { users } = useContext(UsersContext);
  const { groupArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { userJobSnapshotDataFetch } = useContext(UserLoginUIContext);

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
      <Grid container>
        <Grid item xs={12}>
          {groupArray.map((group) => {
            if (group.groupStatus !== status.id) return null;

            return <CompactGroupJobCard key={group.groupID} group={group} />;
          })}

          {userJobSnapshot.map((job) => {
            if (job.jobStatus !== status.id) return null;
            return (
              <CompactJobCardFrame
                key={job.jobID}
                job={job}
                updateEditJobTrigger={updateEditJobTrigger}
              />
            );
          })}
        </Grid>
      </Grid>
    );
  }
}
