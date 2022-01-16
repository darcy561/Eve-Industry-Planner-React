import { useContext } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";

export function TutorialStep5() {
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
            Sale time! Setup your market order in your market of choice. Once
            this has been done and the information appears on the ESI the
            available orders window will display all of the available market
            orders for your item type. By linking this order to your job your
            new transactions window will display all of the transactions that
            have taken place since the order was created that match the item
            type. Attaching a transaction to the job will add the costs and
            taxes associated with it to the job.
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
