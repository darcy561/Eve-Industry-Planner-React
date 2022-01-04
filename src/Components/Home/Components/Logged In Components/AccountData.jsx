import { Avatar, Grid, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { MainUserContext, UsersContext } from "../../../../Context/AuthContext";
import {
  JobArrayContext,
  JobStatusContext,
} from "../../../../Context/JobContext";

export function AccountData() {
  const { users } = useContext(UsersContext);
  const { mainUser } = useContext(MainUserContext);
  const { jobArray } = useContext(JobArrayContext);
  const { jobStatus } = useContext(JobStatusContext);
  return (
    <Paper
      elevation={3}
      sx={{
        padding: "20px",
          marginLeft: {
              xs: "5px",
              md: "10px"
          },
          marginRight: {
              xs: "5px",
              md: "0px"
          }
      }}
      square={true}
    >
      <Grid container direction="row">
        <Grid container item xs={12}>
          <Grid item xs={6}>
            <Avatar
              alt={`${mainUser.CharacterName} portrait card`}
              src={`https://images.evetech.net/characters/${mainUser.CharacterID}/portrait`}
              sx={{
                height: {
                  xs: "60px",
                  md: "72px",
                },
                width: {
                  xs: "60px",
                  md: "72px",
                },
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">Total Characters: {users.length}</Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: "20px" }}>
          <Grid item xs={8}>
            <Typography variant="subtitle1">Job Status Breakdown</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1">
              Total Jobs: {jobArray.length}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: "5px" }}>
            {jobStatus.map((step) => {
              const jobs = jobArray.filter((job) => job.jobStatus === step.id);
              return (
                <Grid key={step.id} container item xs={12}>
                  <Grid item xs={10}>
                    <Typography variant="body2"> {step.name}</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" align="right">
                      {jobs.length}
                    </Typography>
                  </Grid>
                </Grid>
              );
            })}
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: "20px" }}>
          <Grid item xs={6}>
            <Typography variant="subtitle1"> Imported API Data</Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: "5px" }}>
          <Grid item xs={8}>
            <Typography variant="body2">Market Orders</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" align="right">
              {mainUser.apiOrders.length.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body2">Histortic Market Orders</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" align="right">
              {mainUser.apiHistOrders.length.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body2">Industry Jobs</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" align="right">
              {mainUser.apiJobs.length.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body2">Character Blueprints</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" align="right">
              {mainUser.apiBlueprints.length.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body2">Market Transactions</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" align="right">
              {mainUser.apiTransactions.length.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body2">Journal Entries</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" align="right">
              {mainUser.apiJournal.length.toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
