import { useContext } from "react";
import { Grid, Typography } from "@mui/material";
import { UserWatchlistContext } from "../../../../Context/AuthContext";
import { WatchListRow } from "./ItemRow";
import { WatchlistGroup } from "./watchlistGroup";
import { ApplicationSettingsContext } from "../../../../Context/LayoutContext";

export function WatchlistContainer({
  parentUser,
  updateGroupSettingsTrigger,
  groupSettingsContent,
  updateGroupSettingsContent,
  setOpenDialog,
  updateWatchlistItemToEdit,
}) {
  const { userWatchlist } = useContext(UserWatchlistContext);
  const { applicationSettings } = useContext(ApplicationSettingsContext);

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
              Total Est Build Cost Per Item
            </Typography>
            <Typography
              align="center"
              sx={{ typography: { xs: "caption", sm: "body2" } }}
            >
              (
              {applicationSettings.defaultOrders.charAt(0).toUpperCase() +
                applicationSettings.defaultOrders.slice(1)}{" "}
              Orders)
            </Typography>
          </Grid>
          <Grid item sm={3} lg={3}>
            <Typography
              align="center"
              sx={{ typography: { xs: "caption", sm: "body2" } }}
            >
              Total Est Build Cost With Child Jobs Per Item
            </Typography>
            <Typography
              align="center"
              sx={{ typography: { xs: "caption", sm: "body2" } }}
            >
              (
              {applicationSettings.defaultOrders.charAt(0).toUpperCase() +
                applicationSettings.defaultOrders.slice(1)}{" "}
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
              setOpenDialog={setOpenDialog}
              updateWatchlistItemToEdit={updateWatchlistItemToEdit}
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
                setOpenDialog={setOpenDialog}
                updateWatchlistItemToEdit={updateWatchlistItemToEdit}
              />
            );
          }
          return null;
        })}
      </>
    );
  }
}
