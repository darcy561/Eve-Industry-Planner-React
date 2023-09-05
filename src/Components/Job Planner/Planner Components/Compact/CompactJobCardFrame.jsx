import { useContext, useMemo } from "react";
import { MultiSelectJobPlannerContext } from "../../../../Context/LayoutContext";
import { useOpenEditJob } from "../../../../Hooks/JobHooks/useOpenEditJob";
import { useDeleteSingleJob } from "../../../../Hooks/JobHooks/useDeleteSingleJob";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../../../../Context/DnDTypes";
import { jobTypes } from "../../../../Context/defaultValues";
import PlannerInfoBadge from "./PlannerInfoBadge";
import DeleteIcon from "@mui/icons-material/Delete";
import { deepPurple, grey, lightGreen } from "@mui/material/colors";
import {
  Button,
  Card,
  Checkbox,
  Grid,
  Icon,
  IconButton,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function getCardColor(theme, jobType) {
  if (jobType === jobTypes.manufacturing) {
    if (theme.pallete.type === "dark") {
      return `linear-gradient(to right, ${lightGreen[300]} 30%, ${grey[800]} 60%)`;
    } else
      return `linear-gradient(to right, ${lightGreen[200]} 30%, white 60%)`;
  }
  if (jobType === jobTypes.reaction) {
    if (theme.palette.mode === "dark") {
      return `linear-gradient(to right, ${deepPurple[300]} 30%, ${grey[800]} 60%)`;
    } else
      return `linear-gradient(to right, ${deepPurple[100]} 20%, white 60%)`;
  }
}

export function CompactJobCardFrame({ job, updateEditJobTrigger }) {
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { openEditJob } = useOpenEditJob();
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

  const jobCardChecked = useMemo(
    () => multiSelectJobPlanner.some((i) => i === job.jobID),
    [multiSelectJobPlanner]
  );
  const navigate = useNavigate();

  return (
    <Card
      ref={drag}
      elevation={2}
      square
      sx={{
        marginTop: "5px",
        marginBottom: "5px",
        cursor: "grab",
        backgroundColor: (theme) =>
          jobCardChecked || isDragging
            ? theme.palette.mode !== "dark"
              ? grey[300]
              : grey[900]
            : "none",
      }}
    >
      <Grid container item xs={12}>
        <Grid item xs={2} sm={1} align="center">
          <Checkbox
            checked={jobCardChecked}
            sx={{
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
            }}
            onChange={(event) => {
              if (event.target.checked) {
                updateMultiSelectJobPlanner((prev) => {
                  return [...new Set([...prev, job.jobID])];
                });
              } else {
                updateMultiSelectJobPlanner((prev) =>
                  prev.filter((i) => i !== job.jobID)
                );
              }
            }}
          />
        </Grid>
        <Grid container item xs={6} sm={8} alignItems="center">
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            {job.name}
          </Typography>
        </Grid>
        <Grid
          container
          item
          sm={1}
          alignItems="center"
          sx={{ display: { xs: "none", sm: "flex" } }}
        >
          <PlannerInfoBadge job={job} />
        </Grid>
        <Grid container item xs={3} sm={1} align="center" alignItems="center">
          <Button
            color="primary"
            onClick={() => {
              navigate(`/editJob/${job.jobID}`);
              // openEditJob(job.jobID);
              // updateEditJobTrigger((prev) => !prev);
            }}
          >
            Edit
          </Button>
        </Grid>
        <Grid container item xs={1} align="center" alignItems="center">
          <IconButton
            sx={{
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
            }}
            onClick={() => {
              deleteSingleJob(job.jobID);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Grid>
        <Grid
          sx={{
            height: "1px",
            backgroundColor: (theme) => getCardColor(theme, job.jobType),
          }}
          item
          xs={12}
        />
      </Grid>
    </Card>
  );
}
