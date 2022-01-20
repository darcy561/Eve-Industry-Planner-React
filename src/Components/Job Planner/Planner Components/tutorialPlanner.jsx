import { useContext } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import { IsLoggedInContext, UsersContext } from "../../../Context/AuthContext";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  Checkbox: {
    color: theme.palette.type === "dark" ? (theme.palette.primary.main) : (theme.palette.secondary.main)
  }
}))

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
        <Grid item xs={12} align="left">
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">
            Welcome to Eve Industry Planner.
            {<br />}
            {<br />}
            The planner is broken down into 5 stages allowing you to record and
            manage multiple jobs easily. To start simple use the search box and
            start adding the jobs you would like to build.
            {<br />}
            {<br />}
            The job planner will show your own jobs but also display your
            current active and previous industry jobs that have been imported
            from the Eve ESI. Jobs from the ESI have different cards to easily
            distinguish between the two.
          </Typography>
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

                  newUsers[parentUserIndex].settings.layout.hideTutorials = true;

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
