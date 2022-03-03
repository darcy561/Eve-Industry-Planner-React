import { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { Grid, Paper, Typography } from "@mui/material";

export function MatchingBlueprints() {
  const { activeJob } = useContext(ActiveJobContext);

  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
      }}
      square={true}
    >
          <Grid container>
              <Grid item xs={12}>
                  <Typography variant="h6" align="center" color="primary">
                      Matching Blueprints
                  </Typography>
              </Grid>

              <Grid container>
                  
              </Grid>
      </Grid>
    </Paper>
  );
}
