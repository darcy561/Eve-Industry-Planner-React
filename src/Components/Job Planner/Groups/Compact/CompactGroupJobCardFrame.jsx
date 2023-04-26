import { useContext, useMemo } from "react";
import {
  JobPlannerPageTriggerContext,
  MultiSelectJobPlannerContext,
} from "../../../../Context/LayoutContext";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { useOpenEditJob } from "../../../../Hooks/JobHooks/useOpenEditJob";
import { useDeleteSingleJob } from "../../../../Hooks/JobHooks/useDeleteSingleJob";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../../../../Context/DnDTypes";
import { makeStyles } from "@mui/styles";
import { jobTypes } from "../../../../Context/defaultValues";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Button,
  Card,
  Checkbox,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { deepPurple, grey, lightGreen } from "@mui/material/colors";

const useStyles = makeStyles((theme) => ({
  Checkbox: {
    color:
      theme.palette.type === "dark"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
  DeleteIcon: {
    color:
      theme.palette.type === "dark"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
  ManufacturingJob: {
    height: "1px",
    background:
      theme.palette.type === "dark"
        ? `linear-gradient(to right, ${lightGreen[300]} 30%, ${grey[800]} 60%)`
        : `linear-gradient(to right, ${lightGreen[200]} 30%, white 60%)`,
  },
  ReactionJob: {
    height: "1px",
    background:
      theme.palette.type === "dark"
        ? `linear-gradient(to right, ${deepPurple[300]} 30%, ${grey[800]} 60%)`
        : `linear-gradient(to right, ${deepPurple[100]} 20%, white 60%)`,
  },
}));

export function CompactGroupJobCardFrame({ job }) {
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updateEditJobTrigger } = useContext(JobPlannerPageTriggerContext);
  const { activeGroup } = useContext(ActiveJobContext);
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
  const classes = useStyles();
  const jobCardChecked = useMemo(() => {
    return multiSelectJobPlanner.some((i) => i === job.jobID);
  }, [multiSelectJobPlanner]);

  const jobMarkedAsCompelte = useMemo(() => {
    return activeGroup.areComplete.includes(job.jobID);
  }, [activeGroup]);

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
            ? theme.palette.type !== "dark"
              ? grey[300]
              : grey[900]
            : "none",
      }}
    >
      <Grid container item xs={12}>
        <Grid item xs={2} sm={1} align="center">
          <Checkbox
            className={classes.Checkbox}
            checked={jobCardChecked}
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
        <Grid item xs={3} sm={2} align="center">
          <Button
            color="primary"
            onClick={() => {
              openEditJob(job.jobID);
              updateEditJobTrigger((prev) => !prev);
            }}
          >
            Edit
          </Button>
        </Grid>
        <Grid item xs={1} align="center">
          <IconButton
            className={classes.DeleteIcon}
            onClick={() => {
              deleteSingleJob(job.jobID);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Grid>
        <Grid
          className={
            jobTypes.manufacturing === job.jobType
              ? classes.ManufacturingJob
              : classes.ReactionJob
          }
          item
          xs={12}
        />
      </Grid>
    </Card>
  );
}
