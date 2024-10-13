import React, { useContext, useState } from "react";
import { JobArrayContext, JobStatusContext } from "../../../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../../Context/AuthContext";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import { StatusSettings } from "./StatusSettings";
import {
  ApplicationSettingsContext,
  MultiSelectJobPlannerContext,
} from "../../../Context/LayoutContext";
import { ClassicAccordionContents } from "./Classic/classicContents";
import { useDrop } from "react-dnd";
import { useDnD } from "../../../Hooks/useDnD";
import { ItemTypes } from "../../../Context/DnDTypes";
import { grey } from "@mui/material/colors";
import GLOBAL_CONFIG from "../../../global-config-app";
import { CompactAccordionContents } from "./Compact/CompactContents";

export function PlannerAccordion({ skeletonElementsToDisplay }) {
  const { applicationSettings } = useContext(ApplicationSettingsContext);
  const { jobStatus, setJobStatus } = useContext(JobStatusContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { jobArray } = useContext(JobArrayContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const [statusSettingsTrigger, updateStatusSettingsTrigger] = useState(false);
  const [statusData, updateStatusData] = useState({
    id: 0,
    name: "",
    sortOrder: 0,
    expanded: true,
    openAPIJobs: false,
    completeAPIJobs: false,
  });
  const { canDropCard, recieveJobCardToStage } = useDnD();
  const { PRIMARY_THEME } = GLOBAL_CONFIG;

  function handleExpand(statusID) {
    const index = jobStatus.findIndex((x) => x.id === statusID);
    let newStatusArray = [...jobStatus];
    newStatusArray[index].expanded = !newStatusArray[index].expanded;
    setJobStatus(newStatusArray);
  }

  return (  
    <Box
      sx={{
        display: "flex",
        order: { xs: 2, md: 1 },
        width: "100%",
        height: "100%",
      }}
    >
      <Paper
        elevation={3}
        square
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {jobStatus.map((status) => {
          const [{ isOver, canDrop }, drop] = useDrop(
            () => ({
              accept: [ItemTypes.jobCard, ItemTypes.groupCard],
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
          return (
            <Accordion
              ref={drop}
              expanded={status.expanded}
              square
              spacing={1}
              id={status.id}
              key={status.id}
              disableGutters
              sx={{
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
                "& .MuiAccordionSummary-root:hover": {
                  cursor: "default",
                },
                flexGrow: 1,
                flexShrink: 0,
              }}
            >
              <AccordionSummary
                expandIcon={
                  <Tooltip
                    title="Collapse/Expand Stage"
                    arrow
                    placement="bottom"
                  >
                    <IconButton
                      color="secondary"
                      onClick={() => handleExpand(status.id)}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </Tooltip>
                }
                aria-label="Expand Icon"
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
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Tooltip
                      title={`Select all jobs in the ${status.name} stage.`}
                      arrow
                      placement="bottom"
                    >
                      <IconButton
                        color="secondary"
                        onClick={() => {
                          let newMultiArray = new Set([
                            ...multiSelectJobPlanner,
                          ]);
                          userJobSnapshot.forEach((job) => {
                            if (job.jobStatus === status.id) {
                              newMultiArray.add(job.jobID);
                            }
                          });
                          updateMultiSelectJobPlanner([...newMultiArray]);
                        }}
                      >
                        <SelectAllIcon />
                      </IconButton>
                    </Tooltip>
                    {isLoggedIn && (
                      <Tooltip
                        title="Change status settings"
                        arrow
                        placement="bottom"
                      >
                        <IconButton
                          color="secondary"
                          onClick={() => {
                            updateStatusData(status);
                            updateStatusSettingsTrigger(true);
                          }}
                        >
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {applicationSettings.enableCompactView ? (
                  <CompactAccordionContents
                    status={status}
                    skeletonElementsToDisplay={skeletonElementsToDisplay}
                  />
                ) : (
                  <ClassicAccordionContents
                    status={status}
                    skeletonElementsToDisplay={skeletonElementsToDisplay}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
        <StatusSettings
          statusData={statusData}
          updateStatusData={updateStatusData}
          statusSettingsTrigger={statusSettingsTrigger}
          updateStatusSettingsTrigger={updateStatusSettingsTrigger}
        />
      </Paper>
    </Box>
  );
}
