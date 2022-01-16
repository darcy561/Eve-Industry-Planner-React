import { useContext } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";

export function TutorialStep3() {
  const { activeJob } = useContext(ActiveJobContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);

  return (
    <Paper
      elevation={3}
      sx={{
        padding: "20px",
      }}
      square={true}
    >
      <Grid container>
        <Grid item xs={12} align="left">
          <Typography variant="body1" color="primary">
            <b>Help:</b>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">
            Now that you have acquired all of your items and hauled them back to
            where ever it is you have decided to build your {activeJob.name}.
            Start your job running within the Eve Online client. {<br />}
            {<br />}
            Within the available jobs window you will see all of your current
            (and the jobs from the last 10 days, just encase you were a little
            slow setting this up) industry jobs found on the Eve ESI that match
            the the item you are building. Simply attach the relavent job or
            jobs using the link icon, doing so will remove he job card from the
            planner page.
            {<br />}
            {<br />}
            You are only able to attach the same number of industry jobs as you
            selected job slots back at the first step.
          </Typography>
          {isLoggedIn && (
            <Typography variant="body2">
              {<br />}
              If you do not see any jobs available within this window refresh
              the ESI data using the refreh icon at the top of the page, if this
              doesnt work then have some patience they may not be on the ESI as
              of yet.
            </Typography>
          )}
        </Grid>
        {isLoggedIn && (
          <Grid container item xs={12}>
            <Grid item xs={10} />
            <Grid item xs={2} align="right">
              <Typography variant="caption">Hide Help Options</Typography>
              <Checkbox
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
