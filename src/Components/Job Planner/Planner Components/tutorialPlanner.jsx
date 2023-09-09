import { useContext, useMemo } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import { IsLoggedInContext, UsersContext } from "../../../Context/AuthContext";
import { useFirebase } from "../../../Hooks/useFirebase";
import { UserLoginUIContext } from "../../../Context/LayoutContext";
import GLOBAL_CONFIG from "../../../global-config-app";

export function TutorialPlanner() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { userDataFetch } = useContext(UserLoginUIContext);
  const { updateMainUserDoc } = useFirebase();
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);
  const {PRIMARY_THEME} = GLOBAL_CONFIG

  if (!parentUser.settings.layout.hideTutorials && !userDataFetch) {
    return (
      <Grid item xs={12}>
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
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Welcome to the Job Planner!
                {<br />}
                {<br />}
                The Job Planner is broken down into 5 stages, with each of your
                build projects having its own job card. As you work through the
                process of building an item it will progress through each of the
                stages and move down the planner. To start simply use the item
                search box and start adding the items you would like to build.
                {<br />}
                {<br />}
                As well as your own jobs the planner can also display your
                current active and previous industry jobs (within 10 days
                following delivery) that have been imported from the Eve ESI.
                Jobs from the ESI have a different style of job card and are
                displayed on your planner until they are linked to an Eve
                Industry Planner job card or hidden.
                {<br />}
                {<br />}
                Using the checkbox in the corner of the job cards you can select
                single or multiple cards to quickly manipulate these from the
                options, hover over each of the buttons for more information as
                to their purpose.
              </Typography>
              {!isLoggedIn && (
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  {<br />}
                  Have a browse through the demo jobs below to see more
                  information about how Eve Industry Planner works, any changes
                  made here are not saved. If you feel ready simply log in with
                  your Eve account to get started building your own jobs.
                </Typography>
              )}
            </Grid>
            {isLoggedIn && (
              <Grid container item xs={12}>
                <Grid item xs={6} sm={9} />
                <Grid item xs={6} sm={3} align="right">
                  <Typography variant="caption">Hide Help Options</Typography>
                  <Checkbox
                    size="small"
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === PRIMARY_THEME
                          ? theme.palette.primary.main
                          : theme.palette.secondary.main,
                    }}
                    onClick={() => {
                      let newUsers = [...users];
                      let parentUserIndex = newUsers.findIndex(
                        (i) => i.ParentUser === true
                      );

                      newUsers[
                        parentUserIndex
                      ].settings.layout.hideTutorials = true;

                      updateUsers(newUsers);
                      updateMainUserDoc();
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
    );
  } else return null;
}
