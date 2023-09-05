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

function getCardColor(theme, jobType) {
  if (jobType === jobTypes.manufacturing) {
    if (theme.palette.mode === "dark") {
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
            ? theme.palette.mode !== "dark"
              ? grey[300]
              : grey[900]
            : "none",
      }}
    >
      <Grid container item xs={12}>
        <Grid item xs={2} sm={1} align="center">
          <Checkbox
            sx={{
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
            }}
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
              openEditJob(job.jobID);
              updateEditJobTrigger((prev) => !prev);
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
