import { Card, Grid } from "@mui/material";
import { useContext } from "react";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../Context/JobContext";
import { CompactGroupJobCardFrame } from "./CompactGroupJobCardFrame";

export function CompactGroupAccordionContent({
  status,
  statusJobs,
  skeletonElementsToDisplay,
}) {
  const { activeGroup } = useContext(ActiveJobContext);
  const { groupArray } = useContext(JobArrayContext);

  const activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);

  const shouldJobBeDisplayed = (job) => {
    if (!activeGroupObject) return false;

    return (
      activeGroupObject.showComplete ||
      !activeGroupObject.areComplete.has(job.jobID)
    );
  };

  const displaySkeletons = () =>
    Array.from({ length: skeletonElementsToDisplay }).map((_, index) => (
      <Card
        key={uuid()}
        sx={{
          marginTop: "5px",
          marginBottom: "5px",
          padding: 0,
          height: 40,
        }}
      >
        <Skeleton
          variant="rectangular"
          animation="wave"
          width="100%"
          height="100%"
        />
      </Card>
    ));

  return (
    <Grid container>
      <Grid item xs={12}>
        {statusJobs.map(
          (job) =>
            shouldJobBeDisplayed(job) && (
              <CompactGroupJobCardFrame
                key={job.jobID}
                job={job}
                skeletonElementsToDisplay={skeletonElementsToDisplay}
              />
            )
        )}
        {status.id === 0 && displaySkeletons()}
      </Grid>
    </Grid>
  );
}
