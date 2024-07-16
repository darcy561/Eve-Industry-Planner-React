import {
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Switch,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { useFirebase } from "../../../../Hooks/useFirebase";
import { ApplicationSettingsContext } from "../../../../Context/LayoutContext";

export function CompactLayoutSettings({ parentUserIndex }) {
  const { applicationSettings, updateApplicationSettings } = useContext(
    ApplicationSettingsContext
  );
  const { uploadApplicationSettings } = useFirebase();

  return (
    <Paper elevation={3} sx={{ padding: "20px" }} square={true}>
      <Grid container>
        <Grid item xs={12} align="center" sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" color="primary">
            Layout Settings
          </Typography>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={6} sm={4}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      !applicationSettings.hideTutorials
                    }
                    color="primary"
                    onChange={(e) => {
                      const newApplicationSettings =
                        applicationSettings.toggleHideTutorials();
                      updateApplicationSettings(newApplicationSettings);
                      uploadApplicationSettings(newApplicationSettings);
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Enable Help Cards
                  </Typography>
                }
                labelPlacement="bottom"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      applicationSettings.enableCompactView
                    }
                    color="primary"
                    onChange={(e) => {
                      const newApplicationSettings =
                        applicationSettings.toggleEnableCompactView();
                      updateApplicationSettings(newApplicationSettings);
                      uploadApplicationSettings(newApplicationSettings);
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Enable Compact View
                  </Typography>
                }
                labelPlacement="bottom"
              />
            </FormGroup>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
