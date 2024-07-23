import { useContext } from "react";
import { UserJobSnapshotContext } from "../../../../Context/AuthContext";
import {
  Card,
  CircularProgress,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import { UserLoginUIContext } from "../../../../Context/LayoutContext";
import { JobArrayContext } from "../../../../Context/JobContext";
import { CompactGroupJobCard } from "./CompactGroupJobCard";
import { CompactJobCardFrame } from "./CompactJobCardFrame";
import uuid from "react-uuid";

export function CompactAccordionContents({
  status,
  skeletonElementsToDisplay,
}) {
  const { groupArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { userJobSnapshotDataFetch } = useContext(UserLoginUIContext);

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
            return <CompactJobCardFrame key={job.jobID} job={job} />;
          })}
          {status.id === 0 &&
            Array.from({ length: skeletonElementsToDisplay }).map(
              (_, index) => {
                return (
                  <Card key={uuid()} sx={{ marginTop: "5px", marginBottom: "5px", padding:0, height:40 }}>
                    <Skeleton
                      variant="rectangular" 
                      animation="wave"
                      width="100%"
                      height="100%"
                    />
                  </Card>
                );
              }
            )}
        </Grid>
      </Grid>
    );
  }
}
