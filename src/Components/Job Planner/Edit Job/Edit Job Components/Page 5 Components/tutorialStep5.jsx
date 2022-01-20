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

export function TutorialStep5() {
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
            Sale time! Setup your market order/orders in the market of choice.
            Once this has been done and the information appears on the ESI the
            available orders window will display each of the orders for your
            item type. By linking this order to your job Eve Industry Planner
            will find the transactions and associated taxes within the ESI data
            that match the item type and display these in the new transactions
            window. Attaching a transaction to the job will then add the costs
            and taxes associated.
            {<br />}
            {<br />}
            As the items are sold the total sales and average item price is
            populated from the transactions that you have linked. This uses the
            earlier build costs, along with the brokers fees and taxes to
            calculate your overall profit/loss for this job.
            {<br />}
            {<br />} Once you have sold everything you can either delete the job
            and remove all the data or you can choose to archive the job saving
            all of the data for you to pull back at a later date.
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
