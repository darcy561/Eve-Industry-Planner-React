import {
  Box,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import { AddWatchItemDialog } from "./addItemDialog";
import { useContext, useMemo, useState } from "react";
import { UsersContext } from "../../../../Context/AuthContext";
import { WatchListRow } from "./ItemRow";
import { WatchlistGroup } from "./watchlistGroup";
import { AddGroupDialog } from "./addGroupDialog";
import { GroupSettingsDialog } from "./groupSettings";

export function ItemWatchPanel() {
  const { users } = useContext(UsersContext);
  const [openDialog, setOpenDialog] = useState(false);
  const [addNewGroupTrigger, updateAddNewGroupTrigger] = useState(false);
  const [groupSettingsTrigger, updateGroupSettingsTrigger] = useState(false);
  const [groupSettingsContent, updateGroupSettingsContent] = useState({
    name: "",
  });

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

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
        <AddGroupDialog
          addNewGroupTrigger={addNewGroupTrigger}
          updateAddNewGroupTrigger={updateAddNewGroupTrigger}
        />
        <GroupSettingsDialog
          groupSettingsTrigger={groupSettingsTrigger}
          updateGroupSettingsTrigger={updateGroupSettingsTrigger}
          groupSettingsContent={groupSettingsContent}
        />
        <Grid container>
          <Grid item xs={12} sx={{ marginBottom: { xs: "20px", sm: "40px" } }}>
            <Typography variant="h5" color="primary" align="center">
              Item Watchlist
            </Typography>
          </Grid>
          <Box sx={{ position: "absolute", top: "10px", right: "10px" }}>
            <Tooltip title="Add New Watchlist Group" arrow placement="bottom">
              <IconButton
                color="primary"
                onClick={() => {
                  updateAddNewGroupTrigger((prev) => !prev);
                }}
              >
                <PlaylistAddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add Item To Watchlist" arrow placement="bottom">
              <IconButton
                color="primary"
                onClick={() => {
                  setOpenDialog(true);
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Grid container item xs={12}>
            {parentUser.watchlist.length > 0 && (
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
            )}
            {parentUser.watchlist.length === 0 ? (
              <Grid item xs={12} align="center">
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  You have no items on your watchlist.
                </Typography>
              </Grid>
            ) : (
              <>
                {parentUser.watchlist.groups.map((group, index) => {
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

                {parentUser.watchlist.items.map((item, index) => {
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
            )}
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}
