import { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { Grid, IconButton, Paper, Typography } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import { UsersContext } from "../../../../../Context/AuthContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";

export function LinkedTransactions({ setJobModified, activeOrder }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

  return (
    <Paper
      sx={{
        padding: "20px",
      }}
      elevation={3}
      square={true}
    >
      <Grid container direction="row">
        <Grid container item xs={12} sx={{ marginBottom: "20px" }}>
          <Grid item xs={12} md={11}>
            <Typography variant="h5" color="primary" align="center">
              Linked Transactions
            </Typography>
          </Grid>
        </Grid>
        {activeJob.build.sale.transactions.length !== 0 ? (
          activeJob.build.sale.transactions.map((tData) => {
            return (
              <Grid
                key={tData.transaction_id}
                container
                sx={{ marginBottom: "10px" }}
              >
                <Grid item xs={4} md={1} align="center">
                  <Typography variant="body1">
                    {new Date(tData.date).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3} align="center">
                  <Typography variant="body2">{tData.description}</Typography>
                </Grid>
                <Grid item xs={2} md={1} align="right">
                  <Typography variant="body1">
                    {tData.quantity.toLocaleString()} Items
                  </Typography>
                </Grid>
                <Grid item xs={4} md={2} align="right">
                  <Typography variant="body1">
                    {tData.unit_price.toLocaleString()} ISK Each
                  </Typography>
                </Grid>
                <Grid item xs={4} md={2} align="right">
                  <Typography variant="body1">
                    {tData.amount.toLocaleString()} ISK
                  </Typography>
                </Grid>
                <Grid item xs={4} md={2} align="right">
                  <Typography variant="body1">
                    -{tData.tax.toLocaleString()} ISK
                  </Typography>
                </Grid>
                <Grid item md={1} align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      const tIndex =
                        activeJob.build.sale.transactions.findIndex(
                          (trans) =>
                            trans.transaction_id === tData.transaction_id
                        );

                      let newTransArray = [...activeJob.build.sale.transactions];
                      newTransArray.splice(tIndex, 1);

                      const parentUserIndex = users.findIndex(
                        (i) => i.ParentUser === true
                      );

                      const uIndex = users[
                        parentUserIndex
                      ].linkedTrans.findIndex(
                        (trans) => trans === tData.transaction_id
                      );

                      let newUsersArray = [...users];

                      newUsersArray[parentUserIndex].linkedTrans.splice(
                        uIndex,
                        1
                      );

                      updateUsers(newUsersArray);

                      updateActiveJob((prev) => ({
                        ...prev,
                        build: {
                          ...prev.build,
                          sale: {
                            ...prev.build.sale,
                            transactions: newTransArray,
                          },
                        },
                      }));

                      setSnackbarData((prev) => ({
                        ...prev,
                        open: true,
                        message: "Unlinked",
                        severity: "error",
                        autoHideDuration: 1000,
                      }));

                      setJobModified(true);
                    }}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Grid>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12} align="center">
            <Typography variant="body1">
              There are currently no transactions linked to this market order.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
