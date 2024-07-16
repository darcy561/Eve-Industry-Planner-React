import { useContext, useState } from "react";
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import { grey } from "@mui/material/colors";
import { JobArrayContext, JobStatusContext } from "../../../Context/JobContext";
import { UserJobSnapshotContext } from "../../../Context/AuthContext";
import { useDnD } from "../../../Hooks/useDnD";
import { useDrop } from "react-dnd";
import {
  ApplicationSettingsContext,
  MultiSelectJobPlannerContext,
} from "../../../Context/LayoutContext";
import { ItemTypes } from "../../../Context/DnDTypes";
import { CompactGroupAccordionContent } from "./Compact/CompactGroupAccordionContent";
import { ClassicGroupAccordionContent } from "./Classic/ClassicGroupAccordionContent";
import GLOBAL_CONFIG from "../../../global-config-app";
import { useHelperFunction } from "../../../Hooks/GeneralHooks/useHelperFunctions";

export function GroupAccordion({ groupJobs, groupPageRefresh }) {
  const { activeGroup } = useContext(JobArrayContext);
  const { jobStatus } = useContext(JobStatusContext);
  const { applicationSettings } = useContext(ApplicationSettingsContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { jobArray } = useContext(JobArrayContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { canDropCard, recieveJobCardToStage } = useDnD();
  const [notExpanded, updateNotExpanded] = useState([]);
  const { findParentUser } = useHelperFunction();
  const { PRIMARY_THEME } = GLOBAL_CONFIG;

  const parentUser = findParentUser();

  if (groupPageRefresh && !activeGroup) return null;

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
            square
            spacing={1}
            id={status.id}
            disableGutters
            expanded={!notExpanded.includes(status.id)}
            sx={{
              "& .MuiAccordionSummary-root:hover": {
                cursor: "default",
              },
              ...(canDrop &&
                !isOver && {
                  backgroundColor: (theme) =>
                    theme.palette.mode !== "dark" ? grey[400] : grey[700],
                }),
              ...(canDrop &&
                isOver && {
                  backgroundColor: (theme) =>
                    theme.palette.mode !== "dark" ? grey[600] : grey[600],
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
                  <Typography
                    variant="h4"
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === PRIMARY_THEME
                          ? "secondary"
                          : theme.palette.primary.main,
                    }}
                  >
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
                      <SelectAllIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {applicationSettings.enableCompactView ? (
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
