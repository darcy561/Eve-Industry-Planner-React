import { useContext } from "react";
import { Grid, Typography } from "@mui/material";
import { IsLoggedInContext } from "../../../Context/AuthContext";
import { STANDARD_TEXT_FORMAT } from "../../../Context/defaultValues";

export function TutorialContent_JobPlanner() {
  const { isLoggedIn } = useContext(IsLoggedInContext);

  return (
    <Grid item container spacing={2} sx={{ height: "100%", width: "100%" }}>
      <Grid item xs={12}>
        <Grid container spacing={2} direction="column">
          <Grid item>
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Welcome to the Job Planner!
            </Typography>
          </Grid>
          <Grid item>
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              The Job Planner is broken down into 5 stages, with each of your
              build projects having its own job card. As you work through the
              process of building an item it will progress through each of the
              stages and move down the planner. To start simply use the item
              search box and start adding the items you would like to build.
            </Typography>
          </Grid>
          <Grid item>
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              As well as your own jobs the planner can also display your current
              active and previous industry jobs (within 10 days following
              delivery) that have been imported from the Eve ESI. Jobs from the
              ESI have a different style of job card and are displayed on your
              planner until they are linked to an Eve Industry Planner job card
              or hidden.
            </Typography>
          </Grid>
          <Grid item>
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Using the checkbox in the corner of the job cards you can select
              single or multiple cards to quickly manipulate these from the
              options, hover over each of the buttons for more information as to
              their purpose.
            </Typography>
          </Grid>
          {!isLoggedIn && (
            <Grid item>
              <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                Have a browse through the demo jobs below to see more
                information about how Eve Industry Planner works, any changes
                made here are not saved. If you feel ready simply log in with
                your Eve account to get started building your own jobs.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
}
