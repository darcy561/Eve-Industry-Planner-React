import { Box, Grid, IconButton, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import { AddWatchItemDialogue } from "./AddItemDialogue/dialogueFrame";
import { useState } from "react";
import { useDialogueTrigger } from "../../../../Styled Components/Dialogue/ContentDialogue";
import { AddGroupDialogue } from "./addGroupDialogue";
import { GroupSettingsDialogue } from "./groupSettings";
import { WatchlistContainer } from "./itemWatchContainer";
import ContentPanel from "../../../../Styled Components/Paper/ContentPanel";

export function ItemWatchPanel() {
  const watchItemDialogue = useDialogueTrigger();
  const addGroupDialogue = useDialogueTrigger();
  const groupSettingsDialogue = useDialogueTrigger();
  const [watchlistItemToEdit, updateWatchlistItemToEdit] = useState(null);
  const [groupSettingsContent, updateGroupSettingsContent] = useState({
    name: "",
  });

  function addWatchlistItem() {
    updateWatchlistItemToEdit(null);
    watchItemDialogue.open();
  }

  function editWatchlistItem(index) {
    updateWatchlistItemToEdit(index);
    watchItemDialogue.open();
  }

  function openGroupSettings(group) {
    updateGroupSettingsContent(group);
    groupSettingsDialogue.open();
  }

  return (
    <ContentPanel
      title="Item Watchlist"
      componentName="Item Watchlist"
      paperSx={{ position: "relative" }}
    >
      {watchItemDialogue.isOpen && (
        <AddWatchItemDialogue
          onClose={watchItemDialogue.close}
          watchlistItemToEdit={watchlistItemToEdit}
        />
      )}
      {addGroupDialogue.isOpen && (
        <AddGroupDialogue onClose={addGroupDialogue.close} />
      )}
      {groupSettingsDialogue.isOpen && (
        <GroupSettingsDialogue
          onClose={groupSettingsDialogue.close}
          groupSettingsContent={groupSettingsContent}
        />
      )}
      <Grid container>
        <Box sx={{ position: "absolute", top: "10px", right: "10px" }}>
          <Tooltip title="Add New Watchlist Group" arrow placement="bottom">
            <IconButton color="primary" onClick={addGroupDialogue.open}>
              <PlaylistAddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Item To Watchlist" arrow placement="bottom">
            <IconButton color="primary" onClick={addWatchlistItem}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Grid container size={12}>
          <WatchlistContainer
            onOpenGroupSettings={openGroupSettings}
            onEditWatchlistItem={editWatchlistItem}
          />
        </Grid>
      </Grid>
    </ContentPanel>
  );
}
