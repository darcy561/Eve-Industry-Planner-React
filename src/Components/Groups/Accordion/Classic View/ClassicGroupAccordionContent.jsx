import { Grid, Skeleton } from "@mui/material";
import { useContext } from "react";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../Context/JobContext";
import { ClassicGroupJobCardFrame } from "./ClassicGroupJobCardFrame";

export function ClassicGroupAccordionContent({
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
    Array.from({ length: skeletonElementsToDisplay }).map(() => (
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
    ));

  return (
    <Grid container item xs={12} spacing={2}>
      {statusJobs.map(
        (job) =>
          shouldJobBeDisplayed(job) && (
            <ClassicGroupJobCardFrame key={job.jobID} job={job} />
          )
      )}
      {status.id === 0 && displaySkeletons()}
    </Grid>
  );
}
