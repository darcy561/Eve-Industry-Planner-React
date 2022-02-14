import { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import {
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { UsersContext } from "../../../../../Context/AuthContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { AddTransactionDialog } from "./addTransaction";

export function LinkedTransactions({ setJobModified, activeOrder }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const [newTransactionTrigger, updateNewTransactionTrigger] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Paper
        sx={{
          padding: "20px",
          position:"relative"
        }}
        elevation={3}
        square={true}
      >
        <Grid container direction="row">
          <Grid container item xs={12} sx={{ marginBottom: "20px" }}>
            <Grid item xs={12}>
              <Typography variant="h5" color="primary" align="center">
                Linked Transactions
              </Typography>
            </Grid>

              <IconButton
                id="linkedTransactions_menu_button"
                onClick={handleMenuClick}
                aria-controls={
                  Boolean(anchorEl) ? "linkedTransactions_menu" : undefined
                }
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl) ? "true" : undefined}
                sx={{position:"absolute", top:"10px", right:"10px"}}
              >
                <MoreVertIcon size="small" color="Secondary" />
              </IconButton>
              <Menu
                id="linkedTransactions_menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                MenuListProps={{
                  "aria-labelledby": "linkedTransactions_menu_button",
                }}
              >
                <MenuItem
                  onClick={() => {
                    updateNewTransactionTrigger(true);
                    setAnchorEl(null);
                  }}
                >
                  Add Manual Transaction
                </MenuItem>
              </Menu>
          </Grid>
          {activeJob.build.sale.transactions.length !== 0 ? (
            activeJob.build.sale.transactions.map((tData) => {
              return (
                <Grid
                  key={tData.transaction_id}
                  container
                  sx={{ marginBottom: "10px" }}
                >
                  <Grid
                    item
                    xs={4}
                    md={1}
                    align="center"
                    sx={{ marginBottom: { xs: "10px", sm: "0px" } }}
                  >
                    <Typography variant="body2">
                      {new Date(tData.date).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={2} align="center">
                    <Typography variant="body2">{tData.description}</Typography>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    md={2}
                    align="center"
                    sx={{ marginBottom: { xs: "10px", sm: "0px" } }}
                  >
                    <Typography variant="body2">
                      {tData.quantity.toLocaleString()}
                      {""}@ {tData.unit_price.toLocaleString()} ISK Each
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={2} align="center">
                    <Typography variant="body2">
                      {tData.amount.toLocaleString()} ISK
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={2} align="center">
                    <Typography variant="body2">
                      -{tData.tax.toLocaleString()} ISK
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={1} align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        const tIndex =
                          activeJob.build.sale.transactions.findIndex(
                            (trans) =>
                              trans.transaction_id === tData.transaction_id
                          );

                        let newTransArray = [
                          ...activeJob.build.sale.transactions,
                        ];
                        if (tIndex !== -1) {
                          newTransArray.splice(tIndex, 1);
                        }
                        const parentUserIndex = users.findIndex(
                          (i) => i.ParentUser === true
                        );

                        const uIndex = users[
                          parentUserIndex
                        ].linkedTrans.findIndex(
                          (trans) => trans === tData.transaction_id
                        );

                        let newUsersArray = [...users];
                        if (uIndex !== -1) {
                          newUsersArray[parentUserIndex].linkedTrans.splice(
                            uIndex,
                            1
                          );
                        }

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
                      <ClearIcon />
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
      <AddTransactionDialog
        setJobModified={setJobModified}
        newTransactionTrigger={newTransactionTrigger}
        updateNewTransactionTrigger={updateNewTransactionTrigger}
      />
    </>
  );
}
