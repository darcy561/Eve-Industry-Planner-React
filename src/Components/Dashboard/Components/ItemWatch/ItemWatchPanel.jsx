import { Grid, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { AddWatchItemDialog } from "./addItemDialog";
import { useContext, useMemo, useState } from "react";
import { UsersContext } from "../../../../Context/AuthContext";
import { WatchListRow } from "./ItemRow";

export function ItemWatchPanel() {
  const { users } = useContext(UsersContext);
  const [openDialog, setOpenDialog] = useState(false);

  const parentUser = useMemo(
    () => users.find((i) => i.ParentUser === true),
    [users]
  );

  return (
    <>
      <Paper
        sx={{
          padding: "20px",
          position: "relative",
          marginLeft: {
            xs: "5px",
            md: "10px",
          },
          marginRight: {
            xs: "5px",
            md: "10px",
          },
        }}
        square
        elevation={3}
      >
        <AddWatchItemDialog
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
        />
        <Grid container>
          <Grid item xs={12} sx={{ marginBottom: { xs: "20px", sm: "40px" } }}>
            <Typography variant="h5" color="primary" align="center">
              Item Watchlist
            </Typography>
          </Grid>
          <Tooltip title="Add Item To Watchlist" arrow placement="bottom">
            <IconButton
              color="primary"
              sx={{ position: "absolute", top: "10px", right: "10px" }}
              onClick={() => {
                setOpenDialog(true);
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Grid container item xs={12}>
            <Grid
              container
              item
              xs={12}
              sx={{
                marginBottom: "20px",
                display: { xs: "none", sm: "flex" },
              }}
            >
              <Grid item sm={4} lg={3} />
              <Grid item sm={2} lg={2}>
                <Typography
                  align="center"
                  sx={{ typography: { xs: "caption", sm: "body2" } }}
                >
                  Item Sell Price
                </Typography>
              </Grid>
              <Grid item sm={3} lg={3}>
                <Typography
                  align="center"
                  sx={{ typography: { xs: "caption", sm: "body2" } }}
                >
                  Total Material Purchase Cost Per Item (
                  {parentUser.settings.editJob.defaultOrders
                    .charAt(0)
                    .toUpperCase() +
                    parentUser.settings.editJob.defaultOrders.slice(1)}{" "}
                  Orders)
                </Typography>
              </Grid>
              <Grid item sm={3} lg={3}>
                <Typography
                  align="center"
                  sx={{ typography: { xs: "caption", sm: "body2" } }}
                >
                  Total Material Cost To Build Child Jobs Per Item (
                  {parentUser.settings.editJob.defaultOrders
                    .charAt(0)
                    .toUpperCase() +
                    parentUser.settings.editJob.defaultOrders.slice(1)}{" "}
                  Orders)
                </Typography>
              </Grid>
            </Grid>
            {parentUser.watchlist.length === 0 ? (
              <Typography> Empty</Typography>
            ) : (
              parentUser.watchlist.map((item, index) => {
                return (
                  <WatchListRow
                    key={item.id}
                    item={item}
                    parentUser={parentUser}
                    index={index}
                  />
                );
              })
            )}
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}
