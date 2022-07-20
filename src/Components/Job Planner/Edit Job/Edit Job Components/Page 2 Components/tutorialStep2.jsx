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
          <Typography
            color="primary"
            sx={{ typography: { xs: "body2", sm: "body1" } }}
          >
            <b>Help:</b>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            Now that you know what you are building, it is time to acquire the
            necessary parts.{<br />} {<br />}
            On each material card there is a small form allowing you to enter
            the quantity, this value defaults to the remaining needed, and the
            price that you paid for the item. Clicking the <b>+</b> will add
            this to the job. You can add as many entries as needed, each entry
            can be removed using the <b>X</b>.{<br />}
            For manufacturing or reaction jobs there is an icon displayed in the
            top left corner indicating the number of child jobs that are
            attached, clicking this will allow you to manually add or remove
            child jobs.
            {<br />}
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
            <Grid item xs={6} sm={9} />
            <Grid item xs={6} sm={3} align="right">
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
