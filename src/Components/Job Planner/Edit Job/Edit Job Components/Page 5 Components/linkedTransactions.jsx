import { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { Grid, IconButton, Paper, Typography } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import { MainUserContext } from "../../../../../Context/AuthContext";

export function LinkedTransactions({ setJobModified, activeOrder }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { mainUser, updateMainUser } = useContext(MainUserContext);

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
                    const tIndex = activeJob.build.sale.transactions.findIndex(
                      (trans) => trans.transaction_id === tData.transaction_id
                    );

                    let newTransArray = activeJob.build.sale.transactions;
                    newTransArray.splice(tIndex, 1);

                    const uIndex = mainUser.linkedTrans.findIndex(
                      (trans) => trans === tData.transaction_id
                    );
                    let newUserArray = mainUser.linkedTrans;

                    newUserArray.splice(uIndex, 1);

                    updateMainUser((prev) => ({
                      ...prev,
                      linkedTrans: newUserArray,
                    }));

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

                    setJobModified(true);
                  }}
                >
                  <RemoveIcon />
                </IconButton>
              </Grid>
            </Grid>
          );
          })) : (
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
