import { useContext } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";

export function TutorialStep4() {
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
            So you have now finished building your {activeJob.name}, here is
            where we complete the build cost calculations to work out the final
            cost before we move onto selling our item. You will see the total
            material cost as was entered back on the 2nd stage and then the
            total installation costs from industry jobs that you linked back in
            the previous step.
            {<br />} Finally you can manually add any extra costs to the job
            that may not be included automatically. Maybe you paid a friend to
            haul some items that you needed or you are adding costs for an older
            job that does not appear within the ESI data anymore.
          </Typography>
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
