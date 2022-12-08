import { Grid, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useContext } from "react";
import { JobPlannerPageTriggerContext } from "../../../Context/LayoutContext";
import { ActiveJobContext } from "../../../Context/JobContext";
import { OutputJobsPanel } from "./OutputJobs";
import { GroupAccordion } from "./groupAccordion";

export default function GroupPage() {
  const { updateEditGroupTrigger } = useContext(JobPlannerPageTriggerContext);
  const { activeGroup, updateActiveGroupp } = useContext(ActiveJobContext);

  return (
    <Paper
      elevation={3}
      sx={{
        padding: "10px",
        marginTop: "20px",
        marginBottom: "20px",
        width: "100%",
      }}
      square
    >
      <Grid container>
        <Grid item xs={7} md={9} lg={10} />
        <Grid item xs={5} md={3} lg={2}>
          <Tooltip
            arrow
            title="Saves all changes and returns to the job planner page."
            placement="bottom"
          >
            <IconButton
              color="primary"
              onClick={async () => {
                updateEditGroupTrigger((prev) => !prev);
              }}
              size="medium"
              sx={{ marginRight: { sm: "10px" } }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Grid>
        <Grid item xs={12}>
          <Typography>{activeGroup.groupName}</Typography>
          <Typography>{activeGroup.groupID}</Typography>
        </Grid>
        <Grid container item xs={12} spacing={2}>
          <Grid item xs={12}>
            <OutputJobsPanel />
          </Grid>
          <Grid item xs={12}>
            <GroupAccordion />
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
