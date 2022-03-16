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
            The Job Planner is broken down into 5 stages, with each of your
            build projects having its own job card. As you work through the
            process of building an item it will progress through each of the
            stages and move down the planner. To start simply use the item
            search box and start adding the items you would like to build.
            {<br />}
            {<br />}
            As well as your own jobs the planner can also display your current
<<<<<<< HEAD
            active and previous industry jobs (within 10 days following delivery) that have been
            imported from the Eve ESI. Jobs from the ESI have a differnt style
            of job card and are displayed on your planner until they are linked
            to an Eve Industry Planner job card or hidden.
            {<br />}
            {<br />}
            Using the checkbox in the corner of the job cards you can select 
=======
            active and previous industry jobs (within 10 days following
            delivery) that have been imported from the Eve ESI. Jobs from the
            ESI have a different style of job card and are displayed on your
            planner until they are linked to an Eve Industry Planner job card or
            hidden.
            {<br />}
            {<br />}
            Using the checkbox in the corner of the job cards you can select
>>>>>>> development
            single or multiple cards to quickly manipulate these from the
            options, hover over each of the buttons for more information as to
            their purpose.
          </Typography>
          {!isLoggedIn && (
            <Typography variant="body2">
              {<br />}
              Have a browse through the demo jobs below to see more information
<<<<<<< HEAD
              about how Eve Industry Planner can help you or if you feel ready
              simply log in with your Eve account to get started with your jobs.
=======
              about how Eve Industry Planner works, any changes made here are
              not saved. If you feel ready simply log in with your Eve account
              to get started building your own jobs.
>>>>>>> development
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
