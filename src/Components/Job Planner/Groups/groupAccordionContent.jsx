import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
    Box,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import { makeStyles } from "@mui/styles";
import { JobCardFrame } from "../Job Cards/JobCard";

const useStyles = makeStyles((theme) => ({
  Accordion: {
    "& .MuiAccordionSummary-root:hover": {
      cursor: "default",
    },
  },
  Header: {
    color:
      theme.palette.type === "dark" ? "secondary" : theme.palette.primary.main,
  },
}));

export function GroupAccordionContent({ status, statusJobs }) {
  const [expanded, updateExpanded] = useState(status.expanded);

  const classes = useStyles();

  return (
    <Accordion
      className={classes.Accordion}
      square
      spacing={1}
      id={status.id}
      disableGutters
      expanded={expanded}
    >
      <AccordionSummary
        expandIcon={
          <Tooltip title="Collapse/Expand Stage" arrow placement="bottom">
            <IconButton
              color="secondary"
              onClick={() => updateExpanded((prev) => !prev)}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Tooltip>
        }
      >
        <Box sx={{ width: "100%", display: "flex", flexDirection: "row" }}>
          <Box sx={{ display: "flex", flex: "1 1 95%", flexDirection: "row" }}>
            <Typography variant="h4" className={classes.Header}>
              {status.name}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row" }}>
            <Tooltip
              title={`Select all jobs in the ${status.name} stage`}
              arrow
              placement="bottom"
            >
              <IconButton color="secondry" onClicl={() => {}}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container item xs={12} spacing={2}>
          {statusJobs.map((job) => {
            return <JobCardFrame key={job.jobID} job={job} />;
          })}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}