import { Grid, IconButton, Paper, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useContext } from "react";
import { JobPlannerPageTriggerContext } from "../../../Context/LayoutContext";

export default function GroupPage() {
  const { updateEditGroupTrigger } = useContext(JobPlannerPageTriggerContext);
  return (
    <Paper
      elevation={3}
      sx={{
        padding: "10px",
        marginTop: "20px",
        marginBottom: "20px",
        width: "100%",
      }}
      square={true}
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
          Group Name
        </Grid>
      </Grid>
    </Paper>
  );
}
