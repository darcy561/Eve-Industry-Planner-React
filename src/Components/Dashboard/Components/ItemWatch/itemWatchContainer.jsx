import { useContext } from "react";
import { CircularProgress, Grid, Typography } from "@mui/material";
import { UserWatchlistContext } from "../../../../Context/AuthContext";
import { WatchListRow } from "./ItemRow";
import { WatchlistGroup } from "./watchlistGroup";

export function WatchlistContainer({
  parentUser,
  updateGroupSettingsTrigger,
  groupSettingsContent,
  updateGroupSettingsContent,
}) {
  const { userWatchlist, userWatchlistDataFetch } =
    useContext(UserWatchlistContext);

  if (!userWatchlistDataFetch) {
    if (userWatchlist.items.length === 0) {
      return (
        <Grid item xs={12} align="center">
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            You have no items on your watchlist.
          </Typography>
        </Grid>
      );
    }

    if (userWatchlist.items.length > 0) {
      return (
        <>
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

          {userWatchlist.groups.map((group, index) => {
            return (
              <WatchlistGroup
                key={group.id}
                group={group}
                parentUser={parentUser}
                index={index}
                updateGroupSettingsTrigger={updateGroupSettingsTrigger}
                updateGroupSettingsContent={updateGroupSettingsContent}
                groupSettingsContent={groupSettingsContent}
              />
            );
          })}

          {userWatchlist.items.map((item, index) => {
            if (item.group === undefined || item.group === 0) {
              return (
                <WatchListRow
                  key={item.id}
                  item={item}
                  parentUser={parentUser}
                  index={index}
                />
              );
            }
            return null;
          })}
        </>
      );
    }
  } else {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12} align="center">
          <CircularProgress color="primary" />
        </Grid>
        <Grid item xs={12} align="center">
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            Updating Watchlist Data
          </Typography>
        </Grid>
      </Grid>
    );
  }
}
