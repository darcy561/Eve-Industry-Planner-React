import { Box, Card, Paper, useMediaQuery } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import OutputJobCard from "./OutputCard";

function OutputJobsInfoPanel({
  groupJobs,
  updateHighlightedItem,
  highlightedItems,
}) {
  const [outputJobs, updateOutputJobs] = useState([]);

  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  const deviceBasedWidth = deviceNotMobile ? "100%" : "60%";

  const filteredJobs = useMemo(() => {
    return groupJobs.filter((job) => job.parentJob.length === 0);
  }, [groupJobs]);

  useEffect(() => {
    updateOutputJobs(filteredJobs);
  }, [filteredJobs]);
  return (
    <Paper
      elevation={3}
      square
      sx={{ padding: 1, height: "100%", width: "100%", overflow: "hidden" }}
    >
      <Box sx={{ height: "100%", width: deviceBasedWidth }}>
        {filteredJobs.map((job) => {
          return (
            <OutputJobCard
              key={job.jobID}
              inputJob={job}
              updateHighlightedItem={updateHighlightedItem}
              highlightedItems={highlightedItems}
            />
          );
        })}
      </Box>
    </Paper>
  );
}

export default OutputJobsInfoPanel;
