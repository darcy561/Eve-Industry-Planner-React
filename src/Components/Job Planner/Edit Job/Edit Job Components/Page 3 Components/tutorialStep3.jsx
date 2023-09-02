import { useContext, useMemo } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import { useFirebase } from "../../../../../Hooks/useFirebase";
import { UserLoginUIContext } from "../../../../../Context/LayoutContext";

export function TutorialStep3() {
  const { activeJob } = useContext(ActiveJobContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { userDataFetch } = useContext(UserLoginUIContext);
  const { updateMainUserDoc } = useFirebase();
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  if (!parentUser.settings.layout.hideTutorials && !userDataFetch) {
    return (
      <Grid item xs={12}>
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
          }}
          square={true}
        >
          <Grid container>
            <Grid item xs={12} align="left">
              <Typography
                color="primary"
                sx={{ typography: { xs: "body2", sm: "body1" } }}
              >
                <b>Help:</b>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Now that you have acquired the items and hauled them back to
                your chosen system, it is time to build your {activeJob.name}.
                Start your job running within the Eve Online client. {<br />}
                {<br />}
                Within the Available Jobs panel, you will see all the current
                (and jobs from the last 10 days) industry jobs from the Eve ESI
                that match the item you are building. Simply link the relevant
                job/jobs using the link icon. This is so that the installation
                costs for each job can be imported and added to your total build
                costs. Once the ESI job has been attached it will no longer
                appear on your Job Planner, unless it is unlinked.
                {<br />}
                {<br />}
                You are only able to attach the same number of ESI jobs as you
                selected job slots back at the first step.
              </Typography>
              {isLoggedIn && (
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  {<br />}
                  If you do not see any jobs available within this window,
                  refresh the ESI data using the refresh icon at the top of the
                  page, if this doesn't work then have some patience, they may
                  not be on the ESI yet.
                </Typography>
              )}
            </Grid>
            {isLoggedIn && (
              <Grid container item xs={12}>
                <Grid item xs={6} sm={9} />
                <Grid item xs={6} sm={3} align="right">
                  <Typography variant="caption">Hide Help Options</Typography>
                  <Checkbox
                    sx={{
                      color: (theme) =>
                        theme.palette.type === "dark"
                          ? theme.palette.primary.main
                          : theme.palette.secondary.main,
                    }}
                    size="small"
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
