import { useContext } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import { IsLoggedInContext } from "../../../../Context/AuthContext";
import {
  ApplicationSettingsContext,
  UserLoginUIContext,
} from "../../../../Context/LayoutContext";
import GLOBAL_CONFIG from "../../../../global-config-app";
import uploadApplicationSettingsToFirebase from "../../../../Functions/Firebase/uploadApplicationSettings";

export function TutorialStep1({ activeJob }) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { applicationSettings, updateApplicationSettings } = useContext(
    ApplicationSettingsContext
  );
  const { userDataFetch } = useContext(UserLoginUIContext);
  const { PRIMARY_THEME } = GLOBAL_CONFIG;

  if (applicationSettings.hideTutorials && userDataFetch) {
    return (
      <Grid item xs={12}>
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
          }}
          square
        >
          <Grid container>
            <Grid item xs={12} align="left">
              <Typography
                color="primary"
                sx={{ typography: { xs: "body2", sm: "body1" } }}
              >
                <b>Help:</b>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                This is your first step along the way to building your{" "}
                {activeJob.name}.{<br />}
                {<br />}
                Use the available options to set up the build and calculate the
                resources that are needed to complete your job.{<br />}
                {<br />}
                With some items you may also want to build the components
                yourself rather than buying these items. Clicking the i icon
                next to each of the components in the Item Cost panel will
                display a pop out showing you the total cost of the materials
                needed to build the component. The total cost is then
                highlighted in red or green to indicate if it is cheaper to buy
                the materials or purchase the finished product. If you are happy
                with the cost of the item then you simply use the Create Job
                button to create a new job on your planner that is linked to the
                current job you have open. This new job will automatically be
                created to make the total number of items indicated in the Raw
                Resources panel.
              </Typography>
            </Grid>
            {isLoggedIn && (
              <Grid container item xs={12}>
                <Grid item xs={6} sm={9} />
                <Grid item xs={6} sm={3} align="right">
                  <Typography
                    variant="caption"
                    sx={{ display: "inline-block" }}
                  >
                    Hide Help Options
                  </Typography>
                  <Checkbox
                    size="small"
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === PRIMARY_THEME
                          ? theme.palette.primary.main
                          : theme.palette.secondary.main,
                    }}
                    onClick={() => {
                      const newApplicationSettings =
                        applicationSettings.toggleHideTutorials();
                      updateApplicationSettings(newApplicationSettings);
                      uploadApplicationSettingsToFirebase(newApplicationSettings);
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
    );
  } else return null;
}
