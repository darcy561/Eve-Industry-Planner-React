import { useContext } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  Checkbox: {
    color:
      theme.palette.type === "dark"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
}));

export function TutorialStep2() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const classes = useStyles();
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
            Now that you know what you are building, it is time to acquire the
            necessary parts.{<br />} {<br />}
            For each item enter the cost into the dropdown menu, you can either
            choose the "All Remaining" option to or you can manually type the
            number of items, followed by the cost of the individual item. Click
            the <b>+</b> to add this entry. You can add as many entries as
            needed, each entry row can be removed using the <b>X</b>.{<br />}
            {<br />}
            As you add entries the total cost for the material is calculated.
            This is then added to the total material cost for the job which is
            used to calculate an individual item cost.
            {<br />}
            {<br />}
            You can use the "Hide Completed Purchases" toggle switch if you only
            want to see the items that you have not completely purchased.
          </Typography>
        </Grid>
        {isLoggedIn && (
          <Grid container item xs={12}>
            <Grid item xs={10} />
            <Grid item xs={2} align="right">
              <Typography variant="caption" sx={{ display: "inline-block" }}>
                Hide Help Options
              </Typography>
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
