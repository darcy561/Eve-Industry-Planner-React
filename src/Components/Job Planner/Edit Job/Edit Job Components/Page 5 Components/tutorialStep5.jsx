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
            Setup your market order/orders in game as you normally would do.
            Once this has been done and the information appears on the ESI the
            Available Orders window will display each of the orders for your
            item type. By linking orders to your job Eve Industry Planner will
            find the brokers fee associated with them. Once attached it will
            display any transactions and associated taxes from the ESI data that
            occured after after the order was issued that match the item type.
            These are displayed in the New Transactions window. Attaching a
            transaction to the job will then add the cost and taxes associated.
            {<br />}
            {<br />}
            As the items are sold the total sales and average item price is
            populated from the transaction data that has been linked. This uses
            the earlier build costs, along with the brokers fees and taxes to
            calculate your overall profit/loss for this job.
            {<br />}
            {<br />}
            Once you have sold everything you can either delete the job and
            remove all the data or you can choose to archive the job saving all
            of the data for you to pull back at a later date (yet to be
            implemented).
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
