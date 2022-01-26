import { useContext } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import { IsLoggedInContext, UsersContext } from "../../../Context/AuthContext";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  Checkbox: {
    color:
      theme.palette.type === "dark"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
}));

export function TutorialPlanner() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const classes = useStyles();

  return (
    <Paper
      elevation={3}
      sx={{
        padding: "20px",
        marginRight: { md: "10px" },
        marginLeft: { md: "10px" },
      }}
      square={true}
    >
      <Grid container>
        <Grid item xs={12} align="left"></Grid>
        <Grid item xs={12}>
          <Typography variant="body2">
            Welcome to the Job Planner!
            {<br />}
            {<br />}
            The planner is broken down into 5 stages, with each of your jobs
            having its own card. To start simple use the search box and start
            adding the jobs you would like to build.
            {<br />}
            {<br />}
            As well as your own jobs the planner will also display your current
            active and previous industry jobs (within 10 days) that have been
            imported from the Eve ESI. Jobs from the ESI will appear differntly
            and are displayed on your planner until they are linked to a job.
            {<br />}
            {<br />}
            Use the checkbox in the corner of the job cards to select multiple,
            and access the options to manipulate jobs quickly.
          </Typography>
          {!isLoggedIn && (
            <Typography variant="body2">
              {<br />}
              Why not try out the demo below to see more for yourself or simply
              log in with your Eve account to get started.
            </Typography>
          )}
        </Grid>
        {isLoggedIn && (
          <Grid container item xs={12}>
            <Grid item xs={10} />
            <Grid item xs={2} align="right">
              <Typography variant="caption">Hide Help Options</Typography>
              <Checkbox
                className={classes.Checkbox}
                size="small"
                onClick={() => {
                  let newUsers = JSON.parse(JSON.stringify(users));
                  let parentUserIndex = users.findIndex(
                    (i) => i.ParentUser === true
                  );

                  newUsers[
                    parentUserIndex
                  ].settings.layout.hideTutorials = true;

                  updateUsers(newUsers);
                }}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
