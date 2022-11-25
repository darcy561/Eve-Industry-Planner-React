import {
  Avatar,
  AvatarGroup,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { useContext, useEffect } from "react";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../../Context/AuthContext";
import { JobStatusContext } from "../../../Context/JobContext";

export function AccountData() {
  const { users, userDataFetch } = useContext(UsersContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { jobStatus } = useContext(JobStatusContext);

  let openMOrders = 0;
  let histMOrders = 0;
  let indJobs = 0;
  let cBlueprints = 0;
  let mTrans = 0;
  let jEntries = 0;

  useEffect(() => {
    users.forEach((i) => {
      openMOrders += JSON.parse(
        sessionStorage.getItem(`esiOrders_${i.CharacterHash}`)
      ).length;
      histMOrders += JSON.parse(
        sessionStorage.getItem(`esiHistOrders_${i.CharacterHash}`)
      ).length;
      indJobs += JSON.parse(
        sessionStorage.getItem(`esiJobs_${i.CharacterHash}`)
      ).length;
      cBlueprints += JSON.parse(
        sessionStorage.getItem(`esiBlueprints_${i.CharacterHash}`)
      ).length;
      mTrans += JSON.parse(
        sessionStorage.getItem(`esiTransactions_${i.CharacterHash}`)
      ).length;
      jEntries += JSON.parse(
        sessionStorage.getItem(`esiJournal_${i.CharacterHash}`)
      ).length;
    });
  }, [users]);

  if (!userDataFetch) {
    return (
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          marginLeft: {
            xs: "5px",
            md: "10px",
          },
          marginRight: {
            xs: "5px",
            md: "0px",
          },
        }}
        square
      >
        <Grid container direction="row">
          <Grid container item xs={12}>
            <Grid item xs={12} align="center">
              <AvatarGroup max={5}>
                {users.map((user) => {
                  return (
                    <Avatar
                      key={user.CharacterHash}
                      alt={`${user.CharacterName} Portrait Card`}
                      src={`https://images.evetech.net/characters/${user.CharacterID}/portrait`}
                      sx={{
                        height: {
                          xs: "35px",
                          md: "45px",
                        },
                        width: {
                          xs: "35px",
                          md: "45px",
                        },
                        border: "none",
                      }}
                    />
                  );
                })}
              </AvatarGroup>
            </Grid>
          </Grid>
          <Grid container item xs={12} sx={{ marginTop: "20px" }}>
            <Grid item xs={8}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "subtitle1" } }}
              >
                Job Status Breakdown
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "subtitle1" } }}
              >
                Total Jobs: {userJobSnapshot.length}
              </Typography>
            </Grid>
          </Grid>
          <Grid container item xs={12} sx={{ marginTop: "5px" }}>
            {jobStatus.map((step) => {
              const jobs = userJobSnapshot.filter(
                (job) => job.jobStatus === step.id
              );
              return (
                <Grid key={step.id} container item xs={12}>
                  <Grid item xs={10}>
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {step.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      align="right"
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {jobs.length}
                    </Typography>
                  </Grid>
                </Grid>
              );
            })}
          </Grid>
          <Grid container item xs={12} sx={{ marginTop: "20px" }}>
            <Grid item xs={6}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "subtitle1" } }}
              >
                Imported API Data
              </Typography>
            </Grid>
          </Grid>
          <Grid container item xs={12} sx={{ marginTop: "5px" }}>
            <Grid item xs={8}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Open Market Orders
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                align="right"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                {openMOrders.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Historic Market Orders
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                align="right"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                {histMOrders.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Industry Jobs
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                align="right"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                {indJobs.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Character Blueprints
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                align="right"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                {cBlueprints.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Market Transactions
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                align="right"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                {mTrans.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Journal Entries
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                align="right"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                {jEntries.toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    );
  } else {
    <Paper
      elevation={3}
      sx={{
        padding: "20px",
        marginLeft: {
          xs: "5px",
          md: "10px",
        },
        marginRight: {
          xs: "5px",
          md: "0px",
        },
      }}
      square
    >
      <Grid container>
        <Grid item xs={12} align="center">
          <CircularProgress color="primary" />
        </Grid>
        <Grid item xs={12} align="center">
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            Updating User Data
          </Typography>
        </Grid>
      </Grid>
    </Paper>;
  }
}
