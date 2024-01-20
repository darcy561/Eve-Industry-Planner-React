import { useContext, useMemo } from "react";
import { Grid, Paper, Typography, Checkbox } from "@mui/material";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../Context/AuthContext";
import { UserLoginUIContext } from "../../../../Context/LayoutContext";
import { useFirebase } from "../../../../Hooks/useFirebase";

export function TutorialStep5() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { userDataFetch } = useContext(UserLoginUIContext);
  const { updateMainUserDoc } = useFirebase();
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  if (!parentUser.settings.layout.hideTutorials && userDataFetch) {
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
                Ok, setup your market order/orders in the game as you normally
                would do. Once this has been done and the information appears on
                the ESI the Available Orders panel will display each of the
                orders for your item type. By linking orders to your job, Eve
                Industry Planner will find the brokers fee associated with them
                and include these in total cost of the job.
                {<br />}
                {<br />}
                Once a market order has been attached, the New Transactions
                panel will display any transaction from your journal that
                occurred at the same location that has not been linked to
                another job. By linking a transaction Eve Industry Planner finds
                the associated tax and adds this to the cost of the job.
                {<br />}
                {<br />}
                As the items are sold in the game and the relevant transactions
                are linked, the total sales figure and average item price is
                calculated. This uses the earlier build costs, along with the
                brokers fees and taxes figures to calculate your overall
                profit/loss for this job.
                {<br />}
                {<br />}
                Once you have sold everything you can either delete the job and
                remove all the data or you can choose to archive the job saving
                all of the data for you to pull back at a later date in the same
                way as mentioned in the previous step.
              </Typography>
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
