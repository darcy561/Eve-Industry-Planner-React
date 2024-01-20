import { useContext, useMemo } from "react";
<<<<<<< HEAD
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
=======
import { MultiSelectJobPlannerContext } from "../../../../Context/LayoutContext";
import { useDeleteSingleJob } from "../../../../Hooks/JobHooks/useDeleteSingleJob";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../../../../Context/DnDTypes";
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
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
import GroupInfoPopout from "./GroupInfoBadge";
<<<<<<< HEAD

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
=======
import GLOBAL_CONFIG from "../../../../global-config-app";
import { useNavigate } from "react-router-dom";
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569

export function CompactGroupJobCardFrame({ job }) {
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
<<<<<<< HEAD
  const { updateEditJobTrigger } = useContext(JobPlannerPageTriggerContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { openEditJob } = useOpenEditJob();
=======
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
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
<<<<<<< HEAD
  const classes = useStyles();
  const jobCardChecked = useMemo(() => {
    return multiSelectJobPlanner.some((i) => i === job.jobID);
  }, [multiSelectJobPlanner]);

  const jobMarkedAsCompelte = useMemo(() => {
    return activeGroup.areComplete.includes(job.jobID);
  }, [activeGroup]);
=======
  const { PRIMARY_THEME } = GLOBAL_CONFIG;
  const jobCardChecked = useMemo(() => {
    return multiSelectJobPlanner.some((i) => i === job.jobID);
  }, [multiSelectJobPlanner]);
  const navigate = useNavigate();

  function getCardColor(theme, jobType) {
    if (jobType === jobTypes.manufacturing) {
      if (theme.palette.mode === PRIMARY_THEME) {
        return `linear-gradient(to right, ${lightGreen[300]} 30%, ${grey[800]} 60%)`;
      } else
        return `linear-gradient(to right, ${lightGreen[200]} 30%, white 60%)`;
    }
    if (jobType === jobTypes.reaction) {
      if (theme.palette.mode === PRIMARY_THEME) {
        return `linear-gradient(to right, ${deepPurple[300]} 30%, ${grey[800]} 60%)`;
      } else
        return `linear-gradient(to right, ${deepPurple[100]} 20%, white 60%)`;
    }
  }
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569

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
<<<<<<< HEAD
            ? theme.palette.type !== "dark"
=======
            ? theme.palette.mode !== "dark"
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
              ? grey[300]
              : grey[900]
            : "none",
      }}
    >
      <Grid container item xs={12}>
        <Grid item xs={2} sm={1} align="center">
          <Checkbox
<<<<<<< HEAD
            className={classes.Checkbox}
=======
            sx={{
              color: (theme) =>
                theme.palette.mode === PRIMARY_THEME
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
            }}
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
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
        <Grid
          container
          item
          sm={1}
          alignItems="center"
          sx={{ display: { xs: "none", sm: "flex" } }}
        >
          <GroupInfoPopout job={job} />
        </Grid>
        <Grid container item xs={3} sm={1} align="center" alignItems="center">
          <Button
            color="primary"
            onClick={() => {
<<<<<<< HEAD
              openEditJob(job.jobID);
              updateEditJobTrigger((prev) => !prev);
=======
              navigate(`/editJob/${job.jobID}`);
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
            }}
          >
            Edit
          </Button>
        </Grid>
        <Grid container item xs={1} align="center" alignItems="center">
          <IconButton
<<<<<<< HEAD
            className={classes.DeleteIcon}
=======
            sx={{
              color: (theme) =>
                theme.palette.mode === PRIMARY_THEME
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
            }}
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
            onClick={() => {
              deleteSingleJob(job.jobID);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Grid>
        <Grid
<<<<<<< HEAD
          className={
            jobTypes.manufacturing === job.jobType
              ? classes.ManufacturingJob
              : classes.ReactionJob
          }
=======
          sx={{
            height: "1px",
            backgroundColor: (theme) => getCardColor(theme, job.jobType),
          }}
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
          item
          xs={12}
        />
      </Grid>
    </Card>
  );
}
