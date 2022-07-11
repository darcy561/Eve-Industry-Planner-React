import { Grid, IconButton, Paper, Typography } from "@mui/material";
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
          <Grid item xs={12} sx={{ marginBottom: "20px" }}>
            <Typography variant="h5" color="primary" align="center">
              Item Watchlist
            </Typography>
          </Grid>
          <IconButton
            color="primary"
            sx={{ position: "absolute", top: "10px", right: "10px" }}
            onClick={() => {
              setOpenDialog(true);
            }}
          >
            <AddIcon />
          </IconButton>
          <Grid container item xs={12}>
            <Grid container item xs={12} sx={{ marginBottom: "20px" }}>
              <Grid item xs={5} sm={4} lg={3} />
              <Grid item xs={2} sm={2} lg={2}>
                <Typography
                  align="center"
                  sx={{ typography: { xs: "caption", sm: "body2" } }}
                >
                  Item Sell Price
                </Typography>
              </Grid>
              <Grid item xs={2} sm={3} lg={3}>
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
              <Grid item xs={2} sm={3} lg={3}>
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
