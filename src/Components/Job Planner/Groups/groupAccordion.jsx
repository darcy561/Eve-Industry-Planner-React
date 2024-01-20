<<<<<<< HEAD
=======
import { useContext, useMemo, useState } from "react";
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
<<<<<<< HEAD
import { useContext, useMemo, useState } from "react";
import { JobArrayContext, JobStatusContext } from "../../../Context/JobContext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
=======
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import { grey } from "@mui/material/colors";
import { JobArrayContext, JobStatusContext } from "../../../Context/JobContext";
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../../Context/AuthContext";
import { useDnD } from "../../../Hooks/useDnD";
import { useDrop } from "react-dnd";
import { MultiSelectJobPlannerContext } from "../../../Context/LayoutContext";
import { ItemTypes } from "../../../Context/DnDTypes";
<<<<<<< HEAD
import { makeStyles } from "@mui/styles";
import { CompactGroupAccordionContent } from "./Compact/CompactGroupAccordionContent";
import { ClassicGroupAccordionContent } from "./Classic/ClassicGroupAccordionContent";
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
=======
import { CompactGroupAccordionContent } from "./Compact/CompactGroupAccordionContent";
import { ClassicGroupAccordionContent } from "./Classic/ClassicGroupAccordionContent";
import GLOBAL_CONFIG from "../../../global-config-app";
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569

export function GroupAccordion({ groupJobs, groupPageRefresh }) {
  const { activeGroup } = useContext(JobArrayContext);
  const { jobStatus } = useContext(JobStatusContext);
  const { users } = useContext(UsersContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { jobArray } = useContext(JobArrayContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { canDropCard, recieveJobCardToStage } = useDnD();
<<<<<<< HEAD

  const [notExpanded, updateNotExpanded] = useState([]);

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);
  const classes = useStyles();

  if (groupPageRefresh && activeGroup == null) return null;
=======
  const [notExpanded, updateNotExpanded] = useState([]);
  const { PRIMARY_THEME } = GLOBAL_CONFIG;

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  if (groupPageRefresh && !activeGroup) return null;
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569

  return (
    <Paper
      elevation={3}
      square
      sx={{ marginRight: { md: "10px" }, marginLeft: { md: "10px" } }}
    >
      {jobStatus.map((status) => {
        const statusJobs = groupJobs.filter((i) => i.jobStatus === status.id);

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
        if (status.id === 4) return null;

        return (
          <Accordion
            key={status.id}
            ref={drop}
<<<<<<< HEAD
            className={classes.Accordion}
=======
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
            square
            spacing={1}
            id={status.id}
            disableGutters
            expanded={!notExpanded.includes(status.id)}
            sx={{
<<<<<<< HEAD
              ...(canDrop &&
                !isOver && {
                  backgroundColor: (theme) =>
                    theme.palette.type !== "dark" ? grey[400] : grey[700],
=======
              "& .MuiAccordionSummary-root:hover": {
                cursor: "default",
              },
              ...(canDrop &&
                !isOver && {
                  backgroundColor: (theme) =>
                    theme.palette.mode !== "dark" ? grey[400] : grey[700],
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
                }),
              ...(canDrop &&
                isOver && {
                  backgroundColor: (theme) =>
<<<<<<< HEAD
                    theme.palette.type !== "dark" ? grey[600] : grey[600],
=======
                    theme.palette.mode !== "dark" ? grey[600] : grey[600],
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
                }),
            }}
          >
            <AccordionSummary
              expandIcon={
                <Tooltip title="Collapse/Expand Stage" arrow placement="bottom">
                  <IconButton
                    color="secondary"
                    onClick={() => {
                      if (notExpanded.includes(status.id)) {
                        updateNotExpanded((prev) => {
                          return prev.filter((i) => i !== status.id);
                        });
                      } else
                        updateNotExpanded((prev) => {
                          return [...new Set([...prev, status.id])];
                        });
                    }}
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </Tooltip>
              }
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flex: "1 1 95%",
                    flexDirection: "row",
                  }}
                >
<<<<<<< HEAD
                  <Typography variant="h4" className={classes.Header}>
=======
                  <Typography
                    variant="h4"
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === PRIMARY_THEME
                          ? "secondary"
                          : theme.palette.primary.main,
                    }}
                  >
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
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
                      color="secondary"
                      onClick={() => {
                        const selectedJobIds = statusJobs.reduce((acc, job) => {
                          return acc.add(job.jobID);
                        }, new Set(multiSelectJobPlanner));

                        updateMultiSelectJobPlanner([...selectedJobIds]);
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {parentUser.settings.layout.enableCompactView ? (
                <CompactGroupAccordionContent
                  status={status}
                  statusJobs={statusJobs}
                />
              ) : (
                <ClassicGroupAccordionContent
                  status={status}
                  statusJobs={statusJobs}
                />
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Paper>
  );
}
