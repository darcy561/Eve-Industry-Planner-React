import { useContext, useMemo } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import { UsersContext } from "../../../Context/AuthContext";
import { makeStyles } from "@mui/styles";
import { useFirebase } from "../../../Hooks/useFirebase";
import { UserLoginUIContext } from "../../../Context/LayoutContext";

const useStyles = makeStyles((theme) => ({
  Checkbox: {
    color:
      theme.palette.type === "dark"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
}));

export function TutorialDashboard() {
  const { users, updateUsers } = useContext(UsersContext);
  const { userDataFetch } = useContext(UserLoginUIContext);
  const { updateMainUserDoc } = useFirebase();
  const classes = useStyles();
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

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
              <Typography variant="body2">
                Welcome to your Dashboard!
                {<br />}
                {<br />}
                Here you will find a break down of the information from the jobs
                on your Job Planner. Use the navigation menu found in the top
                left hand corner to switch to the Job Planner.
                {<br />}
                {<br />}
                New Job Transactions - This displays any new transactions that
                have happened for jobs that have a market order linked to it.
                Visit the Job Planner page and edit a job for more information
                on linking market orders.
              </Typography>
            </Grid>
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
                    updateMainUserDoc();
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    );
  } else return null;
}
