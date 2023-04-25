import React, { useContext, useMemo, useState } from "react";
import { JobArrayContext, JobStatusContext } from "../../../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
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
import AddIcon from "@mui/icons-material/Add";
import { StatusSettings } from "./StatusSettings";
import { MultiSelectJobPlannerContext } from "../../../Context/LayoutContext";
import { makeStyles } from "@mui/styles";
import { ClassicAccordionContents } from "./Classic/classicContents";
import { useDrop } from "react-dnd";
import { useDnD } from "../../../Hooks/useDnD";
import { ItemTypes } from "../../../Context/DnDTypes";
import { grey } from "@mui/material/colors";
import { CompactAccordionContents } from "./Compact/compactContents";

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

export function PlannerAccordion({ updateEditJobTrigger }) {
  const { users } = useContext(UsersContext);
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

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const classes = useStyles();

  function handleExpand(statusID) {
    const index = jobStatus.findIndex((x) => x.id === statusID);
    let newStatusArray = [...jobStatus];
    newStatusArray[index].expanded = !newStatusArray[index].expanded;
    setJobStatus(newStatusArray);
  }

  return (
    <Paper
      elevation={3}
      sx={{ marginRight: { md: "10px" }, marginLeft: { md: "10px" } }}
      square={true}
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
            className={classes.Accordion}
            expanded={status.expanded === true}
            square={true}
            spacing={1}
            id={status.id}
            key={status.id}
            disableGutters={true}
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
                  <Typography variant="h4" className={classes.Header}>
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
                        let newMultiArray = new Set([...multiSelectJobPlanner]);
                        userJobSnapshot.forEach((job) => {
                          if (job.jobStatus === status.id) {
                            newMultiArray.add(job.jobID);
                          }
                        });
                        updateMultiSelectJobPlanner([...newMultiArray]);
                      }}
                    >
                      <AddIcon />
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
              {parentUser.settings.layout.enableCompactView ? (
                <CompactAccordionContents
                  updateEditJobTrigger={updateEditJobTrigger}
                  status={status}
                />
              ) : (
                <ClassicAccordionContents
                  updateEditJobTrigger={updateEditJobTrigger}
                  status={status}
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
  );
}
