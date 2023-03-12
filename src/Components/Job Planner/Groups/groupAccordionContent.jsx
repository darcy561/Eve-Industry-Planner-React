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
import { useContext, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import { makeStyles } from "@mui/styles";
import { GroupJobCardFrame } from "./groupJobCards";
import { MultiSelectJobPlannerContext } from "../../../Context/LayoutContext";
import { UserJobSnapshotContext } from "../../../Context/AuthContext";
import { ActiveJobContext, JobArrayContext } from "../../../Context/JobContext";
import { useDrop } from "react-dnd";
import { useDnD } from "../../../Hooks/useDnD";
import { ItemTypes } from "../../../Context/DnDTypes";
import { grey } from "@mui/material/colors";

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
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { activeGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { jobArray } = useContext(JobArrayContext);
  const { canDropCard, recieveJobCardToStage } = useDnD();
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.jobCard,
      drop: (item) => {
        recieveJobCardToStage(item, status);
      },
      canDrop: (item) => canDropCard(item, status),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [status, userJobSnapshot, jobArray]
  );

  const classes = useStyles();

  return (
    <Accordion
      ref={drop}
      className={classes.Accordion}
      square
      spacing={1}
      id={status.id}
      disableGutters
      expanded={expanded}
      sx={{
        ...(canDrop &&
          !isOver && {
            backgroundColor: (theme) =>
              theme.palette.type !== "dark" ? grey[400] : grey[700],
          }),
        ...(canDrop &&
          isOver && {
            backgroundColor: (theme) =>
              theme.palette.type !== "dark" ? grey[600] : grey[600],
          }),
      }}
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
              <IconButton
                color="secondry"
                onClick={() => {
                  let newMultiArray = new Set([...multiSelectJobPlanner]);
                  statusJobs.forEach((job) => {
                    newMultiArray.add(job.jobID);
                  });
                  updateMultiSelectJobPlanner([...newMultiArray]);
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container item xs={12} spacing={2}>
          {statusJobs.map((job) => {
            if (!activeGroup.showComplete) {
              if (!activeGroup.areComplete.includes(job.jobID)) {
                return <GroupJobCardFrame key={job.jobID} job={job} />;
              } else return null;
            } else return <GroupJobCardFrame key={job.jobID} job={job} />;
          })}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}
