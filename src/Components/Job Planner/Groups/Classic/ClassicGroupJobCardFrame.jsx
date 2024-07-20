import { useContext, useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Grid,
  Grow,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { grey } from "@mui/material/colors";
import { jobTypes } from "../../../../Context/defaultValues";
import { MultiSelectJobPlannerContext } from "../../../../Context/LayoutContext";
import GroupStep2JobCard from "./JobCards/groupStep2";
import GroupStep3JobCard from "./JobCards/groupStep3";
import GroupStep4JobCard from "./JobCards/groupStep4";
import GroupStep5JobCard from "./JobCards/groupStep5";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../../../../Context/DnDTypes";
import { useDeleteSingleJob } from "../../../../Hooks/JobHooks/useDeleteSingleJob";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../Context/JobContext";
import GLOBAL_CONFIG from "../../../../global-config-app";
import GroupStep1JobCard from "./JobCards/groupStep1";
import { useNavigate } from "react-router-dom";

function DisplaySwitch({ job }) {
  switch (job.jobStatus) {
    case 0:
      return <GroupStep1JobCard job={job} />;
    case 1:
      return <GroupStep2JobCard job={job} />;
    case 2:
      return <GroupStep3JobCard job={job} />;
    case 3:
      return <GroupStep4JobCard job={job} />;
    case 4:
      return <GroupStep5JobCard job={job} />;
    default:
      return <GroupStep1JobCard job={job} />;
  }
}

export function ClassicGroupJobCardFrame({ job }) {
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { activeGroup } = useContext(ActiveJobContext);
  const { groupArray } = useContext(JobArrayContext);
  const { deleteSingleJob } = useDeleteSingleJob();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.jobCard,
    item: {
      id: job.jobID,
      cardType: ItemTypes.jobCard,
      currentStatus: job.jobStatus,
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  const { PRIMARY_THEME } = GLOBAL_CONFIG;

  const activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);

  const jobCardChecked = useMemo(() => {
    return multiSelectJobPlanner.some((i) => i === job.jobID);
  }, [multiSelectJobPlanner]);

  const jobMarkedAsCompelte = useMemo(() => {
    return activeGroupObject.areComplete.includes(job.jobID);
  }, [activeGroupObject]);

  const navigate = useNavigate();

  return (
    <Grow in={true}>
      <Grid ref={drag} item xs={12} sm={6} md={4} lg={3}>
        <Paper
          elevation={3}
          square
          sx={{
            padding: "10px",
            height: "100%",
            width: "100%",
            backgroundColor: (theme) =>
              jobCardChecked || isDragging
                ? theme.palette.mode !== "dark"
                  ? grey[300]
                  : grey[900]
                : "none",
            cursor: "grab",
          }}
        >
          <Box sx={{ display: "flex", height: "100%" }}>
            <Grid container direction="column" xs={12}>
              <Grid container item xs={12}>
                <Grid container item xs={12}>
                  <Grid item xs={6} akign="left">
                    <Checkbox
                      disabled={job.isLocked}
                      sx={{
                        color: (theme) =>
                          theme.palette.mode === PRIMARY_THEME
                            ? theme.palette.primary.main
                            : theme.palette.secondary.main,
                      }}
                      checked={jobCardChecked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          if (!multiSelectJobPlanner.includes(job.jobID)) {
                            updateMultiSelectJobPlanner((prev) =>
                              prev.concat(job.jobID)
                            );
                          }
                        } else {
                          updateMultiSelectJobPlanner((prev) =>
                            prev.filter((i) => i !== job.jobID)
                          );
                        }
                      }}
                    />
                  </Grid>

                  <Grid item align="right" xs={6}>
                    <IconButton
                      disabled={job.isLocked}
                      sx={{
                        color: (theme) =>
                          theme.palette.mode === PRIMARY_THEME
                            ? theme.palette.primary.main
                            : theme.palette.secondary.main,
                      }}
                      onClick={() => deleteSingleJob(job.jobID)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sx={{ marginBottom: { xs: "5px", sm: "10px" } }}
                >
                  <Typography color="secondary" align="center" variant="body1">
                    {job.name}
                  </Typography>
                </Grid>
                <Grid
                  container
                  item
                  xs={12}
                  sx={{
                    marginLeft: { xs: "10px", md: "0px" },
                    marginRight: { xs: "20px", md: "30px" },
                  }}
                >
                  <Grid
                    container
                    item
                    xs={2}
                    sm={3}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Avatar
                      src={`https://images.evetech.net/types/${job.itemID}/icon?size=64`}
                      alt={job.name}
                      variant="square"
                    />
                  </Grid>
                  <DisplaySwitch job={job} />
                </Grid>
                <Grid container item xs={12} sx={{ alignItems: "flex-end" }}>
                  <Grid item xs={12} align="center" sx={{ marginTop: "5px" }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      disabled={job.isLocked}
                      onClick={() => {
                        navigate(`/editJob/${job.jobID}`);
                      }}
                      sx={{ height: "25px", width: "100px" }}
                    >
                      {job.isLocked ? "Locked" : "Edit"}
                    </Button>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sx={{
                      backgroundColor:
                        job.jobType === jobTypes.manufacturing
                          ? "manufacturing.main"
                          : "reaction.main",
                      marginTop: "10px",
                    }}
                  >
                    <Typography align="center" variant="body2" color="black">
                      {jobMarkedAsCompelte ? (
                        <b>Complete</b>
                      ) : job.jobType === jobTypes.manufacturing ? (
                        <b>Manufacturing Job</b>
                      ) : (
                        <b>Reaction Job</b>
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Grid>
    </Grow>
  );
}
