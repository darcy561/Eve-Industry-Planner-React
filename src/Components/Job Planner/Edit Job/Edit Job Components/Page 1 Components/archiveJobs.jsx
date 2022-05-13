import { Grid, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import {
  ActiveJobContext,
  ArchivedJobsContext,
} from "../../../../../Context/JobContext";

export function ArchiveJobs() {
  const { activeJob } = useContext(ActiveJobContext);
  const { archivedJobs } = useContext(ArchivedJobsContext);

  const archiveData = archivedJobs.find((i) => i.typeID === activeJob.itemID);
  console.log(archiveData);
  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
      }}
      square={true}
    >
      <Grid container direction="row">
        <Grid container item direction="row" sx={{ marginBottom: "10px" }}>
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" align="center">
              Archived Job Data
            </Typography>
          </Grid>
        </Grid>
        <Grid containner item xs={12}>
          {archiveData !== undefined ? (
            <Grid>
              <Typography>Data</Typography>
            </Grid>
          ) : (
            <Grid>
              <Typography>No Data</Typography>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
