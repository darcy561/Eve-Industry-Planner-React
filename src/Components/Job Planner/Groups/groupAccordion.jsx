import { Paper } from "@mui/material";
import { useContext } from "react";
import { JobArrayContext, JobStatusContext } from "../../../Context/JobContext";
import { GroupAccordionContent } from "./groupAccordionContent";

export function GroupAccordion({ groupJobs, groupPageRefresh }) {
  const { activeGroup } = useContext(JobArrayContext);
  const { jobStatus } = useContext(JobStatusContext);

  if (!groupPageRefresh && activeGroup !== null) {
    return (
      <Paper
        elevation={3}
        square
        sx={{ marginRight: { md: "10px" }, marginLeft: { md: "10px" } }}
      >
        {jobStatus.map((status) => {
          let statusJobs = groupJobs.filter((i) => i.jobStatus === status.id);
          if (status.id !== 4) {
            return (
              <GroupAccordionContent
                key={status.id}
                status={status}
                statusJobs={statusJobs}
              />
            );
          } else return null;
        })}
      </Paper>
    );
  } else {
    return <Paper>Refresh</Paper>;
  }
}
